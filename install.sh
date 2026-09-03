#!/usr/bin/env bash
# ==============================================================================
# Zyros Installation & Environment Setup Script
# ==============================================================================

set -e

GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m"

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}           Zyros Installation & Setup Wizard          ${NC}"
echo -e "${BLUE}======================================================${NC}"

# Detect OS
OS_DISTRO="unknown"
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS_DISTRO=$ID
fi
echo -e "${GREEN}[*] Detected OS:${NC} $OS_DISTRO"

# Check Rust & Cargo
echo -e "\n${BLUE}[1/5] Checking Rust Toolchain...${NC}"
if ! command -v cargo &> /dev/null; then
    echo -e "${YELLOW}[!] Cargo/Rust not found. Installing rustup...${NC}"
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
else
    echo -e "${GREEN}[✓] Rust installed:${NC} $(rustc --version)"
fi

# Check Node.js & npm
echo -e "\n${BLUE}[2/5] Checking Node.js & npm...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}[!] Node.js and npm are required. Please install Node.js (v18+).${NC}"
    exit 1
else
    echo -e "${GREEN}[✓] Node.js installed:${NC} $(node -v) (npm $(npm -v))"
fi

# Check Python 3
echo -e "\n${BLUE}[3/5] Checking Python 3...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}[!] Python 3 not found. Desktop launcher might require python3.${NC}"
else
    echo -e "${GREEN}[✓] Python installed:${NC} $(python3 --version)"
fi

# Install Frontend Dependencies
echo -e "\n${BLUE}[4/5] Installing Frontend Dependencies...${NC}"
cd "$(dirname "$0")/frontend"
npm install
npm run build
cd ..

# Build Backend
echo -e "\n${BLUE}[5/5] Building Rust Backend Engine...${NC}"
cd "$(dirname "$0")/backend"
cargo build
cd ..

echo -e "\n${GREEN}======================================================${NC}"
echo -e "${GREEN}       Zyros Installation Completed Successfully!     ${NC}"
echo -e "${GREEN}======================================================${NC}"
echo -e "You can now run Zyros with:"
echo -e "  - ${YELLOW}Start Backend:${NC}  cd backend && cargo run"
echo -e "  - ${YELLOW}Start Frontend:${NC} cd frontend && npm run dev"
echo -e "  - ${YELLOW}Run Desktop:${NC}   cd frontend && cargo run --manifest-path src-tauri/Cargo.toml"
echo -e "  - ${YELLOW}Integration Tests:${NC} python3 tests/integration_test.py"
echo ""
