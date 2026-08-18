use std::error::Error;
use serde::{Deserialize, Serialize};

#[derive(Clone)]
pub struct OllamaClient {
    endpoint: String,
    model: String,
    http_client: reqwest::Client,
}

#[derive(Serialize)]
struct GenerateRequest<'a> {
    model: &'a str,
    prompt: &'a str,
    stream: bool,
}

#[derive(Deserialize)]
struct GenerateResponse {
    response: String,
}

impl OllamaClient {
    pub fn new(endpoint: Option<String>, model: String) -> Self {
        Self {
            endpoint: endpoint.unwrap_or_else(|| "http://localhost:11434".to_string()),
            model,
            http_client: reqwest::Client::new(),
        }
    }

    pub async fn generate(&self, prompt: &str) -> Result<String, Box<dyn Error + Send + Sync>> {
        let url = format!("{}/api/generate", self.endpoint);
        let request_body = GenerateRequest {
            model: &self.model,
            prompt,
            stream: false,
        };

        let response = self.http_client
            .post(&url)
            .json(&request_body)
            .send()
            .await?;

        if !response.status().is_success() {
            let err_text = response.text().await?;
            return Err(format!("Ollama API returned error: {}", err_text).into());
        }

        let resp_data: GenerateResponse = response.json().await?;
        Ok(resp_data.response)
    }
}
