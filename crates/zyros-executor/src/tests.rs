#[cfg(test)]
mod tests {
    use crate::Executor;
    use zyros_commands::kill_process;

    #[tokio::test]
    async fn test_kill_process_pid_1_gated() {
        let _executor = Executor::new(vec!["kill".to_string()]);
        // Construct template targeting PID 1
        // TODO: In the future, safeguard low PIDs (like PID 1) from unprivileged/accidental kills at this layer.
        let template = kill_process(1, true);

        // Confirming it gets generated correctly with mutating/requires_sudo properties intact
        assert_eq!(template.program, "kill");
        assert_eq!(template.args, vec!["-9", "1"]);
        assert!(template.mutating);
        assert!(!template.requires_sudo);
    }
}
