pub mod sanitizer;

use std::error::Error;
use zyros_llm::OllamaClient;
pub use sanitizer::QuerySanitizer;
pub use zyros_planner::Intent;
use zyros_commands::{ProcessSort, KnownApp};

pub struct NluEngine {
    llm_client: OllamaClient,
    sanitizer: QuerySanitizer,
}

fn build_classification_prompt(query: &str) -> String {
    format!(
        r#"You are a strict intent classifier for a Linux system assistant. Classify the user's query into EXACTLY ONE of these intents:

GET_SYS_INFO - queries about ram, memory, cpu, processor, system resources, general system status/health
DISK_SPACE_ISSUE - queries about disk, storage, space, "no space left", drive usage
CREATE_FILE - touches or creates empty files
READ_FILE - views file contents using cat
EDIT_FILE - opens a text editor like nano to edit a file
MOVE_FILE - moves/renames files from source to destination
COPY_FILE - copies files from source to destination
OPEN_APP - opens generic resource/folders via xdg-open
LIST_PROCESSES - lists running processes, optionally sorting by CPU, MEMORY, or PID. Might ask for "full" process list.
KILL_PROCESS - kills/terminates/stops a process by name or PID
LAUNCH_PROCESS - starts/runs a bounded set of processes: FIREFOX, TERMINAL, FILE_MANAGER, TEXT_EDITOR
GET_IP_ADDRESS - queries about IP address, IP configurations, local IP
GET_ROUTING_TABLE - queries about network route, routing table, gateway
CHECK_INTERNET - checks connection to internet, ping test, network check
CHECK_WIFI - checks wifi connections, wireless status, nmcli wifi
LIST_DIRECTORY - lists directory contents, list files, show folder files, ls
UNKNOWN - if the query does not clearly match any intent above

Rules:
- The user's query may contain spelling mistakes, missing words, casual grammar, or slang. Interpret by MEANING, not exact wording.
- Treat these as equivalent synonyms: ram = memory; disk = storage = drive; cpu = processor; network = internet = wifi = connection; process = task = program; slow = laggy = sluggish.
- Output ONLY the intent label, nothing else. No punctuation, no explanation, no quotes, no markdown.

Examples:
"what is my ram usage" -> GET_SYS_INFO
"how much memory am i using" -> GET_SYS_INFO
"why is my disk full" -> DISK_SPACE_ISSUE
"show running processes sorted by memory" -> LIST_PROCESSES
"show full list of processes" -> LIST_PROCESSES
"kill process firefox" -> KILL_PROCESS
"launch firefox" -> LAUNCH_PROCESS
"list files in current directory" -> LIST_DIRECTORY
"ls /home/user" -> LIST_DIRECTORY
"what's the weather today" -> UNKNOWN

User query: "{}"
Intent:"#,
        query
    )
}

fn parse_intent(raw_response: &str, query: &str) -> Intent {
    let cleaned = raw_response
        .trim()
        .trim_matches(|c: char| c == '"' || c == '\'' || c == '.' || c == '`')
        .to_uppercase();

    let first_token = cleaned.lines().next().unwrap_or("").trim();
    let q_lower = query.to_lowercase();
    let show_full = q_lower.contains("full") || q_lower.contains("all");

    if first_token.contains("GET_SYS_INFO") {
        Intent::GetSysInfo
    } else if first_token.contains("DISK_SPACE_ISSUE") {
        Intent::DiskSpaceIssue
    } else if first_token.contains("LIST_PROCESSES") {
        let sort_by = if q_lower.contains("mem") {
            ProcessSort::Memory
        } else if q_lower.contains("pid") {
            ProcessSort::Pid
        } else {
            ProcessSort::Cpu
        };
        Intent::ListProcesses { sort_by, show_full }
    } else if first_token.contains("KILL_PROCESS") {
        Intent::KillProcess { name_or_pid: "".to_string(), force: false }
    } else if first_token.contains("LAUNCH_PROCESS") {
        // Parse KnownApp app names from query
        let app = if q_lower.contains("terminal") {
            KnownApp::Terminal
        } else if q_lower.contains("file") {
            KnownApp::FileManager
        } else if q_lower.contains("edit") || q_lower.contains("nano") {
            KnownApp::TextEditor
        } else {
            KnownApp::Firefox
        };
        Intent::LaunchProcess { app }
    } else if first_token.contains("OPEN_APP") {
        let app_name = if let Some(idx) = q_lower.find("open ") {
            q_lower[idx + 5..].trim().to_string()
        } else {
            q_lower.clone()
        };
        Intent::OpenApp { app: app_name }
    } else if first_token.contains("GET_IP_ADDRESS") {
        Intent::GetIpAddress
    } else if first_token.contains("GET_ROUTING_TABLE") {
        Intent::GetRoutingTable
    } else if first_token.contains("CHECK_INTERNET") {
        Intent::CheckInternet
    } else if first_token.contains("CHECK_WIFI") {
        Intent::CheckWifi
    } else if first_token.contains("LIST_DIRECTORY") {
        let path = if q_lower.starts_with("ls ") {
            Some(query[3..].trim().to_string())
        } else if q_lower.starts_with("list files in ") {
            Some(query[14..].trim().to_string())
        } else {
            None
        };
        Intent::ListDirectory { path }
    } else {
        eprintln!("[NLU Debug] Unrecognized raw LLM output: {:?}", raw_response);
        Intent::Unknown
    }
}

