import path from "path";
import os from "os";
import readline from "readline";

const BROWSERLESS_WS = process.env.BROWSERLESS_WS || "ws://127.0.0.1:12355";
const BROWSERLESS_HTTP = process.env.BROWSERLESS_HTTP || "http://127.0.0.1:12355";

import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

console.log = (...args) => {
  process.stderr.write(args.join(" ") + "\n");
};

console.warn = (...args) => {
  process.stderr.write(args.join(" ") + "\n");
};

console.error = (...args) => {
  process.stderr.write(args.join(" ") + "\n");
};


const toolManifest = {
  "shell.run": {
    description: "Execute a shell command",
    params: { command: "string" }
  },
  "filesystem.read": {
    description: "Read a file from disk",
    params: { path: "string" }
  },
  "filesystem.write": {
    description: "Write content to a file",
    params: { path: "string", content: "string" }
  },
  "http.get": {
    description: "Fetch a URL via HTTP GET",
    params: { url: "string" }
  },
  "git.exec": {
    description: "Run a Git command",
    params: { args: "string" }
  },
  "sqlite.query": {
    description: "Execute a SQL query on a SQLite database",
    params: { db: "string", sql: "string" }
  },
  "docker.exec": {
    description: "Run a Docker CLI command",
    params: { args: "string" }
  },
  "browser.open": {
    description: "Open a URL in the system browser",
    params: { url: "string" }
  }
};

toolManifest["http.post"] = {
  description: "HTTP POST with optional JSON or raw body",
  params: { url: "string", headers: "object?", json: "any?", body: "string?" }
};

toolManifest["process.list"] = {
  description: "List running processes",
  params: {}
};

toolManifest["process.kill"] = {
  description: "Kill a process by PID",
  params: { pid: "number", signal: "string?" }
};

toolManifest["schedule.add"] = {
  description: "Schedule a shell command at a future ISO timestamp",
  params: { at: "string", command: "string" }
};

toolManifest["filesystem.glob"] = {
  description: "List files matching a glob pattern",
  params: {
    pattern: "string",
    cwd: "string?"
  }
};

toolManifest["text.search"] = {
  description: "Search for text in files under a directory",
  params: {
    pattern: "string",
    path: "string",
    regex: "boolean?"
  }
};

toolManifest["filesystem.patch"] = {
  description: "Apply structured patches to a file",
  params: {
    path: "string",
    patches: "array"
  }
};

toolManifest["git.status"] = {
  description: "Get git working tree status",
  params: { cwd: "string?" }
};

toolManifest["git.diff"] = {
  description: "Get git diff of working tree",
  params: {
    cwd: "string?",
    staged: "boolean?"
  }
};

toolManifest["git.log"] = {
  description: "Get recent git commits",
  params: {
    cwd: "string?",
    limit: "number?"
  }
};

toolManifest["logs.tail"] = {
  description: "Tail the last N lines of a text file",
  params: { path: "string", lines: "number?" }
};

toolManifest["logs.grep"] = {
  description: "Search for a pattern in a text file",
  params: { path: "string", pattern: "string", regex: "boolean?" }
};

toolManifest["system.info"] = {
  description: "Get basic system and runtime information",
  params: {}
};

toolManifest["net.healthcheck"] = {
  description: "Perform an HTTP GET health check",
  params: { url: "string", timeoutMs: "number?" }
};

toolManifest["json.parse"] = {
  description: "Parse JSON and return object",
  params: { text: "string" }
};

toolManifest["json.stringify"] = {
  description: "Stringify object as pretty JSON",
  params: { value: "any", indent: "number?" }
};

toolManifest["json.query"] = {
  description: "Query JSON using dot-separated path",
  params: { value: "any", path: "string" }
};

toolManifest["csv.toJson"] = {
  description: "Convert CSV text to JSON",
  params: { text: "string", header: "boolean?" }
};

toolManifest["hash.sha256"] = {
  description: "Compute SHA-256 hash of text",
  params: { text: "string" }
};

toolManifest["text.template"] = {
  description: "Apply variables to a template string",
  params: { template: "string", vars: "object" }
};

toolManifest["archive.zip"] = {
  description: "Create a zip archive from files or directories",
  params: { paths: "string[]", outPath: "string" }
};

toolManifest["archive.unzip"] = {
  description: "Extract a zip archive",
  params: { zipPath: "string", outDir: "string" }
};

toolManifest["archive.list"] = {
  description: "List contents of a zip archive",
  params: { zipPath: "string" }
};

toolManifest["hash.file"] = {
  description: "Compute SHA-256 hash of a file",
  params: { path: "string" }
};

const promptManifest = {};

