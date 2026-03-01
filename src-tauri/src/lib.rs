use std::path::PathBuf;
use tauri::{AppHandle, Emitter, Manager};

// ─── Data Types ────────────────────────────────────────────

#[derive(serde::Serialize, serde::Deserialize, Clone)]
pub struct FileData {
    #[serde(rename = "filePath")]
    pub file_path: String,
    pub content: String,
}

// ─── Settings Store ────────────────────────────────────────

fn add_recent_file(app: &AppHandle, path: &str) {
    use tauri_plugin_store::StoreExt;
    let Ok(store) = app.store("settings.json") else { return };
    let mut recent: Vec<String> = store
        .get("recentFiles")
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();
    recent.retain(|f| f != path);
    recent.insert(0, path.to_string());
    recent.truncate(10);
    store.set("recentFiles", serde_json::json!(recent));
    let _ = store.save();
}

// ─── Tauri Commands ────────────────────────────────────────

#[tauri::command]
fn open_file(app: AppHandle) -> Result<Option<FileData>, String> {
    use tauri_plugin_dialog::{DialogExt, FilePath};
    let picked = app
        .dialog()
        .file()
        .add_filter("Markdown", &["md", "markdown", "mdown", "mkd"])
        .add_filter("Text", &["txt"])
        .add_filter("All Files", &["*"])
        .blocking_pick_file();

    match picked {
        Some(FilePath::Path(path)) => {
            let content = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
            let path_str = path.to_string_lossy().to_string();
            add_recent_file(&app, &path_str);
            Ok(Some(FileData { file_path: path_str, content }))
        }
        _ => Ok(None),
    }
}

#[tauri::command]
fn read_file(app: AppHandle, path: String) -> Result<FileData, String> {
    let content = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let resolved = std::fs::canonicalize(&path)
        .map(|p| {
            // On Windows, canonicalize returns \\?\ extended paths — strip the prefix
            let s = p.to_string_lossy().to_string();
            s.strip_prefix(r"\\?\").unwrap_or(&s).to_string()
        })
        .unwrap_or(path);
    add_recent_file(&app, &resolved);
    Ok(FileData { file_path: resolved, content })
}

#[tauri::command]
fn save_file(path: String, content: String) -> Result<(), String> {
    std::fs::write(&path, content).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_file_as(app: AppHandle, content: String) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::{DialogExt, FilePath};
    let picked = app
        .dialog()
        .file()
        .add_filter("Markdown", &["md"])
        .blocking_save_file();

    match picked {
        Some(FilePath::Path(path)) => {
            std::fs::write(&path, &content).map_err(|e| e.to_string())?;
            let path_str = path.to_string_lossy().to_string();
            add_recent_file(&app, &path_str);
            Ok(Some(path_str))
        }
        _ => Ok(None),
    }
}

#[tauri::command]
fn get_recent_files(app: AppHandle) -> Vec<String> {
    use tauri_plugin_store::StoreExt;
    let Ok(store) = app.store("settings.json") else { return vec![] };
    store
        .get("recentFiles")
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default()
}

#[tauri::command]
fn resolve_path(base: String, rel: String) -> String {
    let base_path = PathBuf::from(&base);
    let base_dir = base_path.parent().unwrap_or(&base_path);
    base_dir.join(&rel).to_string_lossy().to_string()
}

// ─── Helpers ────────────────────────────────────────────────

fn open_file_from_path(app: &AppHandle, path: &str) {
    if let Ok(content) = std::fs::read_to_string(path) {
        let resolved = std::fs::canonicalize(path)
            .map(|p| {
                let s = p.to_string_lossy().to_string();
                s.strip_prefix(r"\\?\").unwrap_or(&s).to_string()
            })
            .unwrap_or_else(|_| path.to_string());
        let _ = app.emit("file-opened", FileData { file_path: resolved.clone(), content });
        add_recent_file(app, &resolved);
    }
}

fn find_md_arg(args: &[String]) -> Option<String> {
    args.iter()
        .find(|a| {
            a.ends_with(".md")
                || a.ends_with(".markdown")
                || a.ends_with(".mdown")
                || a.ends_with(".mkd")
        })
        .cloned()
}

// ─── App Menu ──────────────────────────────────────────────

fn build_menu(app: &AppHandle) -> tauri::Result<()> {
    use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu};

    let open_item = MenuItem::with_id(app, "open-file", "Open File...", true, Some("CmdOrCtrl+O"))?;
    let close_tab = MenuItem::with_id(app, "close-tab", "Close Tab", true, Some("CmdOrCtrl+W"))?;
    let save = MenuItem::with_id(app, "save", "Save", true, Some("CmdOrCtrl+S"))?;
    let print = MenuItem::with_id(app, "print", "Export to PDF...", true, Some("CmdOrCtrl+P"))?;

    let file_menu = Submenu::with_items(
        app,
        "&File",
        true,
        &[
            &open_item,
            &close_tab,
            &PredefinedMenuItem::separator(app)?,
            &save,
            &PredefinedMenuItem::separator(app)?,
            &print,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::quit(app, None)?,
        ],
    )?;

    let toggle_edit = MenuItem::with_id(app, "toggle-edit", "Toggle Edit Mode", true, Some("CmdOrCtrl+E"))?;
    let toggle_toc = MenuItem::with_id(app, "toggle-toc", "Toggle Table of Contents", true, Some("CmdOrCtrl+Shift+T"))?;
    let toggle_theme = MenuItem::with_id(app, "toggle-theme", "Toggle Dark Mode", true, Some("CmdOrCtrl+Shift+D"))?;
    let find = MenuItem::with_id(app, "find", "Find", true, Some("CmdOrCtrl+F"))?;

    let view_menu = Submenu::with_items(
        app,
        "&View",
        true,
        &[
            &toggle_edit,
            &toggle_toc,
            &toggle_theme,
            &PredefinedMenuItem::separator(app)?,
            &find,
        ],
    )?;

    let about = MenuItem::with_id(app, "about", "About Markdown Viewer", true, None::<&str>)?;
    let help_menu = Submenu::with_items(app, "&Help", true, &[&about])?;

    let menu = Menu::with_items(app, &[&file_menu, &view_menu, &help_menu])?;
    app.set_menu(menu)?;

    app.on_menu_event(|app, event| {
        match event.id().0.as_str() {
            "about" => {
                use tauri_plugin_dialog::DialogExt;
                app.dialog()
                    .message("A lightweight desktop Markdown viewer with GitHub-style rendering.\n\nBuilt with Tauri + React + markdown-it + Shiki.")
                    .title("Markdown Viewer v1.0.0")
                    .blocking_show();
            }
            id => {
                let _ = app.emit(&format!("menu-{id}"), ());
            }
        }
    });

    Ok(())
}

// ─── App Entry ─────────────────────────────────────────────

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            // A second instance was launched — focus the existing window and open any file arg
            if let Some(path) = find_md_arg(&args) {
                open_file_from_path(app, &path);
            }
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let handle = app.handle().clone();

            // Open a file passed via CLI at startup (after UI loads)
            let args: Vec<String> = std::env::args().collect();
            if let Some(path) = find_md_arg(&args) {
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(600));
                    open_file_from_path(&handle, &path);
                });
            }

            build_menu(app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            open_file,
            read_file,
            save_file,
            save_file_as,
            get_recent_files,
            resolve_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application")
}
