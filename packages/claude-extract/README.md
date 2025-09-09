# claude-extract

Extract user messages from Claude chat exports

## Installation

```bash
npm install -g @yemreak/claude-extract
bun add -g @yemreak/claude-extract

# Uninstall
npm uninstall -g @yemreak/claude-extract
bun remove -g @yemreak/claude-extract
```

## Usage

```
claude-extract - Extract messages from Claude chat

Usage:
  claude-extract           Extract all messages
  claude-extract N         Extract Nth message
  claude-extract -N        Extract Nth from end
  claude-extract N:M       Extract range N to M
  claude-extract :N        Extract first N
  claude-extract -N:       Extract last N
  
Experience:
  /export → claude-extract → User (>) assistant (⏺) in clipboard
  
Pipeline:
  claude-extract && pbpaste | wc -l
  claude-extract 3 && pbpaste > messages.txt
```

## License

Apache-2.0

---
Generated: 2025-09-09 15:17:25