promptManifest["code_review"] = {
  title: "Code Review",
  description: "Review a code file and suggest improvements",
  arguments: [{ name: "path", required: true }]
};

promptManifest["repo_health_check"] = {
  title: "Repository Health Check",
  description: "Review repository status and activity",
  arguments: [{ name: "cwd", required: false }]
};

promptManifest["incident_triage"] = {
  title: "Incident Triage",
  description: "Analyze recent logs and identify issues",
  arguments: [{ name: "logPath", required: true }]
};

promptManifest["release_summary"] = {
  title: "Release Summary",
  description: "Generate a release summary from git history",
  arguments: [{ name: "cwd", required: false }]
};


toolManifest["pw.connect"] = { description: "Connect to Browserless Playwright endpoint", params: { wsEndpoint: "string?" } };
toolManifest["pw.close"] = { description: "Close Playwright session", params: { sessionId: "string" } };
toolManifest["pw.newPage"] = { description: "Create a new page in Playwright session", params: { sessionId: "string" } };
toolManifest["pw.goto"] = { description: "Navigate page", params: { sessionId: "string", url: "string" } };
toolManifest["pw.setContent"] = { description: "Set page HTML content", params: { sessionId: "string", html: "string" } };
toolManifest["pw.eval"] = { description: "Evaluate JS in page", params: { sessionId: "string", expression: "string" } };
toolManifest["pw.screenshot"] = { description: "Screenshot page to path", params: { sessionId: "string", path: "string" } };

toolManifest["cdp.connect"] = { description: "Open CDP websocket session", params: { wsEndpoint: "string?" } };
toolManifest["cdp.send"] = { description: "Send a CDP command", params: { sessionId: "string", method: "string", params: "object?" } };
toolManifest["cdp.close"] = { description: "Close CDP websocket session", params: { sessionId: "string" } };

toolManifest["browserless.content"] = { description: "Fetch HTML via Browserless /content", params: { url: "string" } };
toolManifest["browserless.http"] = { description: "Call Browserless HTTP endpoint", params: { path: "string", method: "string?", query: "object?", headers: "object?", body: "any?" } };

export const mailManifest = {
  namespace: "mail",
  tools: [
    {
      name: "smtp.send",
      description: "Send an email via SMTP",
      inputSchema: {
        type: "object",
        properties: {
          host: { type: "string" },
          port: { type: "number" },
          user: { type: "string" },
          pass: { type: "string" },
          to: { type: "string" },
          subject: { type: "string" },
          text: { type: "string" }
        },
        required: ["host", "port", "user", "pass", "to", "subject", "text"]
      }
    },
    {
      name: "imap.list",
      description: "List messages from IMAP inbox",
      inputSchema: {
        type: "object",
        properties: {
          host: { type: "string" },
          port: { type: "number" },
          user: { type: "string" },
          pass: { type: "string" }
        },
        required: ["host", "port", "user", "pass"]
      }
    },
    {
      name: "imap.fetch",
      description: "Fetch email contents by UID",
      inputSchema: {
        type: "object",
        properties: {
          uid: { type: "number" }
        },
        required: ["uid"]
      }
    },
    {
      name: "pop3.list",
      description: "List POP3 messages",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false
      }
    },
    {
      name: "pop3.retrieve",
      description: "Retrieve message from POP3",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "number" }
        },
        required: ["id"]
      }
    }
  ]
};

export const snmpManifest = {
  namespace: "snmp",
  tools: [
    {
      name: "snmp.get",
      description: "Get SNMP OID value",
      inputSchema: {
        type: "object",
        properties: {
          host: { type: "string" },
          oid: { type: "string" }
        },
        required: ["host", "oid"]
      }
    }
  ]
};

const policy = {
  environment: null, // resolved dynamically in enforcePolicy

  allowTools: {
    dev: null, // null = allow all
    prod: [
      "filesystem.read",
      "filesystem.write",
      "filesystem.glob",
      "text.search",
      "json.parse",
      "json.stringify",
      "json.query",
      "csv.toJson",
      "hash.sha256",
      "hash.file",
      "archive.zip",
      "archive.unzip",
      "archive.list",
      "system.info",
      "net.healthcheck",
      "logs.tail",
      "logs.grep"
    ]
  },

  denyTools: {
    dev: [],
    prod: [
      "shell.run",
      "git.exec",
      "docker.exec",
      "process.kill",
      "browser.open",
      "schedule.add"
    ]
  },

    fsRoots: [process.cwd(), os.tmpdir()]
};

const scheduledTasks = [];

// --- Tool implementations ----------------------------------------------------

