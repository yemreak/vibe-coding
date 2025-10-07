#!/usr/bin/env bun

import { Project, Node } from "ts-morph"
import { $ } from "bun"

// Symbols (for reference only):
// → func, ● var, ■ class, ◆ interface, ※ type, ✻ enum

function createTSProject(bunMode = false): Project {
	if (bunMode) {
		return new Project({
			compilerOptions: {
				target: 99, // ESNext - Bun native
				module: 99, // Preserve - Bun modules
				moduleResolution: 100, // Bundler - Bun style
				lib: ["ESNext", "DOM", "DOM.Iterable"],
				types: ["bun-types"],
				allowImportingTsExtensions: true,
				verbatimModuleSyntax: true,
				noEmit: true,
				strict: true,
				noUnusedLocals: true,
				noUnusedParameters: true,
				skipLibCheck: true,
				allowJs: true,
			},
			skipAddingFilesFromTsConfig: true,
		})
	}
	return new Project({
		compilerOptions: {
			target: 99, // Latest
			module: 199, // ESNext
			moduleResolution: 100, // Bundler
			lib: ["ESNext"],
			skipLibCheck: true,
			skipDefaultLibCheck: true,
			allowJs: true,
		},
		skipAddingFilesFromTsConfig: true,
	})
}

interface OutlineItem {
	name: string
	startLine: number
	endLine: number
	type: string // func, var, class, interface, type, enum
	exported: boolean
}

function getTypeScriptOutline(
	filePath: string,
	exportsOnly: boolean = false
): OutlineItem[] {
	const project = createTSProject()

	const sourceFile = project.addSourceFileAtPath(filePath)
	const items: OutlineItem[] = []

	if (!exportsOnly) {
		// Get ALL functions, classes, interfaces, etc.
		sourceFile.getFunctions().forEach(func => {
			const name = func.getName()
			if (name) {
				const startLine = func.getStartLineNumber()
				const endLine = func.getEndLineNumber()
				const exported = func.isExported()
				items.push({ name, startLine, endLine, type: "func", exported })
			}
		})

		sourceFile.getClasses().forEach(cls => {
			const name = cls.getName()
			if (name) {
				const startLine = cls.getStartLineNumber()
				const endLine = cls.getEndLineNumber()
				const exported = cls.isExported()
				items.push({ name, startLine, endLine, type: "class", exported })
			}
		})

		sourceFile.getInterfaces().forEach(iface => {
			const name = iface.getName()
			const startLine = iface.getStartLineNumber()
			const endLine = iface.getEndLineNumber()
			const exported = iface.isExported()
			items.push({ name, startLine, endLine, type: "interface", exported })
		})

		sourceFile.getTypeAliases().forEach(type => {
			const name = type.getName()
			const startLine = type.getStartLineNumber()
			const endLine = type.getEndLineNumber()
			const exported = type.isExported()
			items.push({ name, startLine, endLine, type: "type", exported })
		})

		sourceFile.getEnums().forEach(enumDecl => {
			const name = enumDecl.getName()
			const startLine = enumDecl.getStartLineNumber()
			const endLine = enumDecl.getEndLineNumber()
			const exported = enumDecl.isExported()
			items.push({ name, startLine, endLine, type: "enum", exported })
		})

		sourceFile.getVariableDeclarations().forEach(varDecl => {
			const name = varDecl.getName()
			const startLine = varDecl.getStartLineNumber()
			const endLine = varDecl.getEndLineNumber()
			const init = varDecl.getInitializer()
			const exported = varDecl.isExported()
			let type = "var"
			if (
				init &&
				(Node.isArrowFunction(init) || Node.isFunctionExpression(init))
			) {
				type = "func"
			}
			items.push({ name, startLine, endLine, type, exported })
		})
	} else {
		// Get only exported declarations
		const exportedDeclarations = sourceFile.getExportedDeclarations()
		for (const [name, declarations] of exportedDeclarations) {
			for (const decl of declarations) {
				const startLine = decl.getStartLineNumber()
				const endLine = decl.getEndLineNumber()
				let type = "unknown"

				// Check the actual node type
				if (
					Node.isFunctionDeclaration(decl) ||
					Node.isArrowFunction(decl) ||
					Node.isFunctionExpression(decl)
				) {
					type = "func"
				} else if (Node.isClassDeclaration(decl)) {
					type = "class"
				} else if (Node.isInterfaceDeclaration(decl)) {
					type = "interface"
				} else if (Node.isTypeAliasDeclaration(decl)) {
					type = "type"
				} else if (Node.isEnumDeclaration(decl)) {
					type = "enum"
				} else if (Node.isVariableDeclaration(decl)) {
					// Check if it's a function assignment
					const init = decl.getInitializer()
					if (
						init &&
						(Node.isArrowFunction(init) || Node.isFunctionExpression(init))
					) {
						type = "func"
					} else {
						type = "var"
					}
				}

				items.push({ name, startLine, endLine, type, exported: true })
			}
		}
	}

	// Sort by line number
	return items.sort((a, b) => a.startLine - b.startLine)
}

