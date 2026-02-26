import React, { useState, useRef, useEffect } from "react";

interface Message {
  id: number;
  role: "duck" | "user";
  text: string;
}

// ── Knowledge base ────────────────────────────────────────────────────────────

type Answer = { keywords: string[]; answer: string };

const KB: Answer[] = [
  {
    keywords: ["install", "setup", "start", "begin", "requirement", "node", "bun", "npm"],
    answer:
      "Install duck with:\n\n`npm install -g @duck/docsbot`\n\nor with Bun:\n\n`bun add -g @duck/docsbot`\n\nYou'll need Node ≥18 or Bun, and an `ANTHROPIC_API_KEY` environment variable. See [Installation](/docs/getting-started/installation).",
  },
  {
    keywords: ["generate", "generation", "create doc", "make doc", "write doc"],
    answer:
      "Run `docsbot generate` from your project root. It parses all `.ts` and `.tsx` files, sends structured metadata to Claude, and writes markdown to `docs/agent/`.\n\nKey flags:\n- `--target ./src` — source directory\n- `--output ./docs/api` — where to write\n- `--force` — regenerate even unchanged files\n\nSee the [generate reference](/docs/cli-reference/generate).",
  },
  {
    keywords: ["validate", "validation", "drift", "check", "ci"],
    answer:
      "Run `docsbot validate` to run 4 checks:\n\n1. **Drift** — source hash vs snapshot\n2. **Screenshots** — image hashes unchanged\n3. **Examples** — code blocks execute without error\n4. **LLM review** — Claude audits doc accuracy\n\nExit code 1 on any failure — perfect for CI. Skip checks with `--skip drift,llm`. See [validate reference](/docs/cli-reference/validate).",
  },
  {
    keywords: ["screenshot", "ui", "playwright", "scenario", "capture", "visual"],
    answer:
      "Define scenarios in a `scenarios.yaml` file, then run:\n\n`docsbot screenshots --app http://localhost:3000 --manifest scenarios.yaml`\n\nPlaywright executes each scenario, Claude captions each screenshot, and user-facing guides are written to `docs/user/`. See [screenshots reference](/docs/cli-reference/screenshots).",
  },
  {
    keywords: ["scenario", "yaml", "manifest", "actions"],
    answer:
      "A `scenarios.yaml` defines browser steps for Playwright:\n\n```yaml\n- id: add-todo\n  name: Add a todo\n  actions:\n    - fill: \"[data-testid=input]\" with \"Buy milk\"\n    - click: \"[data-testid=submit]\"\n    - waitForSelector: \".todo-item\"\n```\n\nEach scenario produces a screenshot + AI-generated caption.",
  },
  {
    keywords: ["snapshot", "hash", "content hash", "cache", "incremental"],
    answer:
      "Duck saves a `docsbot-snapshot.json` after each generation run. It stores a SHA-256 hash of every source file. On subsequent runs, only files whose hash changed are regenerated — making large codebases fast. The snapshot also powers drift detection in `validate`.",
  },
  {
    keywords: ["api key", "anthropic", "claude", "llm", "model"],
    answer:
      "Duck uses **Claude Sonnet 4.6** via the Anthropic API. Set your key:\n\n`export ANTHROPIC_API_KEY=sk-ant-...`\n\nDuck makes two types of calls: one to generate markdown from parsed metadata, and an optional review pass in `validate --skip` to omit it.",
  },
  {
    keywords: ["force", "--force", "regenerate", "all files"],
    answer:
      "By default, `docsbot generate` skips files whose source hash hasn't changed. Pass `--force` to regenerate everything:\n\n`docsbot generate --force`\n\nUseful after changing your prompt templates or updating docsbot.",
  },
  {
    keywords: ["skip", "--skip", "drift,llm", "checks"],
    answer:
      "Skip specific validation checks with `--skip`:\n\n`docsbot validate --skip drift,llm`\n\nAvailable values: `drift`, `screenshots`, `examples`, `llm`. Comma-separate multiple values.",
  },
  {
    keywords: ["todo", "example", "demo", "sample", "app"],
    answer:
      "The `apps/todo` directory is a full-stack example app (Hono backend + React frontend) that demonstrates docsbot in action. Run `bun run dev:todo` to start it, then point `docsbot screenshots` at `http://localhost:5173`. See [Todo app example](/docs/examples/todo-app).",
  },
  {
    keywords: ["output", "directory", "folder", "docs/agent", "docs/user"],
    answer:
      "Duck uses these default output directories:\n\n- `docs/agent/` — generated API markdown (from `generate`)\n- `docs/screenshots/` — captured PNG files\n- `docs/user/` — user-facing guides with screenshots (from `screenshots`)\n\nOverride any of them with `--output`, `--screenshots`, flags.",
  },
  {
    keywords: ["monorepo", "workspace", "bun workspace", "apps", "packages"],
    answer:
      "Duck is itself a Bun monorepo with two workspaces:\n\n- `packages/docsbot` — the CLI tool\n- `apps/todo` — the example app\n- `apps/docs` — this documentation site\n\nRun `bun run docs:generate` from the root to generate docs for the todo app.",
  },
  {
    keywords: ["how", "work", "pipeline", "flow", "process", "step"],
    answer:
      "The duck pipeline:\n\n1. **Parse** — TypeScript compiler API extracts functions, types, classes, JSDoc\n2. **Prompt** — structured metadata → LLM prompt\n3. **Generate** — Claude writes markdown docs\n4. **Snapshot** — content hash saved for drift detection\n5. **Validate** — 4 checks gate your CI\n\nSee [Core Concepts → Overview](/docs/core-concepts/overview) for a full walkthrough.",
  },
];

