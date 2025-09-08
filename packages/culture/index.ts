#!/usr/bin/env bun

import { $ } from "bun"

async function main() {
	const args = process.argv.slice(2)
	const dir = args[0] || "."
	
	if (args.includes("-h")) {
		console.log(`culture - Git DNA reader

Usage:
  culture [dir]              Last 3 files
  culture [dir] -n 5         Last 5 files
  culture [dir] -c           Content only
  
Examples:
  culture src/
  culture . -n 10 -c`)
		process.exit(0)
	}
	
	const count = args.includes("-n") ? args[args.indexOf("-n") + 1] : "3"
	const contentOnly = args.includes("-c")
	
	// Git'ten son değişen dosyalar
	const { stdout: files } = await $`git log --name-status --format="" -n 30 -- ${dir} | grep -E "^[AM]" | awk '{print $2}' | uniq | head -${count}`.quiet()
	const fileList = files.toString().trim().split("\n").filter(Boolean)
	
	if (!fileList.length) {
		console.error("No files found in git history")
		process.exit(1)
	}
	
	if (!contentOnly) {
		// Commit özeti
		const { stdout: commits } = await $`git log --oneline -n ${count} -- ${dir}`.quiet()
		console.log(commits.toString())
		console.log("---")
		
		// Dosya listesi
		for (const file of fileList) {
			const { stdout: lastChange } = await $`git log -1 --format="%ar" -- ${file}`.quiet()
			console.log(`${file} (${lastChange.toString().trim()})`)
		}
		console.log("---\n")
	}
	
	// İçerikler
	for (const file of fileList) {
		const content = await Bun.file(file).text().catch(() => "")
		if (!content) continue
		
		const lines = content.split("\n").slice(0, 50).join("\n")
		if (!contentOnly) console.log(`\n=== ${file} ===`)
		console.log(lines)
	}
}

if (import.meta.main) {
	main().catch(console.error)
}