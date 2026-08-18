use regex::Regex;
use std::collections::HashSet;

pub struct QuerySanitizer {
    stop_words: HashSet<&'static str>,
    unwanted_patterns: Vec<Regex>,
}

impl QuerySanitizer {
    pub fn new() -> Self {
        let stop_words = [
            "please", "can", "you", "could", "would", "how", "to", "do", "i", "want",
            "show", "me", "get", "run", "execute", "check", "find", "my", "the",
            "a", "an", "of", "for", "in", "on", "at", "with", "about", "he", "she", "it",
        ].iter().cloned().collect();

        let unwanted_patterns = vec![
            Regex::new(r"[^\w\s\-\.]").unwrap(), // Keep alphanumeric, whitespace, dashes, and dots
            Regex::new(r"\s+").unwrap(),        // Multiple spaces
        ];

        Self {
            stop_words,
            unwanted_patterns,
        }
    }

    /// Clean spelling, punctuation, stop words, and strip leading/trailing spacing.
    pub fn sanitize(&self, raw_input: &str) -> String {
        // Lowercase
        let mut cleaned = raw_input.to_lowercase();

        // Remove non-alphanumeric/unwanted punctuation
        cleaned = self.unwanted_patterns[0].replace_all(&cleaned, "").to_string();

        // Reduce duplicate spaces
        cleaned = self.unwanted_patterns[1].replace_all(&cleaned, " ").to_string();

        // Trim
        let mut trimmed = cleaned.trim().to_string();

        // Normalize synonyms directly in pre-processing
        trimmed = trimmed.replace("memory", "ram");
        trimmed = trimmed.replace("storage", "disk");

        // Extract meaningful tokens (remove stop words)
        let words: Vec<&str> = trimmed
            .split_whitespace()
            .filter(|word| !self.stop_words.contains(word))
            .collect();

        words.join(" ")
    }
}