impl NluEngine {
    pub fn new(llm_client: OllamaClient) -> Self {
        Self {
            llm_client,
            sanitizer: QuerySanitizer::new(),
        }
    }

    pub async fn classify_intent(&self, query: &str) -> Result<Intent, Box<dyn Error + Send + Sync>> {
        let cleaned_query = self.sanitizer.sanitize(query);
        println!("[NLU] Cleaned query: \"{}\" -> \"{}\"", query, cleaned_query);

        if cleaned_query.is_empty() {
            return Ok(Intent::Unknown);
        }

        let q_trimmed = query.trim();
        let q_lower = q_trimmed.to_lowercase();

        // Check simple manual heuristics for name/PID extraction on process tasks
        let normalized = cleaned_query.to_lowercase();
        if normalized.starts_with("kill ") || normalized.starts_with("terminate ") || normalized.starts_with("stop ") {
            let parts: Vec<&str> = normalized.split_whitespace().collect();
            if parts.len() > 1 {
                let name_or_pid = parts[1..].join(" ");
                let force = normalized.contains("force") || normalized.contains("-9");
                return Ok(Intent::KillProcess { name_or_pid, force });
            }
        } else if normalized.starts_with("launch ") || normalized.starts_with("run ") || normalized.starts_with("start ") {
            let app = if normalized.contains("firefox") {
                Some(KnownApp::Firefox)
            } else if normalized.contains("terminal") {
                Some(KnownApp::Terminal)
            } else if normalized.contains("file") {
                Some(KnownApp::FileManager)
            } else if normalized.contains("edit") || normalized.contains("nano") {
                Some(KnownApp::TextEditor)
            } else {
                None
            };
            if let Some(known) = app {
                return Ok(Intent::LaunchProcess { app: known });
            }
        } else if normalized == "process" || normalized == "processes" || normalized == "ps" || normalized.starts_with("list process") || normalized.starts_with("list ps") || normalized.starts_with("show process") || normalized.starts_with("show ps") {
            let sort_by = if normalized.contains("mem") {
                ProcessSort::Memory
            } else if normalized.contains("pid") {
                ProcessSort::Pid
            } else {
                ProcessSort::Cpu
            };
            let show_full = normalized.contains("full") || normalized.contains("all");
            return Ok(Intent::ListProcesses { sort_by, show_full });
        } else if normalized == "ip" || normalized == "ip address" || normalized == "my ip" || normalized == "ifconfig" || normalized == "ip addr" || normalized == "lan" || normalized == "network" || normalized == "interfaces" {
            return Ok(Intent::GetIpAddress);
        } else if normalized == "route" || normalized == "routing" || normalized == "routing table" || normalized == "gateway" || normalized == "ip route" {
            return Ok(Intent::GetRoutingTable);
        } else if normalized == "internet" || normalized == "ping" || normalized == "ping test" || normalized == "check internet" || normalized.contains("connect to internet") || normalized == "online" {
            return Ok(Intent::CheckInternet);
        } else if normalized == "wifi" || normalized == "wireless" || normalized == "nmcli wifi" || normalized.contains("scan wifi") || normalized == "wlan" {
            return Ok(Intent::CheckWifi);
        } else if q_lower == "ls" || q_lower == "dir" || q_lower == "list files" || q_lower == "show files" || q_lower.starts_with("ls ") || q_lower.starts_with("dir ") || q_lower.starts_with("list files ") || q_lower.starts_with("show files ") {
            // 0. Directory listing heuristics
            let ls_query = if q_lower == "ls" || q_lower == "dir" || q_lower == "list files" || q_lower == "show files" {
                Some(None)
            } else if q_lower.starts_with("ls ") {
                Some(Some(q_trimmed[3..].trim().to_string()))
            } else if q_lower.starts_with("dir ") {
                Some(Some(q_trimmed[4..].trim().to_string()))
            } else if q_lower.starts_with("list files ") {
                let path_part = q_trimmed[11..].trim();
                let path_part_lower = path_part.to_lowercase();
                if path_part_lower.starts_with("in ") {
                    Some(Some(path_part[3..].trim().to_string()))
                } else {
                    Some(Some(path_part.to_string()))
                }
            } else if q_lower.starts_with("show files ") {
                let path_part = q_trimmed[11..].trim();
                let path_part_lower = path_part.to_lowercase();
                if path_part_lower.starts_with("in ") {
                    Some(Some(path_part[3..].trim().to_string()))
                } else {
                    Some(Some(path_part.to_string()))
                }
            } else {
                None
            };

            let path = ls_query.flatten().filter(|p| !p.is_empty());
            return Ok(Intent::ListDirectory { path });
        }

        // 1. Create file heuristics
        let create_query = if q_lower.starts_with("create ") {
            Some(q_trimmed[7..].trim())
        } else if q_lower.starts_with("touch ") {
            Some(q_trimmed[6..].trim())
        } else if q_lower.starts_with("new ") {
            Some(q_trimmed[4..].trim())
        } else {
            None
        };

        if let Some(target) = create_query {
            if target.contains('.') {
                return Ok(Intent::CreateFile { path: target.to_string() });
            } else {
                let path = find_file_in_cwd(target).unwrap_or_else(|| target.to_string());
                return Ok(Intent::CreateFile { path });
            }
        }

        // 2. Modify / Edit file heuristics
        let edit_query = if q_lower.starts_with("modify ") {
            Some(q_trimmed[7..].trim())
        } else if q_lower.starts_with("edit ") {
            Some(q_trimmed[5..].trim())
        } else if q_lower.starts_with("write ") {
            Some(q_trimmed[6..].trim())
        } else if q_lower.starts_with("nano ") {
            Some(q_trimmed[5..].trim())
        } else if q_lower.starts_with("vim ") {
            Some(q_trimmed[4..].trim())
        } else {
            None
        };

        if let Some(target) = edit_query {
            if target.contains('.') {
                return Ok(Intent::EditFile { path: target.to_string() });
            } else {
                let path = find_file_in_cwd(target).unwrap_or_else(|| target.to_string());
                return Ok(Intent::EditFile { path });
            }
        }

        // 3. Open / Read / View / Show file or Open App heuristics
        let open_query = if q_lower.starts_with("open ") {
            Some(q_trimmed[5..].trim())
        } else if q_lower.starts_with("view ") {
            Some(q_trimmed[5..].trim())
        } else if q_lower.starts_with("read ") {
            Some(q_trimmed[5..].trim())
        } else if q_lower.starts_with("cat ") {
            Some(q_trimmed[4..].trim())
        } else if q_lower.starts_with("show ") {
            Some(q_trimmed[5..].trim())
        } else {
            None
        };

        if let Some(target) = open_query {
            if target.contains('.') {
                return Ok(Intent::ReadFile { path: target.to_string() });
            } else {
                let apps = load_cached_apps();
                if let Some(matched_app_name) = find_fuzzy_match(target, &apps) {
                    return Ok(Intent::OpenApp { app: matched_app_name });
                }
                if let Some(matched_file) = find_file_in_cwd(target) {
                    return Ok(Intent::ReadFile { path: matched_file });
                }
                return Ok(Intent::OpenApp { app: target.to_string() });
            }
        }

        // 4. Other Fuzzy match application launch requests (launch/run/start or single-word app names)
        let other_app_query = if normalized.starts_with("launch ") {
            Some(normalized[7..].trim())
        } else if normalized.starts_with("run ") {
            Some(normalized[4..].trim())
        } else if normalized.starts_with("start ") {
            Some(normalized[6..].trim())
        } else if normalized.split_whitespace().count() == 1 {
            Some(normalized.trim())
        } else {
            None
        };

        if let Some(app_q) = other_app_query {
            let apps = load_cached_apps();
            if let Some(matched_app_name) = find_fuzzy_match(app_q, &apps) {
                return Ok(Intent::OpenApp { app: matched_app_name });
            }
        }

        let prompt = build_classification_prompt(&cleaned_query);
        let raw_response = self.llm_client.generate(&prompt).await?;
        let intent = parse_intent(&raw_response, query);

        if intent == Intent::Unknown {
            eprintln!("[NLU Warning] Query classified as UNKNOWN: {:?} (raw LLM output: {:?})", query, raw_response);
        }

        Ok(intent)
    }
}

