use std::error::Error;
use zyros_commands::{CommandTemplate, kill_process, kill_process_privileged};
use zyros_llm::OllamaClient;
use zyros_nlu::NluEngine;
use zyros_planner::{Planner, Intent};
use zyros_executor::Executor;
use zyros_explainer::Explainer;

pub struct CoreOrchestrator {
    pub nlu: NluEngine,
    pub planner: Planner,
    pub executor: Executor,
    pub explainer: Explainer,
}

impl CoreOrchestrator {
    pub fn new(ollama_endpoint: Option<String>, ollama_model: String, allowlist: Vec<String>) -> Self {
        let llm = OllamaClient::new(ollama_endpoint, ollama_model);
        
        Self {
            nlu: NluEngine::new(llm.clone()),
            planner: Planner::new(),
            executor: Executor::new(allowlist),
            explainer: Explainer::new(llm),
        }
    }

    /// Helper function to perform two-step name/PID matching resolution for process terminations.
    pub async fn resolve_and_kill<F>(
        &self,
        name_or_pid: &str,
        force: bool,
        mut confirm_fn: F,
    ) -> Result<String, Box<dyn Error + Send + Sync>>
    where
        F: FnMut(&CommandTemplate) -> bool,
    {
        // Check if input is a raw numeric PID
        let resolved_pid = if let Ok(pid) = name_or_pid.parse::<u32>() {
            Some(pid)
        } else {
            // Step 1: Run ps aux to extract active system processes
            println!("[Core] Querying active process list to resolve '{}'...", name_or_pid);
            let ps_template = zyros_commands::list_processes(zyros_commands::ProcessSort::Cpu);
            let ps_output = self.executor.execute(&ps_template).await?;

            // Filter lines matches
            let mut matches = Vec::new();
            for line in ps_output.lines() {
                if line.contains(name_or_pid) {
                    matches.push(line.to_string());
                }
            }

            if matches.is_empty() {
                println!("[Core] Zero matches found matching '{}'.", name_or_pid);
                None
            } else if matches.len() > 1 {
                println!("\n[Core] Ambiguous query. Found multiple candidates matching '{}':", name_or_pid);
                for m in &matches {
                    println!("  {}", m);
                }
                println!("Please rerun stating the explicit numeric PID directly instead.");
                return Ok("Process termination aborted due to ambiguity.".to_string());
            } else {
                // Parse PID column out of ps output line: USER PID %CPU %MEM ...
                let columns: Vec<&str> = matches[0].split_whitespace().collect();
                if columns.len() > 1 {
                    if let Ok(pid) = columns[1].parse::<u32>() {
                        println!("[Core] Resolved '{}' to PID {} (Details: {})", name_or_pid, pid, matches[0]);
                        Some(pid)
                    } else {
                        None
                    }
                } else {
                    None
                }
            }
        };

        if let Some(pid) = resolved_pid {
            // Confirm UX detail: display process details and construct kill template
            let mut kill_template = kill_process(pid, force);
            
            // Per-command confirmation gate
            let approved = confirm_fn(&kill_template);
            if approved {
                println!("[Core] Terminating process (PID: {})...", pid);
                match self.executor.execute(&kill_template).await {
                    Ok(out) => Ok(out),
                    Err(e) => {
                        println!("[Core] Terminating unprivileged command failed: {}. Retrying with sudo privileges...", e);
                        // Elevate/Retry with Sudo
                        kill_template = kill_process_privileged(pid, force);
                        let sudo_approved = confirm_fn(&kill_template);
                        if sudo_approved {
                            self.executor.execute(&kill_template).await
                        } else {
                            Ok("Privileged termination canceled.".to_string())
                        }
                    }
                }
            } else {
                Ok("Process termination canceled.".to_string())
            }
        } else {
            Ok(format!("Could not resolve '{}' to a running process PID.", name_or_pid))
        }
    }