async function shellRun(params) {
  const { exec } = await import("child_process");
  return new Promise((resolve) => {
    exec(params.command, (err, stdout, stderr) => {
      resolve({
        stdout,
        stderr,
        returncode: err ? err.code : 0
      });
    });
  });
}

async function fsRead(params) {
  const fs = await import("fs/promises");
  try {
    const content = await fs.readFile(params.path, "utf8");
    return { content };
  } catch (e) {
    return { error: e.message };
  }
}

async function fsWrite(params) {
  const fs = await import("fs/promises");
  try {
    await fs.writeFile(params.path, params.content, "utf8");
    return { status: "ok" };
  } catch (e) {
    return { error: e.message };
  }
}

async function httpGet(params) {
  const fetch = (await import("node-fetch")).default;
  try {
    const res = await fetch(params.url);
    const body = await res.text();
    return {
      status: res.status,
      headers: Object.fromEntries(res.headers.entries()),
      body
    };
  } catch (e) {
    return { error: e.message };
  }
}

// --- MCP method routing ------------------------------------------------------

const rawTools = {
  "shell.run": shellRun,
  "filesystem.read": fsRead,
  "filesystem.write": fsWrite,
  "git.exec": gitExec,
  "sqlite.query": sqliteQuery,
  "docker.exec": dockerExec,
  "process.list": processList,
  "process.kill": processKill,
  "browser.open": browserOpen,
  "http.post": httpPost,
  "http.get": httpGet,
  "schedule.add": scheduleAdd,
  "filesystem.glob": filesystemGlob,
  "text.search": textSearch,
  "filesystem.patch": filesystemPatch,
  "git.status": gitStatus,
  "git.diff": gitDiff,
  "git.log": gitLog,
  "logs.tail": logsTail,
  "logs.grep": logsGrep,
  "system.info": systemInfo,
  "net.healthcheck": netHealthcheck,
  "json.parse": jsonParse,
  "json.stringify": jsonStringify,
  "json.query": jsonQuery,
  "csv.toJson": csvToJson,
  "hash.sha256": hashSha256,
  "text.template": textTemplate,
  "archive.zip": archiveZip,
  "archive.unzip": archiveUnzip,
  "archive.list": archiveList,
  "hash.file": hashFile,
  "pw.connect": pwConnect,
  "pw.close": pwClose,
  "pw.newPage": pwNewPage,
  "pw.goto": pwGoto,
  "pw.setContent": pwSetContent,
  "pw.eval": pwEval,
  "pw.screenshot": pwScreenshot,
  "cdp.connect": cdpConnect,
  "cdp.send": cdpSend,
  "cdp.close": cdpClose,
  "browserless.content": browserlessContent,
  "browserless.http": browserlessHttp,

  // ✅ your new tools
  "smtp.send": smtpSend,
  "imap.list": imapList,
  "pop3.list": pop3List,
  "snmp.get": snmpGet
};

// ✅ wrap everything
const tools = Object.fromEntries(
  Object.entries(rawTools).map(([name, fn]) => [
    name,
    wrapTool(name, fn)
  ])
);

tools["system.metrics"] = () => {
  return metrics;
};