fn load_cached_apps() -> Vec<(String, String)> {
    use std::fs::{self, File};
    use std::io::{BufRead, BufReader, Write};
    use std::path::Path;

    let cache_path = "/tmp/zyros_apps.txt";
    let mut apps = Vec::new();

    if Path::new(cache_path).exists() {
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
        if let Ok(mut file) = File::create(cache_path) {
            for (n, e) in &apps {
                let _ = writeln!(file, "{} | {}", n, e);
            }
        }
    }
    apps
}

fn find_fuzzy_match(query: &str, apps: &[(String, String)]) -> Option<String> {
    let q_lower = query.trim().to_lowercase();
    if q_lower.is_empty() {
        return None;
    }

    fn levenshtein(s1: &str, s2: &str) -> usize {
        let len1 = s1.chars().count();
        let len2 = s2.chars().count();
        let mut dp = vec![vec![0; len2 + 1]; len1 + 1];
        for i in 0..=len1 { dp[i][0] = i; }
        for j in 0..=len2 { dp[0][j] = j; }
        for (i, c1) in s1.chars().enumerate() {
            for (j, c2) in s2.chars().enumerate() {
                if c1 == c2 {
                    dp[i + 1][j + 1] = dp[i][j];
                } else {
                    dp[i + 1][j + 1] = std::cmp::min(
                        dp[i][j] + 1,
                        std::cmp::min(dp[i][j + 1] + 1, dp[i + 1][j] + 1)
                    );
                }
            }
        }
        dp[len1][len2]
    }

    fn is_subsequence(sub: &str, full: &str) -> bool {
        let mut sub_chars = sub.chars().peekable();
        for c in full.chars() {
            if let Some(&sc) = sub_chars.peek() {
                if sc == c {
                    sub_chars.next();
                }
            } else {
                return true;
            }
        }
        sub_chars.peek().is_none()
    }

    let mut best_match = None;
    let mut highest_score = 0.0;

    for (name, exec) in apps {
        let n_lower = name.to_lowercase();
        let e_lower = exec.to_lowercase();

        if n_lower == q_lower || e_lower == q_lower {
            return Some(name.clone());
        }

        if n_lower.starts_with(&q_lower) || e_lower.starts_with(&q_lower) {
            let score = 0.9;
            if score > highest_score {
                highest_score = score;
                best_match = Some(name.clone());
            }
        } else if n_lower.contains(&q_lower) || e_lower.contains(&q_lower) {
            let score = 0.8;
            if score > highest_score {
                highest_score = score;
                best_match = Some(name.clone());
            }
        }

        if is_subsequence(&q_lower, &n_lower) || is_subsequence(&q_lower, &e_lower) {
            let score = 0.7 * (q_lower.len() as f64 / n_lower.len() as f64);
            if score > highest_score && score > 0.4 {
                highest_score = score;
                best_match = Some(name.clone());
            }
        }

        let dist_n = levenshtein(&q_lower, &n_lower);
        let max_len_n = std::cmp::max(q_lower.len(), n_lower.len());
        let sim_n = 1.0 - (dist_n as f64 / max_len_n as f64);

        let dist_e = levenshtein(&q_lower, &e_lower);
        let max_len_e = std::cmp::max(q_lower.len(), e_lower.len());
        let sim_e = 1.0 - (dist_e as f64 / max_len_e as f64);

        let sim = sim_n.max(sim_e);
        if sim > highest_score && sim > 0.55 {
            highest_score = sim;
            best_match = Some(name.clone());
        }
    }

    best_match
}

