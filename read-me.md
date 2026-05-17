# open-mcp-server

> A production-ready MCP (Model Context Protocol) server for tools, automation, and AI integration.

[![Node.js](https://img.shields.io/badge/node-22.x-brightgreen)]()
[![Docker](https://img.shields.io/badge/docker-ready-blue)]()
[![Tests](https://img.shields.io/badge/tests-68%20passing-brightgreen)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()

---

## 🚀 What is this?

**open-mcp-server** is a JSON-RPC MCP server that exposes:

- 🔧 Tools (filesystem, git, system, data, network, etc.)
- 🌐 Browser automation (Playwright + Browserless)
- ⚙️ Operational tooling (logs, health checks, processes)
- 🔌 Extensible integrations (SMTP, IMAP, SNMP, CDP)

It acts as a **universal execution layer** for automation systems and AI agents.

---

## ✨ Why this project?

- ✅ One unified protocol (JSON-RPC / MCP)
- ✅ Works with AI assistants (Claude, Cursor, etc.)
- ✅ Safe execution (policy + sandboxing)
- ✅ Production-ready (timeouts, concurrency, observability)
- ✅ Fully tested (68 passing tests)

---

## ⚡ Quick Start (Recommended)

### 1. Run with Docker

```bash
docker compose up --build