// --- JSON-RPC loop -----------------------------------------------------------

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on("line", async (line) => {
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return;
  }

  // -----------------------------
  // Built-in lightweight methods
  // -----------------------------
  if (msg.method === "ping") {
    process.stdout.write(JSON.stringify({
      jsonrpc: "2.0",
      id: msg.id,
      result: "pong"
    }) + "\n");
    return;
  }

  // -----------------------------
  // Prompts (Pack 6) - NOT tools
  // -----------------------------
  if (msg.method === "prompts.list") {
    const prompts = Object.entries(promptManifest).map(([name, p]) => ({
      name,
      title: p.title,
      description: p.description,
      arguments: p.arguments
    }));

    process.stdout.write(JSON.stringify({
      jsonrpc: "2.0",
      id: msg.id,
      result: { prompts }
    }) + "\n");
    return;
  }

  if (msg.method === "prompts.get") {
    const { name, arguments: args = {} } = msg.params || {};
    let messages = [];

    switch (name) {
      case "code_review":
        messages = [{
          role: "user",
          content: {
            type: "text",
            text:
              `Please review the code in the file at ${args.path}. ` +
              `Look for bugs, style issues, and possible improvements.`
          }
        }];
        break;

      case "repo_health_check":
        messages = [{
          role: "user",
          content: {
            type: "text",
            text:
              `Assess the repository health. Review git status, recent commits, ` +
              `and highlight any risks or concerns.`
          }
        }];
        break;

      case "incident_triage":
        messages = [{
          role: "user",
          content: {
            type: "text",
            text:
              `Analyze the log file at ${args.logPath}. ` +
              `Identify errors, warnings, and likely root causes.`
          }
        }];
        break;

      case "release_summary":
        messages = [{
          role: "user",
          content: {
            type: "text",
            text:
              `Generate a concise release summary based on recent git history. ` +
              `Group changes logically and highlight breaking changes if present.`
          }
        }];
        break;

      default:
        process.stdout.write(JSON.stringify({
          jsonrpc: "2.0",
          id: msg.id,
          error: { message: "Unknown prompt" }
        }) + "\n");
        return;
    }

    process.stdout.write(JSON.stringify({
      jsonrpc: "2.0",
      id: msg.id,
      result: { messages }
    }) + "\n");
    return;
  }

  // -----------------------------
  // Tool discovery
  // -----------------------------
  if (msg.method === "tools.list") {
    const toolsList = Object.entries(toolManifest).map(([name, meta]) => ({
      name,
      description: meta.description,
      params: meta.params
    }));

    process.stdout.write(JSON.stringify({
      jsonrpc: "2.0",
      id: msg.id,
      result: { tools: toolsList }
    }) + "\n");
    return;
  }

  // -----------------------------
  // Tool execution (your server uses msg.method as tool name)
  // -----------------------------
  const toolName = msg.method;
  const tool = tools[toolName];

  if (!tool) {
    process.stdout.write(JSON.stringify({
      jsonrpc: "2.0",
      id: msg.id,
      error: { message: "Unknown method" }
    }) + "\n");
    return;
  }

  // Enforce policy safely; NEVER throw out of the handler loop
  try {
    enforcePolicy(toolName, msg.params || {});
    const result = await tool(msg.params || {});
    process.stdout.write(JSON.stringify({
      jsonrpc: "2.0",
      id: msg.id,
      result
    }) + "\n");
  } catch (e) {
    // Important: return JSON-RPC error instead of crashing the server
    if (typeof audit === "function") {
      audit(`Blocked ${toolName}: ${e.message}`);
    } else {
      console.warn(`[policy] Blocked ${toolName}: ${e.message}`);
    }

    process.stdout.write(JSON.stringify({
      jsonrpc: "2.0",
      id: msg.id,
      error: { message: e.message }
    }) + "\n");
  }
});

async function gitExec(params) {
  const { exec } = await import("child_process");
  return new Promise((resolve) => {
    exec(`git ${params.args}`, (err, stdout, stderr) => {
      resolve({
        stdout,
        stderr,
        returncode: err ? err.code : 0
      });
    });
  });
}
async function sqliteQuery(params) {
  const { exec } = await import("child_process");
  return new Promise((resolve) => {
    exec(`sqlite3 ${params.db} "${params.sql}"`, (err, stdout, stderr) => {
      resolve({
        stdout,
        stderr,
        returncode: err ? err.code : 0
      });
    });
  });
}

async function dockerExec(params) {
  const { exec } = await import("child_process");
  return new Promise((resolve) => {
    exec(`docker ${params.args}`, (err, stdout, stderr) => {
      resolve({
        stdout,
        stderr,
        returncode: err ? err.code : 0
      });
    });
  });
}

async function browserOpen(params) {
  const { exec } = await import("child_process");
  return new Promise((resolve) => {
    exec(`xdg-open "${params.url}"`, (err) => {
      resolve({
        status: err ? "error" : "ok",
        message: err ? err.message : "opened"
      });
    });
  });
}

async function httpPost(params) {
  const fetch = (await import("node-fetch")).default;
  const { url, headers = {}, json = null, body = null } = params;

  const options = {
    method: "POST",
    headers
  };

  if (json !== null) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(json);
  } else if (body !== null) {
    options.body = body;
  }

  try {
    const res = await fetch(url, options);
    const text = await res.text();
    return {
      status: res.status,
      headers: Object.fromEntries(res.headers.entries()),
      body: text
    };
  } catch (e) {
    return { error: e.message };
  }
}
 
async function processList() {
  const { exec } = await import("child_process");
  return new Promise((resolve) => {
    exec("ps aux", (err, stdout, stderr) => {
      resolve({
        stdout,
        stderr,
        returncode: err ? err.code : 0
      });
    });
  });
}

async function processKill(params) {
  const { exec } = await import("child_process");
  const { pid, signal = "TERM" } = params;
  return new Promise((resolve) => {
    exec(`kill -s ${signal} ${pid}`, (err, stdout, stderr) => {
      resolve({
        stdout,
        stderr,
        returncode: err ? err.code : 0
      });
    });
  });
}

