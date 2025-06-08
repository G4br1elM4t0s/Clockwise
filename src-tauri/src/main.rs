use std::process::Command;
use std::thread;
use std::time::{Duration, Instant};
use std::sync::{Arc, Mutex};

use tauri::{Manager, PhysicalSize, PhysicalPosition, Emitter};
use tauri::State;
use global_hotkey::{GlobalHotKeyManager, hotkey::{HotKey, Modifiers, Code}, GlobalHotKeyEvent};
use rusqlite::{Connection, Result as SqliteResult};
use chrono::Utc;
use serde::{Deserialize, Serialize};

// Estado compartilhado para controlar se está colapsado
static COLLAPSED_STATE: Mutex<bool> = Mutex::new(false);
// Último tempo que o atalho foi executado (para debounce)
static LAST_HOTKEY_TIME: Mutex<Option<Instant>> = Mutex::new(None);

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Task {
    id: Option<i64>,
    name: String,
    user: String,
    estimated_hours: f64,
    scheduled_date: String,
    status: String,
    created_at: String,
    started_at: Option<String>,
    completed_at: Option<String>,
}

struct DatabaseState {
    connection: Arc<Mutex<Connection>>,
}

fn init_database() -> SqliteResult<Connection> {
    let conn = Connection::open("tasks.db")?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            user TEXT NOT NULL,
            estimated_hours REAL NOT NULL,
            scheduled_date TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TEXT NOT NULL,
            started_at TEXT,
            completed_at TEXT
        )",
        [],
    )?;

    Ok(conn)
}

#[tauri::command]
async fn toggle_collapse(window: tauri::WebviewWindow, is_collapsed: bool) -> Result<(), String> {
    println!("🔧 toggle_collapse chamado com is_collapsed: {}", is_collapsed);

    // Atualizar o estado global
    if let Ok(mut state) = COLLAPSED_STATE.lock() {
        *state = is_collapsed;
        println!("🔧 Estado global atualizado para: {}", *state);
    }

    let new_height = if is_collapsed { 1 } else { 55 };
    println!("🔧 Tentando redimensionar janela para altura: {}", new_height);

    // Primeiro, tentar redimensionar
    match window.set_size(PhysicalSize::new(1920, new_height)) {
        Ok(_) => println!("✓ Janela redimensionada com sucesso para {}px", new_height),
        Err(e) => {
            println!("✗ Erro ao redimensionar janela: {}", e);
            return Err(e.to_string());
        }
    }

    // Se colapsada, também mover para posição específica
    if is_collapsed {
        println!("🔧 Movendo janela colapsada para posição (-1, -1)");
        match window.set_position(PhysicalPosition::new(-1, -1)) {
            Ok(_) => println!("✓ Janela movida para posição colapsada"),
            Err(e) => println!("✗ Erro ao mover janela: {}", e),
        }
    } else {
        println!("🔧 Restaurando janela para posição (0, 0)");
        match window.set_position(PhysicalPosition::new(0, 0)) {
            Ok(_) => println!("✓ Janela restaurada para posição normal"),
            Err(e) => println!("✗ Erro ao restaurar janela: {}", e),
        }
    }

    // Aguardar um pouco e verificar o tamanho atual
    thread::sleep(Duration::from_millis(100));

    match window.inner_size() {
        Ok(size) => println!("🔧 Tamanho atual da janela: {}x{}", size.width, size.height),
        Err(e) => println!("✗ Erro ao obter tamanho da janela: {}", e),
    }

    #[cfg(target_os = "linux")]
    {
        println!("🔧 Aplicando configurações wmctrl...");
        thread::sleep(Duration::from_millis(200));

        if let Ok(output) = Command::new("wmctrl").args(["-l"]).output() {
            let window_list = String::from_utf8_lossy(&output.stdout);
            println!("🔧 Procurando janela na lista wmctrl...");

            for line in window_list.lines() {
                if line.contains("ClockWise") || line.contains("app") || line.contains("Clockwise") {
                    let window_id = line.split_whitespace().next().unwrap_or("");
                    println!("🔧 Encontrada janela ID: {} -> {}", window_id, line);

                    if is_collapsed {
                        println!("🔧 Aplicando configuração colapsada via wmctrl");
                        // Tentar diferentes abordagens para colapsar
                        let commands = vec![
                            vec!["-i", "-r", window_id, "-e", "0,0,-50,1920,1"],
                            vec!["-i", "-r", window_id, "-e", "0,-1,-1,1920,1"],
                            vec!["-i", "-r", window_id, "-b", "add,hidden"],
                        ];

                        for cmd in commands {
                            match Command::new("wmctrl").args(&cmd).output() {
                                Ok(_) => println!("✓ Comando wmctrl executado: {:?}", cmd),
                                Err(e) => println!("✗ Erro no comando wmctrl {:?}: {}", cmd, e),
                            }
                        }
                    } else {
                        println!("🔧 Aplicando configuração expandida via wmctrl");
                        let commands = vec![
                            vec!["-i", "-r", window_id, "-b", "remove,hidden"],
                            vec!["-i", "-r", window_id, "-e", "0,0,0,1920,55"],
                            vec!["-i", "-r", window_id, "-b", "add,above"],
                        ];

                        for cmd in commands {
                            match Command::new("wmctrl").args(&cmd).output() {
                                Ok(_) => println!("✓ Comando wmctrl executado: {:?}", cmd),
                                Err(e) => println!("✗ Erro no comando wmctrl {:?}: {}", cmd, e),
                            }
                        }
                    }
                    break;
                }
            }
        } else {
            println!("✗ wmctrl não disponível");
        }
    }

    println!("🔧 toggle_collapse finalizado");
    Ok(())
}

