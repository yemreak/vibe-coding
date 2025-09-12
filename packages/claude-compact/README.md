# claude-compact

Compact and transfer conversations between Claude sessions

⚠️ **EXPERIMENTAL**: This package is under active development. Breaking changes may occur at any time.

If you like a version, stick with it: `npm install @yemreak/claude-compact@version`

## Installation

```bash
npm install -g @yemreak/claude-compact
```

## Usage

```
claude-compact - Compact and transfer conversations between Claude sessions

Usage:
  claude-compact      Extract all messages
  claude-compact N    Extract Nth message
  claude-compact -N   Extract Nth from end
  claude-compact N:M  Extract range N to M
  claude-compact :N   Extract first N messages
  claude-compact -N:  Extract last N messages

Workflow:
  1. Current Claude: /export → Copy to clipboard
  2. New Claude: claude-compact (in bash)
  3. Paste result → AI continues with context
```

## License

Apache-2.0 ~ Yunus Emre Ak - yemreak

---
Generated: 2025-09-12 15:56:17