function scheduleCommand(params) {
  const { at, command } = params; // at = ISO string
  const when = new Date(at).getTime();
  const now = Date.now();
  const delay = when - now;

  if (isNaN(when) || delay <= 0) {
    return { error: "Invalid or past time" };
  }

  const { exec } = require("child_process");
  const id = `${when}-${Math.random().toString(36).slice(2)}`;

  const timeout = setTimeout(() => {
    exec(command, () => {});
  }, delay);

  scheduledTasks.push({ id, at, command, timeout });

  return { id, at, command };
}

async function scheduleAdd(params) {
  const { at, command } = params;
  const when = new Date(at).getTime();
  const delay = when - Date.now();

  if (Number.isNaN(when) || delay <= 0) {
    return { error: "Invalid or past time" };
  }

  const { exec } = await import("child_process");
  const id = `${when}-${Math.random().toString(36).slice(2)}`;

  const timeout = setTimeout(() => {
    exec(command, () => {});
  }, delay);

  scheduledTasks.push({ id, at, command, timeout });
  return { id, at, command };
}

import fg from "fast-glob";

async function filesystemGlob({ pattern, cwd = process.cwd() }) {
  const files = await fg(pattern, { cwd, dot: false });
  return { files };
}

async function textSearch({ pattern, path, regex = false }) {
  const { exec } = await import("child_process");
  const cmd = regex
    ? `rg "${pattern}" "${path}" --line-number`
    : `rg -F "${pattern}" "${path}" --line-number`;

  return new Promise((resolve) => {
    exec(cmd, { maxBuffer: 1024 * 1024 }, (err, stdout) => {
      const matches = stdout
        .split("\n")
        .filter(Boolean)
        .map(line => {
          const [file, lineNo, ...text] = line.split(":");
          return { file, line: Number(lineNo), text: text.join(":") };
        });
      resolve({ matches });
    });
  });
}
import fs from "fs/promises";

async function filesystemPatch({ path, patches }) {
  let content = await fs.readFile(path, "utf8");

  for (const p of patches) {
    if (p.op === "replace") {
      content = content.replace(p.from, p.to);
    }
    if (p.op === "insert") {
      content = content.slice(0, p.at) + p.text + content.slice(p.at);
    }
    if (p.op === "delete") {
      content = content.replace(p.text, "");
    }
  }

  await fs.writeFile(path, content, "utf8");
  return { status: "ok" };
}

async function gitStatus({ cwd = process.cwd() } = {}) {
  const { exec } = await import("child_process");
  return new Promise((resolve) => {
    exec("git status --porcelain", { cwd }, (err, stdout, stderr) => {
      resolve({
        stdout,
        stderr,
        returncode: err ? err.code : 0
      });
    });
  });
}

async function gitDiff({ cwd = process.cwd(), staged = false } = {}) {
  const { exec } = await import("child_process");
  const cmd = staged ? "git diff --staged" : "git diff";
  return new Promise((resolve) => {
    exec(cmd, { cwd }, (err, stdout, stderr) => {
      resolve({
        stdout,
        stderr,
        returncode: err ? err.code : 0
      });
    });
  });
}

async function gitLog({ cwd = process.cwd(), limit = 10 } = {}) {
  const { exec } = await import("child_process");
  const cmd = `git log -n ${limit} --pretty=format:%H\\|%an\\|%s`;

  return new Promise((resolve) => {
    exec(cmd, { cwd }, (err, stdout, stderr) => {
      resolve({
        stdout,
        stderr,
        returncode: err ? err.code : 0
      });
    });
  });
}

async function logsTail({ path, lines = 50 }) {
  const { exec } = await import("child_process");
  return new Promise((resolve) => {
    exec(`tail -n ${lines} "${path}"`, (err, stdout, stderr) => {
      resolve({ stdout, stderr, returncode: err ? err.code : 0 });
    });
  });
}

async function logsGrep({ path, pattern, regex = false }) {
  const { exec } = await import("child_process");
  const cmd = regex
    ? `rg "${pattern}" "${path}"`
    : `rg -F "${pattern}" "${path}"`;
  return new Promise((resolve) => {
    exec(cmd, (err, stdout, stderr) => {
      resolve({ stdout, stderr, returncode: err ? err.code : 0 });
    });
  });
}

async function systemInfo() {
  return {
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
    cwd: process.cwd(),
    uptimeSeconds: Math.floor(process.uptime()),
    memory: process.memoryUsage()
  };
}

async function netHealthcheck({ url, timeoutMs = 2000 }) {
  const fetch = (await import("node-fetch")).default;
  try {
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(to);
    return { status: res.status };
  } catch (e) {
    return { error: e.message };
  }
}

async function jsonParse({ text }) {
  try {
    return { value: JSON.parse(text) };
  } catch (e) {
    return { error: e.message };
  }
}

