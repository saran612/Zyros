use tauri::State;
use zyros_core::CoreOrchestrator;

#[tauri::command]
pub async fn ask_zyros(
    query: String,
    orchestrator: State<'_, CoreOrchestrator>,
) -> Result<String, String> {
    orchestrator
        .process_query(&query)
        .await
        .map_err(|e| e.to_string())
}