#[tauri::command]
async fn get_collapsed_state() -> Result<bool, String> {
    let state = COLLAPSED_STATE.lock()
        .map(|state| *state)
        .map_err(|e| e.to_string())?;
    println!("🔧 get_collapsed_state retornando: {}", state);
    Ok(state)
}

#[tauri::command]
async fn test_hotkey_manually(window: tauri::WebviewWindow) -> Result<(), String> {
    println!("🔧 Teste manual do atalho executado!");

    // Alternar estado manualmente
    let new_state = if let Ok(state) = COLLAPSED_STATE.lock() {
        !*state
    } else {
        false
    };

    println!("🔧 Novo estado será: {}", new_state);

    // Chamar toggle_collapse para aplicar as mudanças
    toggle_collapse(window, new_state).await?;

    Ok(())
}

fn should_process_hotkey() -> bool {
    if let Ok(mut last_time) = LAST_HOTKEY_TIME.lock() {
        let now = Instant::now();

        if let Some(last) = *last_time {
            // Se passou menos de 500ms desde o último atalho, ignorar
            if now.duration_since(last) < Duration::from_millis(500) {
                println!("🔧 Atalho ignorado (debounce)");
                return false;
            }
        }

        *last_time = Some(now);
        true
    } else {
        false
    }
}

#[tauri::command]
async fn get_system_volume() -> Result<i32, String> {
    #[cfg(target_os = "linux")]
    {
        // Usar pactl para obter o volume no Linux
        match Command::new("pactl")
            .args(["get-sink-volume", "@DEFAULT_SINK@"])
            .output()
        {
            Ok(output) => {
                let output_str = String::from_utf8_lossy(&output.stdout);
                // Procurar por porcentagem no formato "XX%"
                for line in output_str.lines() {
                    if let Some(percent_pos) = line.find('%') {
                        // Procurar o número antes do %
                        let before_percent = &line[..percent_pos];
                        if let Some(space_pos) = before_percent.rfind(' ') {
                            let volume_str = &before_percent[space_pos + 1..];
                            if let Ok(volume) = volume_str.parse::<i32>() {
                                return Ok(volume);
                            }
                        }
                    }
                }
                Ok(50) // Fallback
            }
            Err(_) => Ok(50) // Fallback se pactl não estiver disponível
        }
    }

    #[cfg(not(target_os = "linux"))]
    {
        // Para outros sistemas, retornar um valor padrão por enquanto
        Ok(50)
    }
}