async function jsonStringify({ value, indent = 2 }) {
  return { text: JSON.stringify(value, null, indent) };
}

async function jsonQuery({ value, path }) {
  try {
    const result = path.split(".").reduce((acc, key) => acc?.[key], value);
    return { value: result };
  } catch {
    return { value: undefined };
  }
}

async function csvToJson({ text, header = true }) {
  const lines = text.trim().split(/\r?\n/);
  const rows = lines.map(l => l.split(","));
  if (!header) return { value: rows };

  const keys = rows.shift();
  const data = rows.map(r =>
    Object.fromEntries(keys.map((k, i) => [k, r[i]]))
  );
  return { value: data };
}

async function hashSha256({ text }) {
  const { createHash } = await import("crypto");
  const hash = createHash("sha256").update(text).digest("hex");
  return { hash };
}

async function textTemplate({ template, vars }) {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, String(v));
  }
  return { text: out };
}

async function archiveZip({ paths, outPath }) {
  const { exec } = await import("child_process");
  const args = paths.map(p => `"${p}"`).join(" ");

  return new Promise((resolve) => {
    exec(`zip -j "${outPath}" ${args}`, (err, stdout, stderr) => {
      resolve({
        stdout,
        stderr,
        returncode: err ? err.code : 0
      });
    });
  });
}

async function archiveUnzip({ zipPath, outDir }) {
  const { exec } = await import("child_process");
  return new Promise((resolve) => {
    exec(`unzip -o "${zipPath}" -d "${outDir}"`, (err, stdout, stderr) => {
      resolve({ stdout, stderr, returncode: err ? err.code : 0 });
    });
  });
}

async function archiveList({ zipPath }) {
  const { exec } = await import("child_process");
  return new Promise((resolve) => {
    exec(`unzip -l "${zipPath}"`, (err, stdout, stderr) => {
      resolve({ stdout, stderr, returncode: err ? err.code : 0 });
    });
  });
}

async function hashFile({ path }) {
  const { createHash } = await import("crypto");
  const fs = await import("fs/promises");
  const data = await fs.readFile(path);
  const hash = createHash("sha256").update(data).digest("hex");
  return { hash };
}

function enforcePolicy(toolName, params = {}) {
  if (typeof toolName !== "string") {
    throw new Error("Invalid tool name");
  }

  // ✅ Environment resolved at CALL TIME, not load time
  const env = process.env.MCP_ENV || "dev";

  const allow = policy.allowTools?.[env] ?? null; // null = allow all
  const deny = policy.denyTools?.[env] ?? [];

  if (allow && !allow.includes(toolName)) {
    throw new Error(`Tool '${toolName}' is not allowed in ${env}`);
  }

  if (deny.includes(toolName)) {
    throw new Error(`Tool '${toolName}' is denied in ${env}`);
  }

  // ✅ Path validation (filesystem + archive tools)
  const candidatePaths = [];

  if (params.path) candidatePaths.push(params.path);
  if (params.zipPath) candidatePaths.push(params.zipPath);
  if (params.outPath) candidatePaths.push(params.outPath);
  if (params.outDir) candidatePaths.push(params.outDir);
  if (Array.isArray(params.paths)) candidatePaths.push(...params.paths);

  if (candidatePaths.length > 0) {
    const roots = policy.fsRoots.map(r => path.resolve(r));

    for (const p of candidatePaths) {
      const resolved = path.resolve(String(p));
      const ok = roots.some(root => resolved === root || resolved.startsWith(root + path.sep));
      const allowed = roots.some(
        root => resolved === root || resolved.startsWith(root + path.sep)
      );
      if (!allowed) {
        throw new Error("Filesystem access outside allowed roots");
      }
    }
  }
}
function audit(msg) {
  console.warn(`[policy] ${msg}`);
}

import { chromium } from "playwright-core";

const pwSessions = new Map(); // sessionId -> { browser, context, page }
function newId(prefix="s") { return `${prefix}-${Math.random().toString(36).slice(2)}`; }

async function pwConnect({ wsEndpoint } = {}) {
  const endpoint = wsEndpoint || `${BROWSERLESS_WS}/chromium/playwright`;
  const browser = await chromium.connect(endpoint); // Playwright-native endpoint [1](https://docs.browserless.io/baas/connection-url-patterns)
  const context = await browser.newContext();
  const page = await context.newPage();
  const sessionId = newId("pw");
  pwSessions.set(sessionId, { browser, context, page });
  return { sessionId, wsEndpoint: endpoint };
}

