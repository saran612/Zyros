#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod commands;

use tauri::{
    CustomMenuItem, GlobalShortcutManager, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem
};
use zyros_core::CoreOrchestrator;

fn main() {
    let orchestrator = CoreOrchestrator::new(
        None, // localhost Ollama
        "llama3".to_string(), // Default local model
        vec!["systemctl".to_string(), "uname".to_string(), "cat".to_string(), "ip".to_string(), "ping".to_string(), "nmcli".to_string()], // allowlist
    );

    let tray_menu = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new("open_widget".to_string(), "Open Widget"))
        .add_item(CustomMenuItem::new("open_terminal".to_string(), "Open Terminal"))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(CustomMenuItem::new("quit".to_string(), "Quit"));

    let system_tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .manage(orchestrator)
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "open_widget" => {
                    if let Some(w) = app.get_window("widget") {
                        let _ = w.show();
                        let _ = w.set_focus();
                    }
                }
                "open_terminal" => {
                    if let Some(w) = app.get_window("terminal") {
                        let _ = w.show();
                        let _ = w.set_focus();
                    }
                }
                "quit" => {
                    std::process::exit(0);
                }
                _ => {}
            },
            _ => {}
        })
        .setup(|app| {
            let app_handle = app.handle();
            let mut shortcut_manager = app_handle.global_shortcut_manager();
            
            // Register Ctrl+Shift+Z to toggle the widget window
            let _ = shortcut_manager.register("Ctrl+Shift+Z", move || {
                if let Some(w) = app_handle.get_window("widget") {
                    if w.is_visible().unwrap_or(false) {
                        let _ = w.hide();
                    } else {
                        let _ = w.show();
                        let _ = w.set_focus();
                    }
                }
            });
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![commands::ask_zyros])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
