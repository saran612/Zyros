use std::error::Error;
use zyros_llm::OllamaClient;

pub struct Explainer {
    llm_client: OllamaClient,
}

impl Explainer {
    pub fn new(llm_client: OllamaClient) -> Self {
        Self { llm_client }
    }

    pub async fn explain_output(
        &self,
        command_desc: &str,
        raw_output: &str,
    ) -> Result<String, Box<dyn Error + Send + Sync>> {
        let prompt = format!(
            "Explain the results of this command diagnostic run for a non-expert user in one short plain-English paragraph.\n\
            Important Rules:\n\
            - Do not invent, hallucinate, or copy any placeholder values (such as '31.8' or '30'). You MUST read the exact values directly from the provided raw command output below.\n\
            - Convert any binary IEC units from the command output (like GiB, MiB, KiB, or G, M, K) to standard decimal units (GB, MB, KB) in your output (e.g. write '31.8 GB' instead of '31.8 GiB').\n\
            - Do not round total capacity values aggressively. Keep the precision matching the raw numbers to 1 decimal place.\n\
            - Calculate the precise resource utilization as a percentage (%) based on the numbers in the raw output and include it.\n\n\
            Command Description: {}\n\
            Raw output:\n{}",
            command_desc, raw_output
        );
        self.llm_client.generate(&prompt).await
    }
}