async function pwClose({ sessionId }) {
  const s = pwSessions.get(sessionId);
  if (!s) return { error: "Unknown sessionId" };
  await s.browser.close();
  pwSessions.delete(sessionId);
  return { status: "ok" };
}

async function pwNewPage({ sessionId }) {
  const s = pwSessions.get(sessionId);
  if (!s) return { error: "Unknown sessionId" };
  s.page = await s.context.newPage();
  return { status: "ok" };
}

async function pwGoto({ sessionId, url }) {
  const s = pwSessions.get(sessionId);
  if (!s) return { error: "Unknown sessionId" };
  await s.page.goto(url);
  return { status: "ok" };
}

async function pwSetContent({ sessionId, html }) {
  const s = pwSessions.get(sessionId);
  if (!s) return { error: "Unknown sessionId" };
  await s.page.setContent(html);
  return { status: "ok" };
}

async function pwEval({ sessionId, expression }) {
  const s = pwSessions.get(sessionId);
  if (!s) return { error: "Unknown sessionId" };
  const value = await s.page.evaluate(expression);
  return { value };
}

async function pwScreenshot({ sessionId, path }) {
  const s = pwSessions.get(sessionId);
  if (!s) return { error: "Unknown sessionId" };
  await s.page.screenshot({ path });
  return { status: "ok", path };
}


const cdpSessions = new Map(); // sessionId -> { ws, nextId, pending }

function _newId(prefix = "cdp") {
  return `${prefix}-${Math.random().toString(36).slice(2)}`;
}

function _wireWS(ws, handlers) {
  // Works with `ws` (EventEmitter style) and global WebSocket (EventTarget style)
  if (typeof ws.on === "function") {
    if (handlers.open) ws.on("open", handlers.open);
    if (handlers.message) ws.on("message", handlers.message);
    if (handlers.error) ws.on("error", handlers.error);
    if (handlers.close) ws.on("close", handlers.close);
    return;
  }
  if (typeof ws.addEventListener === "function") {
    if (handlers.open) ws.addEventListener("open", handlers.open);
    if (handlers.message) ws.addEventListener("message", handlers.message);
    if (handlers.error) ws.addEventListener("error", handlers.error);
    if (handlers.close) ws.addEventListener("close", handlers.close);
    return;
  }
  throw new Error("Unsupported WebSocket implementation");
}

async function cdpConnect({ wsEndpoint } = {}) {
  const endpoint = wsEndpoint || (process.env.BROWSERLESS_WS || "ws://localhost:12355") + "/";

  // Prefer the `ws` package if present; otherwise fall back to global WebSocket
  let WSClass = globalThis.WebSocket;
  try {
    const mod = await import("ws");
    WSClass = mod.default || mod.WebSocket || WSClass;
  } catch {
    // ok, use global WebSocket
  }

  const ws = new WSClass(endpoint);
  const sessionId = _newId("cdp");
  const pending = new Map();
  let nextId = 1;

  const ready = new Promise((resolve, reject) => {
    _wireWS(ws, {
      open: resolve,
      error: (e) => reject(e instanceof Error ? e : new Error(String(e))),
    });
  });

  _wireWS(ws, {
    message: (evt) => {
      const data = typeof evt === "string"
        ? evt
        : (evt?.data ?? evt)?.toString?.() ?? "";

      let msg;
      try { msg = JSON.parse(data); } catch { return; }

      if (typeof msg.id === "number" && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message || "CDP error"));
        else resolve(msg.result);
      }
    }
  });

  await ready;
  cdpSessions.set(sessionId, { ws, nextId, pending });
  return { sessionId, wsEndpoint: endpoint };
}

async function cdpSend({ sessionId, method, params = {} }) {
  const s = cdpSessions.get(sessionId);
  if (!s) return { error: "Unknown sessionId" };

  const id = s.nextId++;
  const payload = { id, method, params };

  const result = await new Promise((resolve, reject) => {
    s.pending.set(id, { resolve, reject });
    s.ws.send(JSON.stringify(payload));
  });

  return { result };
}

async function cdpClose({ sessionId }) {
  const s = cdpSessions.get(sessionId);
  if (!s) return { error: "Unknown sessionId" };
  try { s.ws.close(); } catch {}
  cdpSessions.delete(sessionId);
  return { status: "ok" };
}

async function browserlessContent({ url }) {
  const fetch = (await import("node-fetch")).default;
  const res = await fetch(`${BROWSERLESS_HTTP}/content?url=${encodeURIComponent(url)}`);
  const body = await res.text();
  return { status: res.status, body };
}

