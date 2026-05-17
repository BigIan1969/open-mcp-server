# open-mcp-server

> A production-ready MCP (Model Context Protocol) server with a Python bridge, full test coverage, and CI.

---

## 🚀 What is open-mcp-server?

**open-mcp-server** is a fully tested, multi-language execution platform that:

- Exposes tools via **JSON-RPC (MCP protocol)**
- Integrates **Node.js execution engine**
- Provides a **Python HTTP bridge (Flask)** for external access
- Includes **browser automation (Playwright + Browserless)**
- Supports **system, file, network, and data tools**

👉 Think of it as a **universal tool execution layer for AI agents and automation systems**

---

## ✨ Features

### 🧠 MCP Protocol
- JSON-RPC 2.0 compliant
- Tool discovery + invocation
- Deterministic error handling

### 🧰 Tools
- Filesystem (read/write/patch/glob)
- Shell execution
- Process inspection
- Git operations
- Archiving + hashing
- Data transformation (JSON/CSV/text)

### 🌐 Browser Automation
- Playwright integration
- Browserless (remote Chromium)
- CDP support

### 🔗 Python Bridge
- Flask-based HTTP interface
- Safe subprocess orchestration
- Resilient JSON stream handling

### 🧪 Testing
- ✅ 56 Node test suites (Jest)
- ✅ Python unit tests (bridge)
- ✅ Python integration test (full stack)

### ⚙️ CI Ready
- GitHub Actions pipeline
- Runs Node + Python tests automatically

---

## ⚡ Quick Start

### 1. Install dependencies

```bash
npm install
``
