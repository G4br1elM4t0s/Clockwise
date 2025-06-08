use tauri::{Manager, WebviewWindow, LogicalPosition, PhysicalSize};
use std::thread;
use std::time::Duration;

// Função auxiliar para configurar a janela
fn configure_window_settings(window: &WebviewWindow) -> Result<(), Box<dyn std::error::Error>> {
    println!("Rust: Aplicando configurações à janela: {}", window.label());

    // Primeiro, configurações básicas
    window.set_decorations(false)?;
    window.set_skip_taskbar(true)?;
    window.set_fullscreen(false)?;

    // Definir tamanho inicial grande para evitar restrições do WM
    window.set_size(PhysicalSize::new(1920, 200))?;
    thread::sleep(Duration::from_millis(100));

    // Depois reduzir para o tamanho desejado
    let target_physical_size = PhysicalSize::new(1920, 32);
    window.set_size(target_physical_size)?;

    // Posição
    window.set_position(LogicalPosition::new(0.0, 0.0))?;

    // Por último, always on top
    window.set_always_on_top(true)?;

    // Verificar tamanho
    if let Ok(size) = window.outer_size() {
        println!(
            "Rust: Tamanho atual da janela '{}': {:?}",
            window.label(),
            size
        );
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                let app_handle = app.handle().clone();
                app_handle.plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let main_window = app.get_webview_window("main")
                .ok_or_else(|| "Janela 'main' não encontrada.")?;

            // Primeira configuração imediata
            if let Err(e) = configure_window_settings(&main_window) {
                eprintln!("Rust: Erro na configuração inicial: {}", e);
            }

            // Configurações com delays
            let delays = [500, 1000]; // Menos tentativas, mais espaçadas

            for delay in delays.iter() {
                let main_window_clone = main_window.clone();
                let app_handle_clone = app.handle().clone();
                let delay = *delay;

                app_handle_clone.run_on_main_thread(move || {
                    std::thread::sleep(std::time::Duration::from_millis(delay));
                    println!("Rust: Tentativa após {}ms para janela '{}'", delay, main_window_clone.label());

                    if let Err(e) = configure_window_settings(&main_window_clone) {
                        eprintln!("Rust: Erro na tentativa após {}ms: {}", delay, e);
                    }

                    // Verificar tamanho após configuração
                    if let Ok(size) = main_window_clone.outer_size() {
                        println!("Rust: Após {}ms - Tamanho: {:?}", delay, size);
                    }
                })?;
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Erro ao executar a aplicação Tauri");
}