async function browserlessHttp({ path, method = "GET", query = {}, headers = {}, body = null }) {
  const fetch = (await import("node-fetch")).default;
  const qs = new URLSearchParams(Object.entries(query).map(([k,v]) => [k, String(v)]));
  const url = `${BROWSERLESS_HTTP}${path}${qs.toString() ? `?${qs}` : ""}`;

  const opts = { method, headers: { ...headers } };
  if (body !== null) {
    opts.headers["Content-Type"] = opts.headers["Content-Type"] || "application/json";
    opts.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  const res = await fetch(url, opts);
  const text = await res.text();
  return { status: res.status, headers: Object.fromEntries(res.headers.entries()), body: text };
}

export async function smtpSend(args) {
  let nodemailer;

  try {
    nodemailer = (await import("nodemailer")).default;
  } catch (e) {
    throw new Error("smtp.send unavailable: nodemailer not installed");
  }

  const transporter = nodemailer.createTransport({
    host: args.host,
    port: args.port,
    secure: false,
    auth: {
      user: args.user,
      pass: args.pass
    }
  });

  const info = await transporter.sendMail({
    from: args.user,
    to: args.to,
    subject: args.subject,
    text: args.text
  });

  return { messageId: info.messageId };
}

export async function imapList(args) {
  let ImapFlow;

  try {
    ({ ImapFlow } = await import("imapflow"));
  } catch (e) {
    throw new Error("imap.list unavailable: imapflow not installed");
  }

  const client = new ImapFlow({
    host: args.host,
    port: args.port,
    secure: true,
    auth: {
      user: args.user,
      pass: args.pass
    }
  });

  await client.connect();
  const lock = await client.getMailboxLock("INBOX");

  const messages = [];
  for await (let msg of client.fetch("1:*", { envelope: true })) {
    messages.push(msg.envelope.subject);
  }

  lock.release();
  await client.logout();

  return { messages };
}

export async function imapFetch() {
  return { message: "not implemented yet" };
}

// ✅ POP3 (safe stub)
export async function pop3List() {
  return { messages: [] };
}

export async function pop3Retrieve() {
  return { message: "not implemented yet" };
}

export async function snmpGet({ host, oid }) {
  let snmp;

  try {
    snmp = (await import("net-snmp")).default;
  } catch (e) {
    throw new Error("snmp.get unavailable: net-snmp not installed");
  }

  return new Promise((resolve) => {
    const session = snmp.createSession(host, "public");

    let settled = false;

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        try { session.close(); } catch {}
        resolve({ error: "timeout" }); // ✅ don't hang
      }
    }, 2000); // ✅ shorter than test timeout

    session.get([oid], (err, varbinds) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);

      try {
        if (err) {
          resolve({ error: err.message });
        } else {
          resolve({
            value: varbinds?.[0]?.value?.toString?.() ?? null
          });
        }
      } finally {
        try { session.close(); } catch {}
      }
    });
  });
}

export function snmpWalk({ host, oid }) {
  return new Promise((resolve, reject) => {
    const session = snmp.createSession(host, "public");
    const results = [];

    session.subtree(oid, (varbind) => {
      results.push({
        oid: varbind.oid,
        value: varbind.value.toString()
      });
    }, (err) => {
      if (err) return reject(err);

      resolve({ results });
      session.close();
    });
  });
}

export function now() {
  return Date.now();
}

export function logEvent(event) {
  // ✅ Structured output (machine-readable)
  console.log(JSON.stringify(event));
}

export function wrapTool(name, fn) {
  return async function (args) {
    const start = now();

    try {
      const result = await fn(args);

      const duration = now() - start;

      logEvent({
        type: "tool.success",
        tool: name,
        durationMs: duration,
        timestamp: new Date().toISOString()
      });

      record(name, duration)

      if (duration > 1000) {
        logEvent({
          type: "tool.slow",
          tool: name,
          durationMs: duration
        });
      }

      return result;

    } catch (error) {
      const duration = now() - start;

      logEvent({
        type: "tool.error",
        tool: name,
        durationMs: duration,
        error: error.message
      });

      throw error;
    }
  };
}

async function handleRpc(req) {
  const start = Date.now();

  try {
    const result = await tools[req.method](req.params);

    console.log(JSON.stringify({
      type: "rpc.success",
      method: req.method,
      durationMs: Date.now() - start
    }));

    return result;

  } catch (err) {
    console.log(JSON.stringify({
      type: "rpc.error",
      method: req.method,
      durationMs: Date.now() - start,
      error: err.message
    }));

    throw err;
  }
}

export const metrics = {
  calls: {},
};

export function record(tool, duration) {
  if (!metrics.calls[tool]) {
    metrics.calls[tool] = {
      count: 0,
      totalMs: 0
    };
  }

  metrics.calls[tool].count++;
  metrics.calls[tool].totalMs += duration;
}