interface FunctionInfo {
	file: string
	startLine: number
	endLine: number
	name: string
	code: string[]
	dependencies?: FunctionInfo[]
}

async function renameSymbol(
	symbolName: string,
	newName: string,
	searchPath: string = "."
): Promise<{ file: string; changes: number }[]> {
	const project = createTSProject()

	// Find all TypeScript files
	const searchResult = await $`fd -e ts -e tsx . ${searchPath} -E node_modules -E dist -E build`.text()
	const files = searchResult.split("\n").filter(Boolean)

	if (files.length === 0) {
		throw new Error("No TypeScript files found")
	}

	// Add all files to project
	for (const file of files) {
		project.addSourceFileAtPath(file)
	}

	const results: { file: string; changes: number }[] = []
	const sourceFiles = project.getSourceFiles()

	// Find all references to the symbol
	for (const sourceFile of sourceFiles) {
		let changeCount = 0

		// Find all identifiers matching the symbol name
		sourceFile.forEachDescendant(node => {
			if (Node.isIdentifier(node) && node.getText() === symbolName) {
				// Check if this is a declaration or reference
				const parent = node.getParent()
				
				// Skip if it's a property access (e.g., obj.symbolName)
				if (parent && Node.isPropertyAccessExpression(parent) && parent.getNameNode() === node) {
					// This is a property, not the symbol we're looking for
					if (parent.getExpression().getText() !== "this" && parent.getExpression().getText() !== "super") {
						return
					}
				}

				// Rename the identifier
				node.replaceWithText(newName)
				changeCount++
			}
		})

		if (changeCount > 0) {
			// Save the file
			await sourceFile.save()
			results.push({ file: sourceFile.getFilePath(), changes: changeCount })
		}
	}

	return results
}

