use std::path::PathBuf;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;

use git2::{Cred, CredentialType};

const MAX_RETRIES: usize = 3;

pub fn create_credentials_callback(
) -> impl FnMut(&str, Option<&str>, CredentialType) -> Result<Cred, git2::Error> {
    let attempts = Arc::new(AtomicUsize::new(0));

    move |url: &str, username: Option<&str>, allowed: CredentialType| {
        let count = attempts.fetch_add(1, Ordering::SeqCst);
        if count >= MAX_RETRIES {
            return Err(git2::Error::from_str(
                "authentication failed after maximum retries",
            ));
        }

        let user = username.unwrap_or("git");

        if allowed.contains(CredentialType::SSH_KEY) {
            if let Ok(cred) = Cred::ssh_key_from_agent(user) {
                return Ok(cred);
            }

            let home = dirs::home_dir().unwrap_or_else(|| PathBuf::from("~"));
            let ssh_dir = home.join(".ssh");

            for key_name in &["id_ed25519", "id_rsa"] {
                let key_path = ssh_dir.join(key_name);
                if key_path.exists() {
                    let pub_path = ssh_dir.join(format!("{key_name}.pub"));
                    let pub_ref = if pub_path.exists() {
                        Some(pub_path.as_path())
                    } else {
                        None
                    };

                    if let Ok(cred) = Cred::ssh_key(user, pub_ref, &key_path, None) {
                        return Ok(cred);
                    }
                }
            }
        }

        if allowed.contains(CredentialType::USER_PASS_PLAINTEXT) {
            if let Some(token) = std::env::var("GH_TOKEN")
                .ok()
                .or_else(|| std::env::var("GITHUB_TOKEN").ok())
            {
                return Cred::userpass_plaintext(user, &token);
            }

            if let Ok(cred) = credential_helper(url, user) {
                return Ok(cred);
            }
        }

        Cred::default()
    }
}

fn parse_url_parts(url: &str) -> (String, String) {
    if let Some(rest) = url.strip_prefix("https://") {
        let host = rest.split('/').next().unwrap_or(rest);
        ("https".to_string(), host.to_string())
    } else if let Some(rest) = url.strip_prefix("http://") {
        let host = rest.split('/').next().unwrap_or(rest);
        ("http".to_string(), host.to_string())
    } else {
        ("https".to_string(), url.to_string())
    }
}

fn credential_helper(url: &str, username: &str) -> Result<Cred, git2::Error> {
    let (protocol, host) = parse_url_parts(url);

    let output = std::process::Command::new("git")
        .args(["credential", "fill"])
        .stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::null())
        .spawn()
        .and_then(|mut child| {
            use std::io::Write;
            if let Some(ref mut stdin) = child.stdin {
                let _ = writeln!(stdin, "protocol={protocol}");
                let _ = writeln!(stdin, "host={host}");
                let _ = writeln!(stdin, "username={username}");
                let _ = writeln!(stdin);
            }
            child.wait_with_output()
        })
        .map_err(|e| git2::Error::from_str(&e.to_string()))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut password = None;
    for line in stdout.lines() {
        if let Some(pw) = line.strip_prefix("password=") {
            password = Some(pw.to_string());
            break;
        }
    }

    match password {
        Some(pw) => Cred::userpass_plaintext(username, &pw),
        None => Err(git2::Error::from_str(
            "credential helper returned no password",
        )),
    }
}