#[tauri::command]
async fn set_system_volume(volume: i32) -> Result<(), String> {
    let clamped_volume = volume.clamp(0, 100);

    #[cfg(target_os = "linux")]
    {
        // Usar pactl para definir o volume no Linux
        match Command::new("pactl")
            .args(["set-sink-volume", "@DEFAULT_SINK@", &format!("{}%", clamped_volume)])
            .output()
        {
            Ok(_) => {
                println!("🔊 Volume definido para {}%", clamped_volume);
                Ok(())
            }
            Err(e) => {
                println!("✗ Erro ao definir volume: {}", e);
                Err(format!("Erro ao definir volume: {}", e))
            }
        }
    }

    #[cfg(not(target_os = "linux"))]
    {
        println!("🔊 Volume seria definido para {}% (não implementado para este OS)", clamped_volume);
        Ok(())
    }
}

#[tauri::command]
async fn get_system_mute_status() -> Result<bool, String> {
    #[cfg(target_os = "linux")]
    {
        match Command::new("pactl")
            .args(["get-sink-mute", "@DEFAULT_SINK@"])
            .output()
        {
            Ok(output) => {
                let output_str = String::from_utf8_lossy(&output.stdout);
                Ok(output_str.trim() == "yes")
            }
            Err(_) => Ok(false)
        }
    }

    #[cfg(not(target_os = "linux"))]
    {
        Ok(false)
    }
}

#[tauri::command]
async fn toggle_system_mute() -> Result<bool, String> {
    #[cfg(target_os = "linux")]
    {
        match Command::new("pactl")
            .args(["set-sink-mute", "@DEFAULT_SINK@", "toggle"])
            .output()
        {
            Ok(_) => {
                // Obter o novo status após o toggle
                get_system_mute_status().await
            }
            Err(e) => Err(format!("Erro ao alternar mute: {}", e))
        }
    }

    #[cfg(not(target_os = "linux"))]
    {
        Ok(false)
    }
}

