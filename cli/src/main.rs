use clap::{Parser, Subcommand};
use std::io::{self, Write};
use zyros_core::CoreOrchestrator;

#[derive(Parser)]
#[command(name = "zyros")]
#[command(about = "Zyros — Desktop AI-powered Linux operations assistant CLI", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Run one-off diagnostic session for a query
    Ask {
        /// Natural language query
        query: String,
    },
    /// Interactive REPL loop
    Interactive,
}

fn log_event(event_type: &str, details: &str) {
    use std::fs::OpenOptions;
    use std::io::Write;
    use std::time::SystemTime;

    let log_path = "/home/saran/project/Zyros/zyros.log";
    let timestamp = match SystemTime::now().duration_since(SystemTime::UNIX_EPOCH) {
        Ok(d) => d.as_secs(),
        Err(_) => 0,
    };
    
    if let Ok(mut file) = OpenOptions::new()
        .create(true)
        .append(true)
        .open(log_path)
    {
        let _ = writeln!(file, "[{}] [{}] {}", timestamp, event_type, details);
    }
}

fn confirm_command(template: &zyros_commands::CommandTemplate) -> bool {
    println!("\n[WARNING] Mutating command requested to run:");
    println!("  Literal command: {} {:?}", template.program, template.args);
    print!("Allow execution? (y/N): ");
    let _ = io::stdout().flush();
    
    let mut response = String::new();
    if io::stdin().read_line(&mut response).is_ok() {
        let trimmed = response.trim().to_lowercase();
        let approved = trimmed == "y" || trimmed == "yes";
        log_event("USER_CONFIRMATION", &format!("Command: {} {:?} | Approved: {}", template.program, template.args, approved));
        approved
    } else {
        log_event("USER_CONFIRMATION", &format!("Command: {} {:?} | Approved: false (Failed to read response)", template.program, template.args));
        false
    }
}

async fn run_session(orchestrator: &CoreOrchestrator, query: &str) {
    println!("[Zyros CLI] Query: \"{}\"\n", query);
    log_event("QUERY_RECEIVED", query);
    match orchestrator.process_session(query, confirm_command).await {
        Ok(result) => {
            println!("\n=== Diagnostic Results ===");
            println!("{}", result);
            log_event("QUERY_SUCCESS", &format!("Query: \"{}\" | Result: {}", query, result));
        }
        Err(e) => {
            eprintln!("\nError running diagnostic session: {}", e);
            log_event("QUERY_ERROR", &format!("Query: \"{}\" | Error: {}", query, e));
        }
    }
}

#[tokio::main]
async fn main() {
    let args = Cli::parse();
    
    // Initialize Orchestrator with default settings
    let orchestrator = CoreOrchestrator::new(
        None, // localhost Ollama
        "qwen2.5:1.5b".to_string(), // Alternative: "llama3.1:8b".to_string()
        vec![
            "free".to_string(),
            "df".to_string(),
            "touch".to_string(),
            "cat".to_string(),
            "nano".to_string(),
            "mv".to_string(),
            "cp".to_string(),
            "xdg-open".to_string(),
            "ps".to_string(),
            "kill".to_string(),
            "firefox".to_string(),
            "gnome-terminal".to_string(),
            "nautilus".to_string(),
            "gedit".to_string(),
            "systemctl".to_string(),
            "uname".to_string(),
            "cat".to_string(),
            "ip".to_string(),
            "ping".to_string(),
            "nmcli".to_string()
        ], // Allowlist
    );

    match args.command {
        Commands::Ask { query } => {
            run_session(&orchestrator, &query).await;
        }
        Commands::Interactive => {
            println!("Zyros Interactive Shell. Type 'exit' or 'quit' to close.");
            
            let config = rustyline::Config::builder()
                .max_history_size(100)
                .expect("Failed to set max history size")
                .auto_add_history(true)
                .build();
            let mut rl = rustyline::DefaultEditor::with_config(config)
                .expect("Failed to initialize line editor");
                
            let history_path = "/home/saran/project/Zyros/.zyros_history";
            let _ = rl.load_history(history_path);
            log_event("SESSION_START", "Interactive REPL started");

            loop {
                let readline = rl.readline("zyros> ");
                match readline {
                    Ok(line) => {
                        let query = line.trim();
                        if query.is_empty() {
                            continue;
                        }
                        if query == "exit" || query == "quit" {
                            log_event("SESSION_END", "Interactive REPL closed by user");
                            break;
                        }
                        let _ = rl.save_history(history_path);
                        run_session(&orchestrator, query).await;
                    }
                    Err(rustyline::error::ReadlineError::Interrupted) => {
                        println!("CTRL-C");
                        log_event("SESSION_INTERRUPT", "Interactive REPL received SIGINT (Ctrl-C)");
                        break;
                    }
                    Err(rustyline::error::ReadlineError::Eof) => {
                        println!("CTRL-D");
                        log_event("SESSION_END", "Interactive REPL EOF received (Ctrl-D)");
                        break;
                    }
                    Err(err) => {
                        println!("Error: {:?}", err);
                        log_event("SESSION_ERROR", &format!("Line editor error: {:?}", err));
                        break;
                    }
                }
            }
        }
    }
}
