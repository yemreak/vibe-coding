# @yemreak/tsutil

## Usage

```bash
# Install
bun install -g @yemreak/tsutil

# File outline
tsutil outline src/app.ts
→ main:5:30:func:true
→ helper:32:45:func:false

# Only exports
tsutil outline --exports lib.ts
→ processData:10:25:func:true

# Stdin pipe (multiple files)
fd -e ts | tsutil outline -
→ src/app.ts:main:5:30:func:true

# Read function with dependencies
tsutil read processData
→ processData:src/lib.ts:10:25
→ [code lines...]

tsutil read main -d 2
→ main:src/app.ts:5:30
→ [dependencies with code...]

# Refactoring
tsutil rename userId customerId
→ src/auth.ts (3 changes)

tsutil move src/old.ts lib/new.ts
→ moved src/old.ts → lib/new.ts

# Type check
tsutil check
tsutil check src/main.ts
fd -e ts . src/ | tsutil check
→ src/app.ts:42:5:TS2345:Type 'string' not assignable to 'number'
```

## What This Does

TypeScript AST analysis. No runtime, no compilation, just static analysis.

**Pattern:**
- Parse TypeScript → AST (Abstract Syntax Tree) → analyze → output
- Works on source code directly (no build needed)
- Supports refactoring across entire codebase

**Why it works:**
- ts-morph library (TypeScript Compiler API wrapper)
- AST manipulation (rename/move updates all references)
- Type checking without tsc (uses compiler diagnostics)
- Pipe-friendly output (grep/awk/cut compatible)

**Example flow:**
```bash
# Find all exported functions
fd -e ts | tsutil outline - | grep ":func:true$"

# Check specific directory
tsutil check src/api/ | grep TS2345

# Rename variable across codebase
tsutil rename oldName newName
```

## How to Build

```typescript
import { Project } from 'ts-morph'

// Create project
const project = new Project({
  compilerOptions: {
    target: 99, // ESNext
    skipLibCheck: true
  }
})

// Add files
project.addSourceFileAtPath('src/app.ts')

// Get functions
const functions = sourceFile.getFunctions()
functions.forEach(func => {
  console.log(`${func.getName()}:${func.getStartLineNumber()}`)
})

// Rename symbol
sourceFile.forEachDescendant(node => {
  if (node.getText() === 'oldName') {
    node.replaceWithText('newName')
  }
})
```

**Dependencies:** `ts-morph`, `bun`

**Output format:** `name:startLine:endLine:type:exported` (TSV-like)

**License:** Apache-2.0
