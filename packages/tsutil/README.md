# @yemreak/tsutil

TypeScript code analysis tools with AST manipulation

## Why
When you need to understand TypeScript code structure, refactor symbols, or check types

## Install
```bash
bun add -g @yemreak/tsutil
```

## Usage

### Outline
```bash
tsutil outline src/auth.ts
tsutil outline --exports src/types.ts  
fd "*.ts" | tsutil outline -
```

### Read Functions
```bash
tsutil read login
tsutil read fetchUser -d 2 
```

### Refactor
```bash
tsutil rename oldName newName
tsutil move src/old.ts lib/new.ts
```

### Type Check
```bash
tsutil check
tsutil check src/main.ts
fd -e ts | tsutil check
```

## Pipeline Examples
```bash
# Count all functions
fd -e ts | tsutil outline - | grep ^func: | wc -l

# Find type errors
tsutil check | grep TS2345

# Extract function code
tsutil read main | grep "^code:" | cut -d: -f3-
```