async function moveFile(
	oldPath: string,
	newPath: string,
	searchPath: string = "."
): Promise<{ file: string; changes: number }[]> {
	const project = createTSProject()

	// Check if old file exists
	if (!await Bun.file(oldPath).exists()) {
		throw new Error(`File not found: ${oldPath}`)
	}

	// Find all TypeScript files that might import this file
	const searchResult = await $`fd -e ts -e tsx . ${searchPath} -E node_modules -E dist -E build`.text()
	const files = searchResult.split("\n").filter(Boolean)

	if (files.length === 0) {
		throw new Error("No TypeScript files found")
	}

	// Add all files to project
	for (const file of files) {
		project.addSourceFileAtPath(file)
	}

	const results: { file: string; changes: number }[] = []
	const sourceFiles = project.getSourceFiles()

	// Calculate relative import paths
	const path = await import("path")

	// Update all import statements
	for (const sourceFile of sourceFiles) {
		let changeCount = 0
		const filePath = sourceFile.getFilePath()
		const fileDir = path.dirname(filePath)

		// Get all import declarations
		sourceFile.getImportDeclarations().forEach(importDecl => {
			const moduleSpecifier = importDecl.getModuleSpecifierValue()
			
			// Check if this import references the file being moved
			const resolvedPath = path.resolve(fileDir, moduleSpecifier)
			const resolvedOldPath = path.resolve(searchPath, oldPath).replace(/\.tsx?$/, "")
			
			if (resolvedPath === resolvedOldPath || resolvedPath === resolvedOldPath + ".ts" || resolvedPath === resolvedOldPath + ".tsx") {
				// Calculate new relative path from this file to the new location
				const newRelativeImport = path.relative(fileDir, path.resolve(searchPath, newPath)).replace(/\.tsx?$/, "")
				const finalPath = newRelativeImport.startsWith(".") ? newRelativeImport : "./" + newRelativeImport
				
				importDecl.setModuleSpecifier(finalPath)
				changeCount++
			}
		})

		// Get all export declarations (re-exports)
		sourceFile.getExportDeclarations().forEach(exportDecl => {
			const moduleSpecifier = exportDecl.getModuleSpecifierValue()
			if (!moduleSpecifier) return
			
			const resolvedPath = path.resolve(fileDir, moduleSpecifier)
			const resolvedOldPath = path.resolve(searchPath, oldPath).replace(/\.tsx?$/, "")
			
			if (resolvedPath === resolvedOldPath || resolvedPath === resolvedOldPath + ".ts" || resolvedPath === resolvedOldPath + ".tsx") {
				const newRelativeImport = path.relative(fileDir, path.resolve(searchPath, newPath)).replace(/\.tsx?$/, "")
				const finalPath = newRelativeImport.startsWith(".") ? newRelativeImport : "./" + newRelativeImport
				
				exportDecl.setModuleSpecifier(finalPath)
				changeCount++
			}
		})

		if (changeCount > 0) {
			await sourceFile.save()
			results.push({ file: filePath, changes: changeCount })
		}
	}

	// Actually move the file
	await $`mv ${oldPath} ${newPath}`
	results.push({ file: newPath, changes: 1 }) // The move itself

	return results
}

async function checkTypes(
	filePath?: string,
	searchPath: string = "."
): Promise<{ file: string; line: number; column: number; code: string; message: string }[]> {
	const project = createTSProject(true)

	// Add files to project
	if (filePath) {
		// Single file
		project.addSourceFileAtPath(filePath)
	} else {
		// All TypeScript and JavaScript files in searchPath
		const searchResult = await $`fd -e ts -e tsx -e js -e jsx . ${searchPath} -E node_modules -E dist -E build`.text()
		const files = searchResult.split("\n").filter(Boolean)
		
		if (files.length === 0) {
			throw new Error("No TypeScript or JavaScript files found")
		}
		
		for (const file of files) {
			project.addSourceFileAtPath(file)
		}
	}

	const errors: { file: string; line: number; column: number; code: string; message: string }[] = []
	
	// Get pre-emit diagnostics
	const diagnostics = project.getPreEmitDiagnostics()
	
	for (const diagnostic of diagnostics) {
		const sourceFile = diagnostic.getSourceFile()
		if (!sourceFile) continue
		
		const filePath = sourceFile.getFilePath()
		const messageText = diagnostic.getMessageText()
		const message = typeof messageText === "string" ? messageText : messageText.getMessageText()
		const code = `TS${diagnostic.getCode()}`
		
		const start = diagnostic.getStart()
		if (start !== undefined) {
			const position = sourceFile.getLineAndColumnAtPos(start)
			errors.push({
				file: filePath,
				line: position.line,
				column: position.column,
				code,
				message,
			})
		} else {
			// Global error without position
			errors.push({
				file: filePath,
				line: 0,
				column: 0,
				code,
				message,
			})
		}
	}
	
	return errors
}