    /// Process a natural language query in a diagnostic loop session.
    pub async fn process_session<F>(&self, query: &str, mut confirm_fn: F) -> Result<String, Box<dyn Error + Send + Sync>>
    where
        F: FnMut(&CommandTemplate) -> bool + Copy,
    {
        // 1. Intent Classification
        let intent = self.nlu.classify_intent(query).await?;
        println!("[Core] Identified intent: {:?}", intent);

        if intent == Intent::Unknown {
            return Ok("I don't know how to handle that intent yet.".to_string());
        }

        // Handle process termination two-step resolution explicitly
        if let Intent::KillProcess { name_or_pid, force } = intent {
            return self.resolve_and_kill(&name_or_pid, force, confirm_fn).await;
        }

        // Handle open application resolution explicitly
        if let Intent::OpenApp { app } = intent {
            return self.resolve_and_open(&app, confirm_fn).await;
        }

        // 2. Planning
        let plan = self.planner.plan_for(&intent);
        if plan.is_empty() {
            return Ok("No actions planned for this intent.".to_string());
        }

        let mut results = Vec::new();

        // 3. Command Execution Loop
        for template in plan {
            let mut approved = true;
            if template.mutating {
                approved = confirm_fn(&template);
            }

            if approved {
                println!("[Core] Executing command: {} {:?}", template.program, template.args);
                let output = self.executor.execute(&template).await?;
                println!("[Core] Command output length: {} bytes", output.len());
                println!("\n=== Command Output ===\n{}\n", output);

                // Format process listings output to top 20 lines unless show_full is requested
                let is_list_processes = template.name == "list_processes";
                let processed_output = if is_list_processes {
                    let show_full = match intent {
                        Intent::ListProcesses { show_full: f, .. } => f,
                        _ => {
                            let q_lower = query.to_lowercase();
                            q_lower.contains("full") || q_lower.contains("all")
                        }
                    };
                    let mut cleaned_lines = Vec::new();
                    for (i, line) in output.lines().enumerate() {
                        // Parse line columns.
                        // Format is: USER PID PPID %CPU %MEM STAT ELAPSED CMD
                        let parts: Vec<&str> = line.split_whitespace().collect();
                        if parts.len() > 7 {
                            let user = parts[0];
                            let pid = parts[1];
                            let ppid = parts[2];
                            let cpu = parts[3];
                            let mem = parts[4];
                            let stat = parts[5];
                            let elapsed = parts[6];
                            let mut cmd = parts[7..].join(" ");
                            if i > 0 && cmd.len() > 50 {
                                cmd.truncate(47);
                                cmd.push_str("...");
                            }
                            cleaned_lines.push(format!(
                                "{:<10} {:>8} {:>8} {:>6} {:>6} {:<6} {:<10} {}",
                                user, pid, ppid, cpu, mem, stat, elapsed, cmd
                            ));
                        } else {
                            cleaned_lines.push(line.to_string());
                        }
                    }

                    if !show_full {
                        cleaned_lines.into_iter().take(21).collect::<Vec<String>>().join("\n")
                    } else {
                        cleaned_lines.join("\n")
                    }
                } else {
                    output
                };

                // 4. Explain output
                let explanation = if is_list_processes {
                    "Listed active system processes.".to_string()
                } else {
                    println!("[Core] Generating explanation using LLM (this may take a few seconds)...");
                    self.explainer.explain_output(template.description, &processed_output).await?
                };
                
                // Format structured output blocks for process lists or status parameters
                let formatted = if is_list_processes {
                    format!("Command executed: {} {}\n\n=== Running Processes ===\n{}\n\n=== NLU Explainer ===\n{}", template.program, template.args.join(" "), processed_output, explanation)
                } else {
                    format!("Command: {} {}\nExplanation: {}", template.program, template.args.join(" "), explanation)
                };

                results.push(formatted);
            } else {
                results.push(format!("Command: {} [Blocked/Denied]", template.program));
            }
        }

        Ok(results.join("\n\n"))
    }

    /// Process a natural language query with automatic confirmation (e.g. for GUI/Tauri daemon).
    pub async fn process_query(&self, query: &str) -> Result<String, Box<dyn Error + Send + Sync>> {
        self.process_session(query, |_| true).await
    }

