# vibe-coding

Tool collection for vibe coding workflow

## AI Usage

These tools are designed for AI agents. Share this repository with your AI and they can:
- Understand tool usage via `--help` output
- Install tools on your system
- Execute commands in your workflow

**For AI agents:** Each tool has detailed README. Use `toolname --help` for usage.

## ⚠️ Active Development Notice

**These packages are under active development** and may receive frequent updates with breaking changes.

**Recommendation:** If you find a version that works for your use case, pin it to avoid unexpected changes:

```bash
# Pin to specific version instead of latest
npm install -g @yemreak/toolname@1.2.3

# Check current version
npm list -g @yemreak/toolname
```

I follow semantic versioning, but core functionality may evolve rapidly during this phase.

## Tools

| Tool | Package | Description |
|------|---------|-------------|
| [`culture`](packages/culture) | `@yemreak/culture` | Git culture discovery tool - learn patterns from code history |
| [`claude-extract`](packages/claude-extract) | `@yemreak/claude-extract` | Extract user messages from Claude chat exports |
| [`gc`](packages/gc) | `@yemreak/gc` | Git commits with AI-generated messages |
| [`tsutil`](packages/tsutil) | `@yemreak/tsutil` | TypeScript code analysis tools (AST-based) |
| [`fetch`](packages/fetch) | `@yemreak/fetch` | Web scraper with cache (Chrome headless + pandoc) |

## Development

```bash
make readme    # Smart README generation
make publish   # Publish packages
make test      # Test all tools
```

---
Generated: 2025-09-09 15:19:50