async function readFunctionWithDependencies(
	funcName: string,
	searchPath: string = ".",
	depth: number = 0
): Promise<FunctionInfo> {
	const readRecursive = async (
		currentFunc: string,
		currentDepth: number
	): Promise<FunctionInfo | null> => {
		try {
			// Find TypeScript files
			const searchResult =
				await $`fd -e ts -e js . ${searchPath} -E node_modules -E dist -E build`.text()
			const files = searchResult.split("\n").filter(Boolean)

			let foundFile: string | undefined
			let funcNode: Node | undefined
			let funcStartLine = 0
			let funcEndLine = 0

			// Search for the function in all files
			for (const file of files) {
				const project = createTSProject()

				const sourceFile = project.addSourceFileAtPath(file)

				// Search for function declarations
				const func = sourceFile.getFunction(currentFunc)
				if (func) {
					foundFile = file
					funcNode = func
					funcStartLine = func.getStartLineNumber()
					funcEndLine = func.getEndLineNumber()
					break
				}

				// Search in variable declarations (arrow functions)
				const varDecl = sourceFile.getVariableDeclaration(currentFunc)
				if (varDecl) {
					const init = varDecl.getInitializer()
					if (
						init &&
						(Node.isArrowFunction(init) || Node.isFunctionExpression(init))
					) {
						foundFile = file
						funcNode = init
						funcStartLine = init.getStartLineNumber()
						funcEndLine = init.getEndLineNumber()
						break
					}
				}
			}

			if (!foundFile || !funcNode) {
				return null
			}

			// Read file content
			const fileContent = await Bun.file(foundFile).text()
			const lines = fileContent.split("\n")
			const codeLines = lines.slice(funcStartLine - 1, funcEndLine)

			const result: FunctionInfo = {
				file: foundFile,
				startLine: funcStartLine,
				endLine: funcEndLine,
				name: currentFunc,
				code: codeLines,
			}

			// Find dependencies if depth > 0
			if (currentDepth > 0) {
				const calls = new Set<string>()
				const builtins = new Set([
					"console",
					"process",
					"Array",
					"Object",
					"String",
					"Number",
					"Boolean",
					"Date",
					"Math",
					"JSON",
					"Promise",
					"Error",
					"parseInt",
					"parseFloat",
					"fetch",
					"setTimeout",
					"setInterval",
					"slice",
					"spawn",
					"exit",
					"Bun",
				])

				// Find function calls within this function
				funcNode.forEachDescendant(node => {
					if (Node.isCallExpression(node)) {
						const expr = node.getExpression()
						if (Node.isIdentifier(expr)) {
							const name = expr.getText()
							if (!builtins.has(name) && name !== currentFunc) {
								calls.add(name)
							}
						} else if (Node.isPropertyAccessExpression(expr)) {
							const name = expr.getName()
							if (!builtins.has(name) && name !== currentFunc) {
								calls.add(name)
							}
						}
					}
				})

				if (calls.size > 0) {
					result.dependencies = []
					for (const dep of calls) {
						const depInfo = await readRecursive(dep, currentDepth - 1)
						if (depInfo) {
							result.dependencies.push(depInfo)
						}
					}
				}
			}

			return result
		} catch (error) {
			return null
		}
	}

	const result = await readRecursive(funcName, depth)
	if (!result) {
		throw new Error(`Function '${funcName}' not found`)
	}
	return result
}

