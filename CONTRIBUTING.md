# Contributing to Zyros

Thank you for your interest in contributing to **Zyros**! Whether you are fixing bugs, proposing new features, improving documentation, or optimizing inference performance, your contributions are appreciated.

---

## 🛠️ Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free environment for everyone. Please be respectful and constructive in all discussions and code reviews.

---

## 🌿 Development Workflow

### 1. Fork & Clone the Repository
```bash
git clone https://github.com/your-username/Zyros.git
cd Zyros
```

### 2. Create a Feature Branch
Use descriptive branch names with conventional prefixes:
```bash
git checkout -b feat/your-feature-name
# or
git checkout -b fix/issue-description
```

### 3. Setup Development Environment

#### Backend (Rust):
```bash
cd backend
cargo check
cargo run
```

#### Frontend (React + TypeScript):
```bash
cd frontend
npm install
npm run dev
```

---

## 📋 Coding Guidelines & Standards

### Rust (Backend)
- Follow the **CQRS (Command-Query Responsibility Segregation)** pattern implemented in `backend/src/shared/bus.rs`.
- Place commands in `<module>/commands/` and queries in `<module>/queries/`.
- Ensure all queries and handlers are registered in `register_queries` and `register_commands`.
- Run `cargo fmt` and `cargo clippy` before submitting pull requests.

### Frontend (React & TypeScript)
- Use functional React components with TypeScript type declarations.
- Maintain consistent design tokens matching **Clash Display** typography and custom CSS variables defined in `src/index.css`.
- Avoid hardcoded API URLs; always reference the configured backend endpoint constant (`API_BASE`).
- Run `npm run build` to ensure type checking passes without errors.

---

## 🧪 Testing Your Changes

Before submitting your pull request, make sure all tests pass:

```bash
# Check Rust backend
cd backend && cargo test

# Build frontend & check TypeScript types
cd frontend && npm run build

# Run integration tests
python3 tests/integration_test.py
```

---

## 📬 Submitting a Pull Request

1. Commit your changes with clear, concise commit messages following [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat: add GPU memory monitoring for ROCm`
   - `fix: resolve CORS header preflight issue on Linux`
   - `docs: update API documentation for chat stream`
2. Push your branch to GitHub:
   ```bash
   git push origin feat/your-feature-name
   ```
3. Open a Pull Request on GitHub against the `main` branch.
4. Describe your changes clearly and link any relevant issues.