#[tauri::command]
async fn load_tasks(db_state: State<'_, DatabaseState>) -> Result<Vec<Task>, String> {
    let conn = db_state.connection.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT id, name, user, estimated_hours, scheduled_date, status, created_at, started_at, completed_at
         FROM tasks ORDER BY scheduled_date ASC, created_at ASC"
    ).map_err(|e| e.to_string())?;

    let task_iter = stmt.query_map([], |row| {
        Ok(Task {
            id: Some(row.get(0)?),
            name: row.get(1)?,
            user: row.get(2)?,
            estimated_hours: row.get(3)?,
            scheduled_date: row.get(4)?,
            status: row.get(5)?,
            created_at: row.get(6)?,
            started_at: row.get(7)?,
            completed_at: row.get(8)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut tasks = Vec::new();
    for task in task_iter {
        tasks.push(task.map_err(|e| e.to_string())?);
    }

    Ok(tasks)
}

#[tauri::command]
async fn add_task(
    name: String,
    user: String,
    estimated_hours: f64,
    scheduled_date: String,
    db_state: State<'_, DatabaseState>
) -> Result<Task, String> {
    let conn = db_state.connection.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO tasks (name, user, estimated_hours, scheduled_date, status, created_at)
         VALUES (?1, ?2, ?3, ?4, 'pending', ?5)",
        [&name, &user, &estimated_hours.to_string(), &scheduled_date, &now],
    ).map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    Ok(Task {
        id: Some(id),
        name,
        user,
        estimated_hours,
        scheduled_date,
        status: "pending".to_string(),
        created_at: now,
        started_at: None,
        completed_at: None,
    })
}

#[tauri::command]
async fn start_task(task_id: i64, db_state: State<'_, DatabaseState>) -> Result<(), String> {
    let conn = db_state.connection.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "UPDATE tasks SET status = 'in_progress', started_at = ?1 WHERE id = ?2",
        [&now, &task_id.to_string()],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn complete_task(task_id: i64, db_state: State<'_, DatabaseState>) -> Result<(), String> {
    let conn = db_state.connection.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "UPDATE tasks SET status = 'completed', completed_at = ?1 WHERE id = ?2",
        [&now, &task_id.to_string()],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn delete_task(task_id: i64, db_state: State<'_, DatabaseState>) -> Result<(), String> {
    let conn = db_state.connection.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "DELETE FROM tasks WHERE id = ?1",
        [&task_id.to_string()],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn get_today_tasks(db_state: State<'_, DatabaseState>) -> Result<Vec<Task>, String> {
    let conn = db_state.connection.lock().map_err(|e| e.to_string())?;
    let today = chrono::Local::now().format("%Y-%m-%d").to_string();

    let mut stmt = conn.prepare(
        "SELECT id, name, user, estimated_hours, scheduled_date, status, created_at, started_at, completed_at
         FROM tasks WHERE scheduled_date = ?1 ORDER BY created_at ASC"
    ).map_err(|e| e.to_string())?;

    let task_iter = stmt.query_map([&today], |row| {
        Ok(Task {
            id: Some(row.get(0)?),
            name: row.get(1)?,
            user: row.get(2)?,
            estimated_hours: row.get(3)?,
            scheduled_date: row.get(4)?,
            status: row.get(5)?,
            created_at: row.get(6)?,
            started_at: row.get(7)?,
            completed_at: row.get(8)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut tasks = Vec::new();
    for task in task_iter {
        tasks.push(task.map_err(|e| e.to_string())?);
    }

    Ok(tasks)
}

#[tauri::command]
async fn expand_window_for_modal(window: tauri::WebviewWindow) -> Result<(), String> {
    println!("🔧 Expandindo janela para modal...");

    match window.set_size(PhysicalSize::new(1920, 500)) {
        Ok(_) => {
            println!("✓ Janela expandida para 500px");

            // Garantir que a janela esteja visível e na posição correta
            match window.set_position(PhysicalPosition::new(0, 0)) {
                Ok(_) => println!("✓ Posição da janela ajustada"),
                Err(e) => println!("✗ Erro ao ajustar posição: {}", e),
            }

            #[cfg(target_os = "linux")]
            {
                // Aplicar configurações do wmctrl para garantir
                if let Ok(output) = Command::new("wmctrl").args(["-l"]).output() {
                    let window_list = String::from_utf8_lossy(&output.stdout);
                    for line in window_list.lines() {
                        if line.contains("ClockWise") || line.contains("app") || line.contains("Clockwise") {
                            let window_id = line.split_whitespace().next().unwrap_or("");
                            let _ = Command::new("wmctrl")
                                .args(["-i", "-r", window_id, "-e", "0,0,0,1920,500"])
                                .output();
                        }
                    }
                }
            }

            Ok(())
        },
        Err(e) => {
            println!("✗ Erro ao expandir janela: {}", e);
            Err(e.to_string())
        }
    }
}

#[tauri::command]
async fn reset_window_size(window: tauri::WebviewWindow) -> Result<(), String> {
    println!("🔧 Resetando tamanho da janela...");

    match window.set_size(PhysicalSize::new(1920, 55)) {
        Ok(_) => {
            println!("✓ Janela resetada para 55px");

            match window.set_position(PhysicalPosition::new(0, 0)) {
                Ok(_) => println!("✓ Posição da janela ajustada"),
                Err(e) => println!("✗ Erro ao ajustar posição: {}", e),
            }

            #[cfg(target_os = "linux")]
            {
                if let Ok(output) = Command::new("wmctrl").args(["-l"]).output() {
                    let window_list = String::from_utf8_lossy(&output.stdout);
                    for line in window_list.lines() {
                        if line.contains("ClockWise") || line.contains("app") || line.contains("Clockwise") {
                            let window_id = line.split_whitespace().next().unwrap_or("");
                            let _ = Command::new("wmctrl")
                                .args(["-i", "-r", window_id, "-e", "0,0,0,1920,55"])
                                .output();
                        }
                    }
                }
            }

            Ok(())
        },
        Err(e) => {
            println!("✗ Erro ao resetar janela: {}", e);
            Err(e.to_string())
        }
    }
}

fn main() {
    println!("Iniciando aplicação ClockWise...");

    // Tentar configurar atalho global
    println!("Criando GlobalHotKeyManager...");
    let global_hotkey_manager = match GlobalHotKeyManager::new() {
        Ok(manager) => {
            println!("✓ GlobalHotKeyManager criado com sucesso");
            Some(Arc::new(manager))
        }
        Err(e) => {
            eprintln!("✗ Erro ao criar GlobalHotKeyManager: {}", e);
            None
        }
    };

    // Tentar registrar o atalho global
    let hotkey_registered = if let Some(ref manager) = global_hotkey_manager {
        let hotkey = HotKey::new(Some(Modifiers::ALT), Code::KeyC);
        println!("Registrando atalho Alt+C (ID: {})...", hotkey.id());

        match manager.register(hotkey) {
            Ok(_) => {
                println!("✓ Atalho global Alt+C registrado com sucesso!");
                true
            }
            Err(e) => {
                eprintln!("✗ Erro ao registrar atalho global: {}", e);
                false
            }
        }
    } else {
        false
    };

    let conn = init_database().expect("Failed to initialize database");
    let db_state = DatabaseState {
        connection: Arc::new(Mutex::new(conn)),
    };

    tauri::Builder::default()
        .manage(db_state)
        .invoke_handler(tauri::generate_handler![
            toggle_collapse,
            get_collapsed_state,
            test_hotkey_manually,
            get_system_volume,
            set_system_volume,
            get_system_mute_status,
            toggle_system_mute,
            load_tasks,
            add_task,
            start_task,
            complete_task,
            delete_task,
            get_today_tasks,
            expand_window_for_modal,
            reset_window_size
        ])
        .setup(move |app| {
            let handle = app.handle();
            let window = handle.get_webview_window("main").unwrap();

            // Configurar tamanho e posição inicial
            window.set_size(PhysicalSize::new(1920, 55))?;
            window.set_position(PhysicalPosition::new(0, 0))?;

            // Thread para monitorar mudanças de volume do sistema
            let window_for_volume = window.clone();
            thread::spawn(move || {
                let mut last_volume = 50;
                let mut last_mute = false;

                loop {
                    thread::sleep(Duration::from_millis(1000)); // Verificar a cada segundo

                    // Verificar volume atual
                    if let Ok(output) = Command::new("pactl")
                        .args(["get-sink-volume", "@DEFAULT_SINK@"])
                        .output()
                    {
                        let output_str = String::from_utf8_lossy(&output.stdout);
                        for line in output_str.lines() {
                            if let Some(percent_pos) = line.find('%') {
                                let before_percent = &line[..percent_pos];
                                if let Some(space_pos) = before_percent.rfind(' ') {
                                    let volume_str = &before_percent[space_pos + 1..];
                                    if let Ok(current_volume) = volume_str.parse::<i32>() {
                                        if current_volume != last_volume {
                                            last_volume = current_volume;
                                            let _ = window_for_volume.emit("volume-changed", current_volume);
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Verificar status de mute
                    if let Ok(output) = Command::new("pactl")
                        .args(["get-sink-mute", "@DEFAULT_SINK@"])
                        .output()
                    {
                        let output_str = String::from_utf8_lossy(&output.stdout);
                        let current_mute = output_str.trim() == "yes";
                        if current_mute != last_mute {
                            last_mute = current_mute;
                            let _ = window_for_volume.emit("mute-changed", current_mute);
                        }
                    }
                }
            });

            // Se conseguiu registrar o atalho global, configurar o listener
            if hotkey_registered {
                let window_clone = window.clone();

                thread::spawn(move || {
                    let receiver = GlobalHotKeyEvent::receiver();
                    println!("🎯 Thread de atalho global iniciada, aguardando eventos...");
                    println!("   Pressione Alt+C para testar o atalho global");

                    loop {
                        match receiver.try_recv() {
                            Ok(event) => {
                                println!("📨 Evento recebido: ID={}", event.id);

                                // Verificar debounce
                                if !should_process_hotkey() {
                                    continue;
                                }

                                println!("🎉 Alt+C detectado globalmente!");

                                // Alternar estado
                                let new_state = if let Ok(state) = COLLAPSED_STATE.lock() {
                                    let current = *state;
                                    println!("🔧 Estado atual: {}, novo estado será: {}", current, !current);
                                    !current
                                } else {
                                    println!("🔧 Erro ao ler estado, usando false");
                                    false
                                };

                                // Emitir evento para o frontend
                                match window_clone.emit("global-hotkey-pressed", new_state) {
                                    Ok(_) => println!("✓ Evento emitido para o frontend"),
                                    Err(e) => eprintln!("✗ Erro ao emitir evento: {}", e),
                                }

                                // Aplicar as mudanças na janela diretamente
                                let window_for_toggle = window_clone.clone();
                                tauri::async_runtime::spawn(async move {
                                    if let Err(e) = toggle_collapse(window_for_toggle, new_state).await {
                                        eprintln!("✗ Erro ao aplicar toggle_collapse: {}", e);
                                    }
                                });
                            }
                            Err(_) => {
                                // Não há eventos, continuar silenciosamente
                            }
                        }
                        thread::sleep(Duration::from_millis(50));
                    }
                });
            } else {
                println!("⚠️  Atalho global não foi registrado. Use o botão de teste manual na interface.");
            }

            #[cfg(target_os = "linux")]
            {
                // Esperar um pouco para a janela ser criada
                thread::sleep(Duration::from_millis(500));

                // Tentar encontrar e configurar a janela usando wmctrl
                if let Ok(output) = Command::new("wmctrl")
                    .args(["-l"])
                    .output()
                {
                    let window_list = String::from_utf8_lossy(&output.stdout);

                    // Procurar pela nossa janela
                    for line in window_list.lines() {
                        if line.contains("ClockWise") || line.contains("app") {
                            let window_id = line.split_whitespace().next().unwrap_or("");

                            // Configurar a janela como dock
                            let _ = Command::new("wmctrl")
                                .args(["-i", "-r", window_id, "-b", "add,above"])
                                .output();

                            // Forçar o tamanho
                            let _ = Command::new("wmctrl")
                                .args(["-i", "-r", window_id, "-e", "0,0,0,1920,55"])
                                .output();

                            println!("Rust: Configurações wmctrl aplicadas");
                            break;
                        }
                    }
                } else {
                    println!("Rust: wmctrl não encontrado. Por favor, instale com: sudo apt install wmctrl");
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;
    use tauri::test::MockWebviewWindow;

    // Teste para expand_window_for_modal
    #[tokio::test]
    async fn test_expand_window_for_modal() {
        let mock_window = MockWebviewWindow::new();

        // Teste expandir janela
        let result = expand_window_for_modal(mock_window.clone()).await;
        assert!(result.is_ok(), "Deveria expandir a janela com sucesso");

        // Verificar se o tamanho foi definido corretamente
        let size = mock_window.size().unwrap();
        assert_eq!(size.width, 1920);
        assert_eq!(size.height, 500);

        // Verificar posição
        let position = mock_window.position().unwrap();
        assert_eq!(position.x, 0);
        assert_eq!(position.y, 0);
    }

    // Teste para reset_window_size
    #[tokio::test]
    async fn test_reset_window_size() {
        let mock_window = MockWebviewWindow::new();

        // Teste resetar tamanho
        let result = reset_window_size(mock_window.clone()).await;
        assert!(result.is_ok(), "Deveria resetar a janela com sucesso");

        // Verificar se o tamanho foi resetado corretamente
        let size = mock_window.size().unwrap();
        assert_eq!(size.width, 1920);
        assert_eq!(size.height, 55);

        // Verificar posição
        let position = mock_window.position().unwrap();
        assert_eq!(position.x, 0);
        assert_eq!(position.y, 0);
    }

    // Testes para as funções de tarefa
    #[tokio::test]
    async fn test_task_lifecycle() {
        // Criar conexão de teste
        let conn = Connection::open_in_memory().unwrap();
        init_database_schema(&conn).unwrap();

        let db_state = DatabaseState {
            connection: Arc::new(Mutex::new(conn)),
        };

        // Teste adicionar tarefa
        let task = add_task(
            "Teste".to_string(),
            "Usuário".to_string(),
            2.0,
            "2024-03-14".to_string(),
            State::new(db_state.clone())
        ).await;
        assert!(task.is_ok(), "Deveria criar tarefa com sucesso");
        let task = task.unwrap();

        // Teste iniciar tarefa
        let start_result = start_task(
            task.id.unwrap(),
            State::new(db_state.clone())
        ).await;
        assert!(start_result.is_ok(), "Deveria iniciar tarefa com sucesso");

        // Verificar se apenas uma tarefa pode estar ativa
        let another_task = add_task(
            "Outra".to_string(),
            "Usuário".to_string(),
            1.0,
            "2024-03-14".to_string(),
            State::new(db_state.clone())
        ).await.unwrap();

        let start_another = start_task(
            another_task.id.unwrap(),
            State::new(db_state.clone())
        ).await;
        assert!(start_another.is_err(), "Não deveria permitir iniciar outra tarefa");

        // Teste completar tarefa
        let complete_result = complete_task(
            task.id.unwrap(),
            State::new(db_state.clone())
        ).await;
        assert!(complete_result.is_ok(), "Deveria completar tarefa com sucesso");

        // Teste deletar tarefa
        let delete_result = delete_task(
            task.id.unwrap(),
            State::new(db_state.clone())
        ).await;
        assert!(delete_result.is_ok(), "Deveria deletar tarefa com sucesso");
    }

    // Teste para get_today_tasks
    #[tokio::test]
    async fn test_get_today_tasks() {
        // Criar conexão de teste
        let conn = Connection::open_in_memory().unwrap();
        init_database_schema(&conn).unwrap();

        let db_state = DatabaseState {
            connection: Arc::new(Mutex::new(conn)),
        };

        // Adicionar algumas tarefas
        let today = chrono::Local::now().format("%Y-%m-%d").to_string();
        let yesterday = (chrono::Local::now() - chrono::Duration::days(1))
            .format("%Y-%m-%d").to_string();

        // Tarefa de hoje
        add_task(
            "Hoje".to_string(),
            "Usuário".to_string(),
            1.0,
            today.clone(),
            State::new(db_state.clone())
        ).await.unwrap();

        // Tarefa de ontem
        add_task(
            "Ontem".to_string(),
            "Usuário".to_string(),
            1.0,
            yesterday,
            State::new(db_state.clone())
        ).await.unwrap();

        // Buscar tarefas de hoje
        let today_tasks = get_today_tasks(State::new(db_state.clone())).await.unwrap();

        assert_eq!(today_tasks.len(), 1, "Deveria retornar apenas uma tarefa de hoje");
        assert_eq!(today_tasks[0].scheduled_date, today);
    }
}

// Função auxiliar para inicializar schema do banco de dados de teste
fn init_database_schema(conn: &Connection) -> SqliteResult<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            user TEXT NOT NULL,
            estimated_hours REAL NOT NULL,
            scheduled_date TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TEXT NOT NULL,
            started_at TEXT,
            completed_at TEXT
        )",
        [],
    )?;
    Ok(())
}