async function main() {
	const args = process.argv.slice(2)

	if (!args[0] || args.includes("-h") || args.includes("--help")) {
		console.log(`tsutil - TypeScript code analysis

BEHAVIOURS:
  # File analysis:
  tsutil outline src/auth.ts
  → login:10:25:func:true
  tsutil outline --exports src/lib.ts
  → processData:5:20:func:true
  fd -e ts | tsutil outline -
  → src/auth.ts:login:10:25:func:true

  # Read function:
  tsutil read processData
  → processData:src/lib.ts:10:25
  tsutil read main -d 2
  → main:src/app.ts:5:30

  # Refactoring:
  tsutil rename userId customerId
  → src/auth.ts (3 changes)
  tsutil move src/old.ts lib/new.ts
  → moved src/old.ts → lib/new.ts

  # Type check:
  tsutil check
  tsutil check --bun src/main.ts
  fd -e ts . src/ | tsutil check
  → src/app.ts:42:5:TS2345:Type 'string' not assignable to 'number'`)
		process.exit(0)
	}

	const command = args[0]

	switch (command) {
		case "outline": {
			const outlineArgs = args.slice(1)
			const flags = outlineArgs.filter(arg => arg.startsWith("-") && arg !== "-")
			const nonFlagArgs = outlineArgs.filter(
				arg => !arg.startsWith("-") || arg === "-"
			)
			const exportsOnly = flags.includes("--exports") || flags.includes("-e")

			if (nonFlagArgs.includes("-")) {
				// Read from stdin
				let stdinText = ""
				for await (const chunk of process.stdin) {
					stdinText += chunk
				}
				const files = stdinText.trim().split("\n").filter(Boolean)
				for (const file of files) {
					try {
						const outline = await getTypeScriptOutline(file.trim(), exportsOnly)
						console.log(outline)
					} catch (err) {
						console.error(`Error processing ${file}: ${err}`)
					}
				}
			} else if (nonFlagArgs.length > 0) {
				const fileName = nonFlagArgs[0]
				if (!fileName) {
					console.error("Error: No file specified")
					process.exit(1)
				}
				try {
					const outline = await getTypeScriptOutline(fileName, exportsOnly)
					console.log(outline)
				} catch (err) {
					console.error(`Error: ${err}`)
					process.exit(1)
				}
			} else {
				console.error("Error: No file specified")
				process.exit(1)
			}
			break
		}

		case "read": {
			const readArgs = args.slice(1)
			if (readArgs.length === 0) {
				console.error("Error: Function name required")
				process.exit(1)
			}

			const functionName = readArgs[0]
			if (!functionName) {
				console.error("Error: Function name required")
				process.exit(1)
			}
			
			let depth = 0
			const depthIndex = readArgs.indexOf("-d")
			if (depthIndex !== -1 && depthIndex + 1 < readArgs.length) {
				const depthStr = readArgs[depthIndex + 1]
				depth = depthStr ? parseInt(depthStr, 10) || 0 : 0
			}

			try {
				const result = await readFunctionWithDependencies(functionName, ".", depth)
				console.log(result)
			} catch (err) {
				console.error(`Error: ${err}`)
				process.exit(1)
			}
			break
		}

		case "rename": {
			if (args.length < 3) {
				console.error("Error: Both old and new symbol names required")
				process.exit(1)
			}

			const oldSymbol = args[1]
			const newSymbol = args[2]
			
			if (!oldSymbol || !newSymbol) {
				console.error("Error: Both old and new symbol names required")
				process.exit(1)
			}

			try {
				await renameSymbol(oldSymbol, newSymbol)
				console.log(`✓ Renamed ${oldSymbol} → ${newSymbol}`)
			} catch (err) {
				console.error(`Error: ${err}`)
				process.exit(1)
			}
			break
		}

		case "move": {
			if (args.length < 3) {
				console.error("Error: Both old and new file paths required")
				process.exit(1)
			}

			const oldPath = args[1]
			const newPath = args[2]
			
			if (!oldPath || !newPath) {
				console.error("Error: Both old and new file paths required")
				process.exit(1)
			}

			try {
				await moveFile(oldPath, newPath)
				console.log(`✓ Moved ${oldPath} → ${newPath}`)
			} catch (err) {
				console.error(`Error: ${err}`)
				process.exit(1)
			}
			break
		}

		case "check": {
			try {
				const filesToCheck = args.slice(1)
				
				if (filesToCheck.length === 0) {
					// Check if stdin has data
					let stdinFiles: string[] = []
					if (!process.stdin.isTTY) {
						let stdinText = ""
						for await (const chunk of process.stdin) {
							stdinText += chunk
						}
						stdinFiles = stdinText.trim().split("\n").filter(Boolean)
					}
					
					if (stdinFiles.length > 0) {
						// Process each file from stdin
						for (const file of stdinFiles) {
							const result = await checkTypes(file.trim())
							if (result.length > 0) {
								console.log(result.map(r => `${r.file}:${r.line}:${r.column}:${r.code}:${r.message}`).join("\n"))
							}
						}
					} else {
						// Check all files
						const result = await checkTypes()
						console.log(result.map(r => `${r.file}:${r.line}:${r.column}:${r.code}:${r.message}`).join("\n"))
					}
				} else {
					// Process each specified file
					for (const file of filesToCheck) {
						const result = await checkTypes(file)
						if (result.length > 0) {
							console.log(result.map(r => `${r.file}:${r.line}:${r.column}:${r.code}:${r.message}`).join("\n"))
						}
					}
				}
			} catch (err) {
				console.error(`Error: ${err}`)
				process.exit(1)
			}
			break
		}

		default:
			console.error(`Error: Unknown command '${command}'`)
			process.exit(1)
	}
}

main().catch(console.error)