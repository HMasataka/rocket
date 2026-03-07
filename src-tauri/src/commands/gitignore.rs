use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::{Mutex, OnceLock};
use std::time::{Duration, SystemTime};

fn cache() -> &'static Mutex<GitignoreCache> {
    static CACHE: OnceLock<Mutex<GitignoreCache>> = OnceLock::new();
    CACHE.get_or_init(|| Mutex::new(GitignoreCache::default()))
}

const CACHE_TTL: Duration = Duration::from_secs(3600);
const GITHUB_API_BASE: &str = "https://api.github.com/gitignore/templates";

#[derive(Default)]
struct GitignoreCache {
    templates: Option<(Vec<String>, SystemTime)>,
    contents: HashMap<String, (String, SystemTime)>,
}

fn cache_dir() -> Option<PathBuf> {
    dirs::cache_dir().map(|d| d.join("rocket").join("gitignore"))
}

#[tauri::command]
pub fn list_gitignore_templates() -> Result<Vec<String>, String> {
    {
        let c = cache().lock().map_err(|e| format!("Lock poisoned: {e}"))?;
        if let Some((ref list, fetched_at)) = c.templates {
            if fetched_at.elapsed().unwrap_or(Duration::MAX) < CACHE_TTL {
                return Ok(list.clone());
            }
        }
    }

    let client = reqwest::blocking::Client::new();
    let response = client
        .get(GITHUB_API_BASE)
        .header("User-Agent", "Rocket-Git-GUI")
        .send()
        .map_err(|e| format!("Failed to fetch templates: {e}"))?;

    let templates: Vec<String> = response
        .json()
        .map_err(|e| format!("Failed to parse response: {e}"))?;

    {
        let mut c = cache().lock().map_err(|e| format!("Lock poisoned: {e}"))?;
        c.templates = Some((templates.clone(), SystemTime::now()));
    }

    Ok(templates)
}

#[tauri::command]
pub fn get_gitignore_template(name: String) -> Result<String, String> {
    {
        let c = cache().lock().map_err(|e| format!("Lock poisoned: {e}"))?;
        if let Some((ref content, fetched_at)) = c.contents.get(&name) {
            if fetched_at.elapsed().unwrap_or(Duration::MAX) < CACHE_TTL {
                return Ok(content.clone());
            }
        }
    }

    // Check local file cache
    if let Some(dir) = cache_dir() {
        let file_path = dir.join(format!("{name}.gitignore"));
        if file_path.exists() {
            if let Ok(metadata) = file_path.metadata() {
                if let Ok(modified) = metadata.modified() {
                    if modified.elapsed().unwrap_or(Duration::MAX) < CACHE_TTL {
                        if let Ok(content) = fs::read_to_string(&file_path) {
                            let mut c =
                                cache().lock().map_err(|e| format!("Lock poisoned: {e}"))?;
                            c.contents
                                .insert(name.clone(), (content.clone(), SystemTime::now()));
                            return Ok(content);
                        }
                    }
                }
            }
        }
    }

    let url = format!("{GITHUB_API_BASE}/{name}");
    let client = reqwest::blocking::Client::new();
    let response = client
        .get(&url)
        .header("User-Agent", "Rocket-Git-GUI")
        .send()
        .map_err(|e| format!("Failed to fetch template '{name}': {e}"))?;

    let body: serde_json::Value = response
        .json()
        .map_err(|e| format!("Failed to parse template response: {e}"))?;

    let source = body["source"]
        .as_str()
        .ok_or_else(|| format!("Template '{name}' not found"))?
        .to_string();

    // Save to local file cache
    if let Some(dir) = cache_dir() {
        let _ = fs::create_dir_all(&dir);
        let file_path = dir.join(format!("{name}.gitignore"));
        let _ = fs::write(&file_path, &source);
    }

    {
        let mut c = cache().lock().map_err(|e| format!("Lock poisoned: {e}"))?;
        c.contents.insert(name, (source.clone(), SystemTime::now()));
    }

    Ok(source)
}