fn find_file_in_cwd(target: &str) -> Option<String> {
    let current_dir = std::env::current_dir().ok()?;
    let entries = std::fs::read_dir(current_dir).ok()?;
    let t_lower = target.to_lowercase();

    let mut exact_match = None;
    let mut starts_with_match = None;
    let mut contains_match = None;

    for entry in entries {
        if let Ok(entry) = entry {
            let path = entry.path();
            if path.is_file() {
                if let Some(filename) = path.file_name().and_then(|s| s.to_str()) {
                    let filename_lower = filename.to_lowercase();
                    let stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or(filename);
                    let stem_lower = stem.to_lowercase();

                    if filename_lower == t_lower || stem_lower == t_lower {
                        exact_match = Some(filename.to_string());
                    } else if stem_lower.starts_with(&t_lower) {
                        if starts_with_match.is_none() {
                            starts_with_match = Some(filename.to_string());
                        }
                    } else if stem_lower.contains(&t_lower) {
                        if contains_match.is_none() {
                            contains_match = Some(filename.to_string());
                        }
                    }
                }
            }
        }
    }

    exact_match.or(starts_with_match).or(contains_match)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_find_file_in_cwd() {
        // Since test runs in crate root, Cargo.toml is present.
        assert_eq!(find_file_in_cwd("Cargo.toml").unwrap(), "Cargo.toml");
        assert_eq!(find_file_in_cwd("cargo").unwrap(), "Cargo.toml");
    }

    #[tokio::test]
    async fn test_classify_intent_open_file_with_extension() {
        let client = OllamaClient::new(None, "dummy".to_string());
        let engine = NluEngine::new(client);

        let intent = engine.classify_intent("open file.txt").await.unwrap();
        assert_eq!(intent, Intent::ReadFile { path: "file.txt".to_string() });
    }

    #[tokio::test]
    async fn test_classify_intent_open_filename_alone() {
        let client = OllamaClient::new(None, "dummy".to_string());
        let engine = NluEngine::new(client);

        // "cargo" should match "Cargo.toml" in CWD and resolve to ReadFile
        let intent = engine.classify_intent("open cargo").await.unwrap();
        assert_eq!(intent, Intent::ReadFile { path: "Cargo.toml".to_string() });

        // Let's test a non-existent file/app. It should fallback to OpenApp.
        let intent2 = engine.classify_intent("open non_existent_something_1234").await.unwrap();
        assert_eq!(intent2, Intent::OpenApp { app: "non_existent_something_1234".to_string() });
    }

    #[tokio::test]
    async fn test_classify_intent_create_and_modify() {
        let client = OllamaClient::new(None, "dummy".to_string());
        let engine = NluEngine::new(client);

        // Create with extension
        let intent1 = engine.classify_intent("create note.txt").await.unwrap();
        assert_eq!(intent1, Intent::CreateFile { path: "note.txt".to_string() });

        // Create filename alone matching cargo -> Cargo.toml
        let intent2 = engine.classify_intent("create cargo").await.unwrap();
        assert_eq!(intent2, Intent::CreateFile { path: "Cargo.toml".to_string() });

        // Modify with extension
        let intent3 = engine.classify_intent("modify note.txt").await.unwrap();
        assert_eq!(intent3, Intent::EditFile { path: "note.txt".to_string() });

        // Modify filename alone matching cargo -> Cargo.toml
        let intent4 = engine.classify_intent("modify cargo").await.unwrap();
        assert_eq!(intent4, Intent::EditFile { path: "Cargo.toml".to_string() });
    }

    #[tokio::test]
    async fn test_classify_intent_list_directory() {
        let client = OllamaClient::new(None, "dummy".to_string());
        let engine = NluEngine::new(client);

        // Simple "ls"
        let intent1 = engine.classify_intent("ls").await.unwrap();
        assert_eq!(intent1, Intent::ListDirectory { path: None });

        // "ls /tmp"
        let intent2 = engine.classify_intent("ls /tmp").await.unwrap();
        assert_eq!(intent2, Intent::ListDirectory { path: Some("/tmp".to_string()) });

        // "list files in /etc"
        let intent3 = engine.classify_intent("list files in /etc").await.unwrap();
        assert_eq!(intent3, Intent::ListDirectory { path: Some("/etc".to_string()) });

        // "show files"
        let intent4 = engine.classify_intent("show files").await.unwrap();
        assert_eq!(intent4, Intent::ListDirectory { path: None });
    }
}