    /// Helper function to perform local application search and launching.
    pub async fn resolve_and_open<F>(
        &self,
        app_name: &str,
        mut confirm_fn: F,
    ) -> Result<String, Box<dyn Error + Send + Sync>>
    where
        F: FnMut(&CommandTemplate) -> bool,
    {
        use std::fs::{self, File};
        use std::io::{BufRead, BufReader, Write};
        use std::path::Path;

        let cache_path = "/tmp/zyros_apps.txt";
        let mut apps = Vec::new(); // Vector of (Name, ExecCommand)

        let cache_exists = Path::new(cache_path).exists();
        if cache_exists {
            if let Ok(file) = File::open(cache_path) {
                let reader = BufReader::new(file);
                for line in reader.lines() {
                    if let Ok(line) = line {
                        let parts: Vec<&str> = line.split('|').collect();
                        if parts.len() == 2 {
                            apps.push((parts[0].trim().to_string(), parts[1].trim().to_string()));
                        }
                    }
                }
            }
        }

        if apps.is_empty() {
            println!("[Core] Apps memory file is empty or missing. Scanning desktop apps...");
            // Scan /usr/share/applications/
            if let Ok(entries) = fs::read_dir("/usr/share/applications") {
                for entry in entries {
                    if let Ok(entry) = entry {
                        let path = entry.path();
                        if path.extension().and_then(|s| s.to_str()) == Some("desktop") {
                            if let Ok(file) = File::open(&path) {
                                let reader = BufReader::new(file);
                                let mut name = None;
                                let mut exec = None;
                                for line in reader.lines() {
                                    if let Ok(line) = line {
                                        if line.starts_with("Name=") && name.is_none() {
                                            name = Some(line["Name=".len()..].trim().to_string());
                                        } else if line.starts_with("Exec=") && exec.is_none() {
                                            let full_exec = line["Exec=".len()..].trim().to_string();
                                            // Strip placeholders like %u, %U, %f, %F, %i, %c, %k
                                            let cleaned_exec: Vec<&str> = full_exec
                                                .split_whitespace()
                                                .filter(|word| !word.starts_with('%'))
                                                .collect();
                                            exec = Some(cleaned_exec.join(" "));
                                        }
                                    }
                                }
                                if let (Some(n), Some(e)) = (name, exec) {
                                    apps.push((n, e));
                                }
                            }
                        }
                    }
                }
            }

            // Write to cache file
            if let Ok(mut file) = File::create(cache_path) {
                for (n, e) in &apps {
                    let _ = writeln!(file, "{} | {}", n, e);
                }
            }
            println!("[Core] Saved {} apps to system memory file.", apps.len());
        }

        // Search matching app name
        let query_lower = app_name.to_lowercase();
        let mut matched_app = None;

        // Try exact match first
        for (n, e) in &apps {
            if n.to_lowercase() == query_lower {
                matched_app = Some((n, e));
                break;
            }
        }

        // Try substring match next
        if matched_app.is_none() {
            for (n, e) in &apps {
                if n.to_lowercase().contains(&query_lower) {
                    matched_app = Some((n, e));
                    break;
                }
            }
        }

        if let Some((name, exec)) = matched_app {
            println!("[Core] Resolved app '{}' to '{}' with command '{}'", app_name, name, exec);
            
            // Build the command execution args
            let exec_parts: Vec<String> = exec.split_whitespace().map(|s| s.to_string()).collect();
            if exec_parts.is_empty() {
                return Ok(format!("Resolved app command for '{}' is empty.", name));
            }

            let program: &'static str = Box::leak(exec_parts[0].clone().into_boxed_str());
            let args: Vec<String> = exec_parts[1..].to_vec();

            let template = CommandTemplate {
                name: "open_app",
                program,
                args,
                mutating: true,
                requires_sudo: false,
                description: Box::leak(format!("Open application {}", name).into_boxed_str()),
            };

            let approved = confirm_fn(&template);
            if approved {
                println!("[Core] Launching app: {} {:?}", template.program, template.args);
                let output = self.executor.execute(&template).await?;
                let explanation = self.explainer.explain_output(template.description, &output).await?;
                Ok(format!("Command: {} {}\nExplanation: {}", template.program, template.args.join(" "), explanation))
            } else {
                Ok(format!("Command: {} [Blocked/Denied]", template.program))
            }
        } else {
            Ok(format!("Could not find a matching application for '{}' on the device.", app_name))
        }
    }
}