const SUGGESTIONS = [
  "How do I install duck?",
  "How does generate work?",
  "What does validate check?",
  "How do screenshots work?",
];

const GREETING: Message = {
  id: 0,
  role: "duck",
  text: "Hey! I'm the Duck agent 🦆 — ask me anything about docsbot: installation, generating docs, validation, screenshots, or the CLI.",
};

// ── Response logic ────────────────────────────────────────────────────────────

function findAnswer(query: string): string {
  const q = query.toLowerCase();
  for (const entry of KB) {
    if (entry.keywords.some((kw) => q.includes(kw))) {
      return entry.answer;
    }
  }
  return "I don't have a specific answer for that yet, but check the [full docs](/docs/intro) — everything is covered there. You can also open an issue on GitHub if something is missing!";
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DuckAgent() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  let nextId = useRef(1);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [open, messages]);

  function send(text: string) {
    if (!text.trim()) return;
    setShowSuggestions(false);

    const userMsg: Message = { id: nextId.current++, role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);

    // Simulate a short thinking delay
    const delay = 600 + Math.random() * 600;
    setTimeout(() => {
      const answer = findAnswer(text);
      const duckMsg: Message = { id: nextId.current++, role: "duck", text: answer };
      setMessages((m) => [...m, duckMsg]);
      setTyping(false);
    }, delay);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") send(input);
  }

  // Minimal inline markdown renderer (bold + code + links)
  function renderText(text: string) {
    const lines = text.split("\n");
    return lines.map((line, li) => {
      const parts = line.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
      const rendered = parts.map((part, pi) => {
        if (part.startsWith("`") && part.endsWith("`")) {
          return <code key={pi}>{part.slice(1, -1)}</code>;
        }
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={pi}>{part.slice(2, -2)}</strong>;
        }
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
          return (
            <a key={pi} href={linkMatch[2]} style={{ color: "inherit", textDecoration: "underline" }}>
              {linkMatch[1]}
            </a>
          );
        }
        return part;
      });
      return (
        <React.Fragment key={li}>
          {rendered}
          {li < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  }

  return (
    <>
      {/* Toggle button */}
      <button className="duck-agent-btn" onClick={() => setOpen((o) => !o)} aria-label="Open Duck agent">
        🦆 Ask Duck
      </button>

      {/* Chat panel */}
      {open && (
        <div className="duck-agent-panel" role="dialog" aria-label="Duck documentation agent">
          {/* Header */}
          <div className="duck-agent-header">
            <div className="duck-agent-header-title">
              🦆 Duck Agent
              <span className="duck-agent-header-badge">AI</span>
            </div>
            <button className="duck-agent-close" onClick={() => setOpen(false)} aria-label="Close">
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="duck-agent-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`duck-msg ${msg.role === "user" ? "user" : ""}`}>
                {msg.role === "duck" && (
                  <div className="duck-msg-avatar" aria-hidden="true">🦆</div>
                )}
                <div className="duck-msg-bubble">{renderText(msg.text)}</div>
              </div>
            ))}
            {typing && (
              <div className="duck-msg">
                <div className="duck-msg-avatar" aria-hidden="true">🦆</div>
                <div className="duck-msg-bubble">
                  <div className="duck-agent-typing">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {showSuggestions && (
            <div className="duck-suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="duck-suggestion" onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="duck-agent-input">
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask about duck…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              aria-label="Chat input"
            />
            <button onClick={() => send(input)} aria-label="Send">→</button>
          </div>
        </div>
      )}
    </>
  );
}
