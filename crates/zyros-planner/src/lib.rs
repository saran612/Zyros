use zyros_commands::{CommandTemplate, ram_usage, disk_usage, ProcessSort, KnownApp};

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Intent {
    GetSysInfo,
    DiskSpaceIssue,
    CreateFile { path: String },
    ReadFile { path: String },
    EditFile { path: String },
    MoveFile { source: String, dest: String },
    CopyFile { source: String, dest: String },
    OpenApp { app: String },
    ListProcesses { sort_by: ProcessSort, show_full: bool },
    /// Intent to kill a process by name or PID.
    /// Note: If resolving by name, this requires a two-step runtime matching resolution
    /// implemented inside zyros-core's run loop.
    KillProcess { name_or_pid: String, force: bool },
    LaunchProcess { app: KnownApp },
    GetIpAddress,
    GetRoutingTable,
    CheckInternet,
    CheckWifi,
    ListDirectory { path: Option<String> },
    Unknown,
}

pub struct Planner;

impl Planner {
    pub fn new() -> Self {
        Self
    }

    pub fn plan_for(&self, intent: &Intent) -> Vec<CommandTemplate> {
        match intent {
            Intent::GetSysInfo => vec![ram_usage()],
            Intent::DiskSpaceIssue => vec![disk_usage()],
            Intent::CreateFile { path } => vec![zyros_commands::create_file(path.clone())],
            Intent::ReadFile { path } => vec![zyros_commands::read_file(path.clone())],
            Intent::EditFile { path } => vec![zyros_commands::edit_file(path.clone())],
            Intent::MoveFile { source, dest } => vec![zyros_commands::move_file(source.clone(), dest.clone())],
            Intent::CopyFile { source, dest } => vec![zyros_commands::copy_file(source.clone(), dest.clone())],
            Intent::OpenApp { app } => vec![zyros_commands::open_app(app.clone())],
            Intent::ListProcesses { sort_by, show_full: _ } => vec![zyros_commands::list_processes(*sort_by)],
            Intent::KillProcess { name_or_pid, force: _ } => {
                let _ = name_or_pid;
                vec![zyros_commands::list_processes(ProcessSort::Cpu)]
            },
            Intent::LaunchProcess { app } => vec![zyros_commands::launch_process(*app)],
            Intent::GetIpAddress => vec![zyros_commands::ip_address()],
            Intent::GetRoutingTable => vec![zyros_commands::routing_table()],
            Intent::CheckInternet => vec![zyros_commands::internet_check()],
            Intent::CheckWifi => vec![zyros_commands::wifi_status()],
            Intent::ListDirectory { path } => vec![zyros_commands::list_directory(path.clone())],
            Intent::Unknown => vec![],
        }
    }
}
