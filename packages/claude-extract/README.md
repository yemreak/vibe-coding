# claude-extract

Extract user messages from Claude chat exports

## Installation

```bash
npm install -g @yemreak/claude-extract
```

## Usage

```
claude-extract - Transfer conversation between Claude sessions

Usage:
  claude-extract      Extract all messages
  claude-extract N    Extract Nth message
  claude-extract -N   Extract Nth from end
  claude-extract N:M  Extract range N to M
  claude-extract :N   Extract first N messages
  claude-extract -N:  Extract last N messages

Workflow:
  1. Current Claude: /export → Copy to clipboard
  2. New Claude: claude-extract (in bash)
  3. Paste result → AI continues with context
```

## License

Apache-2.0 ~ Yunus Emre Ak - yemreak

---
Generated: 2025-09-12 02:45:50
