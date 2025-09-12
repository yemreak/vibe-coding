# culture

Git culture discovery tool - learn patterns from code history

⚠️ **EXPERIMENTAL**: This package is under active development. Breaking changes may occur at any time.

If you like a version, stick with it: `npm install @yemreak/culture@version`

## Installation

```bash
npm install -g @yemreak/culture
```

## Usage

```
culture - Learn from git history, preserve culture

Git = Our history. Every commit is a lesson, every fix an anti-pattern.
Like learning from ancestors, we learn from git history.

Usage:
  culture [path]        Show file/directory history
  culture -h            Show this help

Examples:
  culture .                     # Project's last 20 commits
  culture src/core/             # core directory history
  culture src/core/auth.ts      # auth.ts file evolution

What you'll see:
  - Past decisions (why did we do it this way?)
  - Anti-patterns (what did fixes correct?)
  - Pattern evolution (what did refactors improve?)
  - Culture DNA (recurring approaches)

```

## License

Apache-2.0 ~ Yunus Emre Ak - yemreak

---
Generated: 2025-09-12 04:27:45
