# vibe-coding

## Tools

| Command | Package | Description |
|---------|---------|-------------|
| [`claude-extract`](packages/claude-extract) | `@yemreak/claude-extract` | Extract user messages from Claude chat exports |
| [`culture`](packages/culture) | `@yemreak/culture` | Git culture discovery tool - learn patterns from code history |
| [`fetch`](packages/fetch) | `@yemreak/fetch` | Web scraper with cache (Chrome headless + pandoc) |
| [`gc`](packages/gc) | `@yemreak/gc` | Git commits with AI-generated messages |
| [`tsutil`](packages/tsutil) | `@yemreak/tsutil` | TypeScript code analysis tools (AST-based) |

## Installation

```bash
# Install specific tool
npm install -g @yemreak/<tool-name>

# Or use directly with npx
npx @yemreak/<tool-name>
```

## Development

```bash
# Generate README
make readme

# Publish packages
make publish
```

---
Generated: 2025-09-08 17:56:03
