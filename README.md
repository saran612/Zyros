# Zyros

> **An intelligent, local-first Linux workstation copilot and LLM orchestration engine.**

Zyros integrates local open-weight language models (via Ollama / GGUF) and cloud AI providers with deep hardware-level diagnostics and intuitive desktop interfaces.

---

## Architecture Overview

```
Zyros/
├── frontend/           # React 19 + TypeScript + Tailwind CSS UI (with Tauri native wrapper)
│   ├── src/            # React UI components, custom styles, and state logic
│   ├── src-tauri/      # Native Rust application shell for Linux desktop execution
│   └── public/assets/  # Fonts (Clash Display, Playfair Display), logos, and profile avatars
├── backend/            # Rust Axum backend with CQRS architecture
│   ├── src/system/     # Hardware inspection & system specification probing
│   ├── src/onboard/    # Workstation onboarding, model streaming, and BYOK configs
│   ├── src/chat/       # Chat sessions, streaming generation, and message history
│   └── src/shared/     # CQRS CommandBus & QueryBus primitives
├── app/                # Python pywebview desktop launcher with animated boot splash
├── docs/               # Architecture, API specifications, and setup guides
└── tests/              # End-to-end and integration test suites
```

---

## Features

- **Hardware-Aware Recommendations**: Automatically scans CPU cores, system RAM, swap, disk space, and GPU vendor capabilities to recommend the optimal local model size.
- **Local & Cloud Intelligence**: Seamlessly switch between local Ollama inference and cloud APIs (OpenAI, Anthropic, Google Gemini, Groq).
- **Dynamic Chat & Sessions**: Multi-session conversational workspace with effort selection (Low/Medium/High) and real-time streaming tokens.
- **Rich Modern Aesthetics**: Clean, pale-canvas interface styled with **Clash Display** & **Playfair Display** typography, custom dark/light token palettes, and micro-animations.
- **Dual Desktop Execution**: Run either via native **Tauri v2** or **pywebview** launcher.

---

## Quick Start

### Prerequisites

- **Rust** (1.75+ recommended) & `cargo`
- **Node.js** (v18+) & `npm`
- **Python** (3.10+) (optional, for pywebview launcher)
- **Ollama** (optional, for local LLM execution)

### 1. Start the Rust Backend

```bash
cd backend
cargo run
```
The backend server will start on `http://localhost:8008`.

### 2. Start the Frontend (Vite Dev Server)

```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173 in your browser.

### 3. Run the Native Desktop App

```bash
cd frontend
npm run build
cargo run --manifest-path src-tauri/Cargo.toml
```

---

## Testing

Run automated tests for both frontend and backend:

```bash
# Run backend tests
cd backend && cargo test

# Run frontend tests and type checks
cd frontend && npm run build

# Run integration tests
python3 tests/integration_test.py
```

---

## Contributing

Contributions are welcome! Please check out [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on code standards, pull requests, and development workflows.

---

## License

This project is licensed under the [MIT License](LICENSE).
