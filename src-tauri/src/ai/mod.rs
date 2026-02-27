pub mod adapter;
pub mod conflict;
pub mod detector;
pub mod pr;
pub mod prompt;
pub mod review;
pub mod types;

pub fn strip_code_fences(s: &str) -> &str {
    let s = s
        .strip_prefix("```json")
        .or_else(|| s.strip_prefix("```"))
        .unwrap_or(s);
    let s = s.strip_suffix("```").unwrap_or(s);
    s.trim()
}
