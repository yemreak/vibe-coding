# claude-extract

Extract user messages from Claude chat exports

## Installation

```bash
bun add -g @yemreak/claude-extract
```

## Usage

```bash
claude-extract           # Extract all messages from clipboard
claude-extract 3         # Extract 3rd message
claude-extract -2        # Extract 2nd message from end
claude-extract 1:3       # Extract messages 1 to 3
claude-extract :5        # Extract first 5 messages
claude-extract -3:       # Extract last 3 messages
```

## Experience

1. In Claude Code: `/export` → Copy to clipboard
2. Terminal: `claude-extract`
3. Result: User messages in clipboard

## Pipeline

```bash
# Direct usage
pbpaste | claude-extract | pbcopy

# Count extracted messages
claude-extract 3 && pbpaste | wc -l

# Save to file
claude-extract && pbpaste > messages.txt
```

## How it works

1. Reads Claude chat export from clipboard
2. Parses user messages (lines starting with `>`)
3. Filters based on arguments
4. Writes result back to clipboard

## Requirements

- macOS (for pbpaste/pbcopy)
- Bun runtime