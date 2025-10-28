use anyhow::{Context, Result};
use std::env;
use std::path::{Path, PathBuf};

fn project_root() -> Result<PathBuf> {
    let mut current = env::current_dir()?;
    let original = current.clone();
    loop {
        if current.join("pnpm-workspace.yaml").exists() {
            return Ok(current);
        }
        if !current.pop() {
            break;
        }
    }
    Ok(original)
}

fn main() -> Result<()> {
    let root = project_root()?;
    reset_watchman(&root)?;
    clear_caches(&root)?;
    println!("==> Clean complete. Restart Metro with: pnpm --filter apps/mobile start -- --clear");
    Ok(())
}

fn reset_watchman(root: &Path) -> Result<()> {
    println!("==> Resetting watchman state");
    if which::which("watchman").is_err() {
        eprintln!("warning: watchman is not installed; skipping watch reset");
        return Ok(());
    }
    let root_str = root
        .to_str()
        .context("project root contains invalid UTF-8")?;

    std::process::Command::new("watchman")
        .args(["watch-del", root_str])
        .status()
        .context("failed to execute watchman watch-del")?;
    std::process::Command::new("watchman")
        .args(["watch-project", root_str])
        .status()
        .context("failed to execute watchman watch-project")?;
    Ok(())
}

fn clear_caches(root: &Path) -> Result<()> {
    use walkdir::WalkDir;

    println!("==> Removing Metro caches");
    let mut targets = vec![
        root.join(".expo/web/cache"),
        root.join(".expo/web/tmp"),
        root.join(".expo/.metro"),
        root.join(".expo/.expo"),
        root.join(".metro-cache"),
        root.join("node_modules/.cache/metro"),
    ];

    for path in targets {
        if path.exists() {
            println!("Removing {}", path.display());
            if path.is_file() {
                std::fs::remove_file(&path)
                    .with_context(|| format!("failed to remove file {}", path.display()))?;
            } else {
                std::fs::remove_dir_all(&path)
                    .with_context(|| format!("failed to remove directory {}", path.display()))?;
            }
        }
    }

    let tmp_root = env::var_os("TMPDIR")
        .map(PathBuf::from)
        .or_else(|| dirs::cache_dir())
        .unwrap_or_else(|| PathBuf::from("/tmp"));

    for entry in WalkDir::new(&tmp_root)
        .max_depth(1)
        .into_iter()
        .filter_map(Result::ok)
        .filter(|e| e.file_type().is_dir())
    {
        let name = entry.file_name().to_string_lossy();
        if name.starts_with("metro-") {
            println!("Removing {}", entry.path().display());
            std::fs::remove_dir_all(entry.path()).with_context(|| {
                format!("failed to remove directory {}", entry.path().display())
            })?;
        }
    }

    Ok(())
}
