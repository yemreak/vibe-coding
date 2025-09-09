# tsutil

TypeScript code analysis tools (AST-based)

## Installation

```bash
npm install -g @yemreak/tsutil
bun add -g @yemreak/tsutil

# Uninstall
npm uninstall -g @yemreak/tsutil
bun remove -g @yemreak/tsutil
```

## Usage

```
tsutil - TypeScript code analysis tools

Usage:
  tsutil outline <file>                    Show file outline (all declarations) 
  tsutil outline --exports <file>          Show only exported declarations 
  tsutil outline -                         Read file list from stdin 
  tsutil read <function> [-d depth]        Read function with dependencies 
  tsutil rename <old> <new>                Rename symbol across all files 
  tsutil move <old_path> <new_path>        Move file and update imports 
  tsutil check [file]                      Type check files (stdin pipe supported)

Output:
  type:name:startLine:endLine:visibility (func, var, class, interface, type, enum)

Examples:
  tsutil outline lib.ts                  # Single file
  tsutil outline --exports lib.ts        # Only exports
  fd "*.ts" | tsutil outline -           # Multiple files from stdin
  tsutil outline lib.ts | grep ^func:   # Only functions
  tsutil outline lib.ts | grep :export$ # Only exported items
```

## License

Apache-2.0

---
Generated: 2025-09-09 15:17:26
