# Setup & Development Guide

This guide walks you through setting up Zyros locally for development and running the complete desktop stack.

---

## 📋 Prerequisites

Ensure the following tools are installed:

- **Git**
- **Rust toolchain** (`rustc`, `cargo` via [rustup.rs](https://rustup.rs))
- **Node.js** (v18+) & **npm**
- **WebKit2GTK** (for Linux desktop GUI support):
  - On Ubuntu/Debian: `sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev`
  - On Arch Linux: `sudo pacman -S webkit2gtk-4.1 base-devel openssl gtk3`
  - On Fedora: `sudo dnf install webkit2gtk4.1-devel openssl-devel gtk3-devel`

---

## 🛠️ Installation & Running

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/Zyros.git
cd Zyros
```

### 2. Run the Rust Backend
```bash
cd backend
cargo run
```
Backend runs on `http://localhost:8008`.

### 3. Run the Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173`.

### 4. Run the Desktop App (Tauri)
```bash
cd frontend
npm run build
cargo run --manifest-path src-tauri/Cargo.toml
```

---

## ⚙️ Configuration

- Backend settings: Configured in `backend/src/main.rs`.
- Frontend endpoints: Configured via `API_BASE` in `frontend/src/App.tsx`.
- Desktop Window dimensions & splash duration: Configured in `app/src/config.py` and `frontend/src-tauri/tauri.conf.json`.
