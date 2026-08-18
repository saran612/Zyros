use std::error::Error;
use tokio::process::Command;
use zyros_commands::CommandTemplate;

pub struct Executor {
    allowlist: Vec<String>,
}

impl Executor {
    pub fn new(allowlist: Vec<String>) -> Self {
        Self { allowlist }
    }

    /// Run `sudo -v` to ensure/check active sudo cache permissions.
    /// Redirects stdio directly to host terminal for OS native credentials prompts.
    pub async fn ensure_sudo_session(&self) -> Result<bool, Box<dyn Error + Send + Sync>> {
        println!("[Sudo] Validating root-level access authorization...");
        
        let mut child = Command::new("sudo")
            .arg("-v")
            .stdin(std::process::Stdio::inherit())
            .stdout(std::process::Stdio::inherit())
            .stderr(std::process::Stdio::inherit())
            .spawn()?;

        let status = child.wait().await?;
        Ok(status.success())
    }

    pub async fn execute(
        &self,
        template: &CommandTemplate,
    ) -> Result<String, Box<dyn Error + Send + Sync>> {
        // Enforce allowlist check
        if !self.allowlist.contains(&template.program.to_string()) && template.program != "sudo" && template.name != "open_app" {
            return Err(format!("Execution blocked: Executable '{}' not in allowlist", template.program).into());
        }

        let mut cmd = if template.requires_sudo {
            // Validate sudo authorization session beforehand
            let authorized = self.ensure_sudo_session().await?;
            if !authorized {
                return Err("Execution blocked: Sudo authorization failed".into());
            }
            
            let mut c = Command::new("sudo");
            c.arg(template.program);
            c.args(&template.args);
            c
        } else {
            let mut c = Command::new(template.program);
            c.args(&template.args);
            c
        };

        if template.name == "open_app" {
            cmd.spawn()?;
            return Ok("Application launched in background.".to_string());
        }

        let output = cmd.output().await?;
        let combined_output = if output.status.success() {
            String::from_utf8_lossy(&output.stdout).to_string()
        } else {
            String::from_utf8_lossy(&output.stderr).to_string()
        };

        Ok(combined_output)
    }
}

#[cfg(test)]
mod tests;
