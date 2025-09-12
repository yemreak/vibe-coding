# git-smart-commit

Git commits with AI-generated messages using Claude

## Requirements

Requires [Anthropic Claude Code](https://github.com/anthropics/claude-code) CLI to be installed:

```bash
npm install -g @anthropic-ai/claude-code
```

## Installation

```bash
npm install -g @yemreak/git-smart-commit
```

## Usage

```bash
# Stage your changes first
git add .

# Generate commit message with Claude
git-smart-commit
# or use the short alias
gitc
```

The tool will:
1. Analyze your staged changes
2. Look at recent commit history for context
3. Generate a clear, specific commit message using Claude
4. Create the commit automatically

## Features

- Analyzes git diff to understand changes
- Follows conventional commit format
- Creates concise, meaningful commit messages
- Adds Claude as co-author
- Works with any git repository

## License

Apache-2.0 ~ Yunus Emre Ak - yemreak

---
Generated: 2025-09-12 02:45:49
