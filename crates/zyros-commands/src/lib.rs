use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandTemplate {
    pub name: &'static str,
    pub program: &'static str,
    pub args: Vec<String>,
    pub mutating: bool,
    pub requires_sudo: bool,
    pub description: &'static str,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum ProcessSort {
    Cpu,
    Memory,
    Pid,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum KnownApp {
    Firefox,
    Terminal,
    FileManager,
    TextEditor,
}

impl ProcessSort {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Cpu => "-%cpu",
            Self::Memory => "-%mem",
            Self::Pid => "pid",
        }
    }
}

impl KnownApp {
    pub fn executable(&self) -> &'static str {
        match self {
            Self::Firefox => "firefox",
            Self::Terminal => "gnome-terminal", // TODO: Detect or configure default
            Self::FileManager => "nautilus",
            Self::TextEditor => "gedit",
        }
    }
}

pub fn ram_usage() -> CommandTemplate {
    CommandTemplate {
        name: "ram_usage",
        program: "free",
        args: vec!["-h".to_string()],
        mutating: false,
        requires_sudo: false,
        description: "Check system RAM usage",
    }
}

pub fn disk_usage() -> CommandTemplate {
    CommandTemplate {
        name: "disk_usage",
        program: "df",
        args: vec!["-h".to_string()],
        mutating: false,
        requires_sudo: false,
        description: "Check system disk usage",
    }
}

pub fn create_file(path: String) -> CommandTemplate {
    CommandTemplate {
        name: "create_file",
        program: "touch",
        args: vec![path],
        mutating: true,
        requires_sudo: false,
        description: "Create an empty file",
    }
}

pub fn read_file(path: String) -> CommandTemplate {
    CommandTemplate {
        name: "read_file",
        program: "cat",
        args: vec![path],
        mutating: false,
        requires_sudo: false,
        description: "Read and display file contents",
    }
}

pub fn edit_file(path: String) -> CommandTemplate {
    CommandTemplate {
        name: "edit_file",
        program: "nano",
        args: vec![path],
        mutating: true,
        requires_sudo: false,
        description: "Open nano text editor for editing file",
    }
}

pub fn move_file(source: String, dest: String) -> CommandTemplate {
    CommandTemplate {
        name: "move_file",
        program: "mv",
        args: vec![source, dest],
        mutating: true,
        requires_sudo: false,
        description: "Move or rename a file",
    }
}

pub fn copy_file(source: String, dest: String) -> CommandTemplate {
    CommandTemplate {
        name: "copy_file",
        program: "cp",
        args: vec![source, dest],
        mutating: true,
        requires_sudo: false,
        description: "Copy a file",
    }
}

pub fn open_app(app_name: String) -> CommandTemplate {
    CommandTemplate {
        name: "open_app",
        program: "xdg-open",
        args: vec![app_name],
        mutating: true,
        requires_sudo: false,
        description: "Open a graphical application or resource",
    }
}

pub fn restart_service(name: String) -> CommandTemplate {
    CommandTemplate {
        name: "restart_service",
        program: "systemctl",
        args: vec!["restart".to_string(), name],
        mutating: true,
        requires_sudo: true,
        description: "Restart a system systemd service",
    }
}

/// List running system processes
/// Note: Runs `ps aux`. Shows what the invoking user has privileges to see without sudo.
pub fn list_processes(sort_by: ProcessSort) -> CommandTemplate {
    CommandTemplate {
        name: "list_processes",
        program: "ps",
        args: vec![
            "-eo".to_string(),
            "user,pid,ppid,%cpu,%mem,stat,etime,cmd".to_string(),
            format!("--sort={}", sort_by.as_str()),
        ],
        mutating: false,
        requires_sudo: false,
        description: "List and sort running processes",
    }
}

pub fn kill_process(pid: u32, force: bool) -> CommandTemplate {
    let mut args = Vec::new();
    if force {
        args.push("-9".to_string());
    }
    args.push(pid.to_string());

    CommandTemplate {
        name: "kill_process",
        program: "kill",
        args,
        mutating: true,
        requires_sudo: false,
        description: "Terminate a system process",
    }
}

pub fn kill_process_privileged(pid: u32, force: bool) -> CommandTemplate {
    let mut args = Vec::new();
    if force {
        args.push("-9".to_string());
    }
    args.push(pid.to_string());

    CommandTemplate {
        name: "kill_process_privileged",
        program: "kill",
        args,
        mutating: true,
        requires_sudo: true,
        description: "Terminate a system process with root privileges",
    }
}

pub fn launch_process(app: KnownApp) -> CommandTemplate {
    CommandTemplate {
        name: "launch_process",
        program: app.executable(),
        args: vec![],
        mutating: true,
        requires_sudo: false,
        description: "Launch an allowlisted application process",
    }
}

pub fn ip_address() -> CommandTemplate {
    CommandTemplate {
        name: "ip_address",
        program: "ip",
        args: vec!["addr".to_string()],
        mutating: false,
        requires_sudo: false,
        description: "Check network interface IP addresses",
    }
}

pub fn routing_table() -> CommandTemplate {
    CommandTemplate {
        name: "routing_table",
        program: "ip",
        args: vec!["route".to_string()],
        mutating: false,
        requires_sudo: false,
        description: "Check IP routing table",
    }
}

pub fn internet_check() -> CommandTemplate {
    CommandTemplate {
        name: "internet_check",
        program: "ping",
        args: vec!["-c".to_string(), "3".to_string(), "8.8.8.8".to_string()],
        mutating: false,
        requires_sudo: false,
        description: "Check internet connectivity via ping",
    }
}

pub fn wifi_status() -> CommandTemplate {
    CommandTemplate {
        name: "wifi_status",
        program: "nmcli",
        args: vec!["device".to_string(), "wifi".to_string()],
        mutating: false,
        requires_sudo: false,
        description: "Check nearby WiFi access points",
    }
}

pub fn list_directory(path: Option<String>) -> CommandTemplate {
    let mut args = vec!["-la".to_string()];
    if let Some(p) = path {
        args.push(p);
    }
    CommandTemplate {
        name: "list_directory",
        program: "ls",
        args,
        mutating: false,
        requires_sudo: false,
        description: "List directory contents",
    }
}
