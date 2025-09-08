# @yemreak/culture

Git culture discovery tool - learn patterns from code history instead of reading documentation.

## Philosophy

Part of the **Zero Documentation → Living Code** philosophy. Instead of maintaining outdated documentation, discover patterns directly from code evolution.

📖 **Read more**: [Zero Documentation Living Code](https://yemreak.com/claude-ai-coding/zero-documentation-living-code)

## Installation

```bash
npm install -g @yemreak/culture
# or
npx @yemreak/culture
```

## Usage

```bash
# Show last 3 changed files with context
culture

# Specific directory
culture src/

# Show last 10 files
culture . -n 10

# Content only (no metadata)
culture src/ -c
```

## Output Example

```
428aad9 refactor: clarity-completion
6ebadf0 learned: symlink > alias
---
src/interface/bin/cache.ts (2 hours ago)
src/interface/bin/telegram.ts (1 day ago)
---

=== src/interface/bin/cache.ts ===
#!/usr/bin/env bun
import { $ } from "bun"
...
```

## How It Works

1. **Discovers patterns** from git history
2. **Shows recent changes** to understand evolution
3. **Displays actual code** not documentation
4. **Learns from tradition** - what came before guides what comes next

## Zero Documentation Philosophy

Stop writing documentation. Start writing better code. This tool helps you:

- Learn from existing patterns
- Understand code evolution
- Follow established conventions
- Skip documentation entirely

## Related Tools

Explore our other tools from the [vibe-coding](https://github.com/yemreak/vibe-coding) collection:

- [@yemreak/gc](https://www.npmjs.com/package/@yemreak/gc) - AI-powered git commits
- [@yemreak/fetch](https://www.npmjs.com/package/@yemreak/fetch) - JS-rendered page fetcher
- [@yemreak/tsutil](https://www.npmjs.com/package/@yemreak/tsutil) - TypeScript utilities
- [@yemreak/claude-extract](https://www.npmjs.com/package/@yemreak/claude-extract) - Extract Claude conversations

## License

MIT