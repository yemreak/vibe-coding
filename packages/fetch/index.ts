#!/usr/bin/env bun

import { createHash } from 'crypto'
import { mkdirSync } from 'fs'
import puppeteer from 'puppeteer'

const LLMS_PATHS = ['/docs/llms.txt', '/llms.txt', '/.well-known/llms.txt', '/api/llms.txt', '/public/llms.txt']

async function findLlmsTxt(domain: string): Promise<string | null> {
	const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '')

	for (const path of LLMS_PATHS) {
		const url = `https://${cleanDomain}${path}`
		try {
			const response = await fetch(url, { method: 'HEAD' })
			if (response.ok) {
				const contentType = response.headers.get('content-type') || ''
				if (contentType.includes('text/plain')) return url
			}
		} catch {
			continue
		}
	}

	return null
}

async function fetchLlmsTxt(url: string): Promise<string> {
	const response = await fetch(url)
	if (!response.ok) {
		throw new Error(`Failed to fetch ${url}: ${response.status}`)
	}
	return await response.text()
}

function extractDomain(url: string): string {
	try {
		const parsed = new URL(url)
		return parsed.hostname
	} catch {
		throw new Error(`Invalid URL: ${url}`)
	}
}

function extractPathSegment(url: string): string | null {
	try {
		const parsed = new URL(url)
		const segments = parsed.pathname.split('/').filter(Boolean)
		return segments.length > 0 ? segments[segments.length - 1]! : null
	} catch {
		return null
	}
}

function grepSection(content: string, keyword: string): string {
	const lines = content.split('\n')
	const matchedLines: string[] = []
	let inSection = false
	let sectionLevel = 0

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]!
		const lower = line.toLowerCase()

		if (lower.includes(keyword.toLowerCase())) {
			const headerMatch = line.match(/^(#+)\s/)
			if (headerMatch) {
				sectionLevel = headerMatch[1]!.length
				inSection = true
				matchedLines.push(line)
				continue
			}

			if (!inSection) {
				matchedLines.push(line)
			}
		}

		if (inSection) {
			const headerMatch = line.match(/^(#+)\s/)
			if (headerMatch && headerMatch[1]!.length <= sectionLevel) {
				break
			}
			matchedLines.push(line)
		}
	}

	return matchedLines.length > 0 ? matchedLines.join('\n') : content
}

async function main() {
	const args = process.argv.slice(2)

	if (args[0] === '--help' || args[0] === '-h' || !args[0]) {
		console.log(`Usage: fetch [OPTIONS] <url>

BEHAVIOURS:
  # llms.txt kullanarak dökümantasyon çek:
  fetch "https://elevenlabs.io/docs/api-reference"
  → [llms.txt] API documentation text...

  # Stdin'den URL al:
  echo "https://example.com" | fetch -
  → Example Domain...

  # Cache bypass:
  fetch --no-cache "https://example.com"
  → [CACHE] bypass

OPTIONS:
  --no-cache    Bypass cache, force fresh fetch

CACHE:
  /tmp/fetch_cache/{md5}.txt (1 week TTL)`)
		process.exit(args[0] ? 0 : 1)
	}

	const noCache = args.includes('--no-cache')
	const urlArgs = args.filter(arg => arg !== '--no-cache')
	let url = urlArgs[0]

	if (url === '-') {
		const chunks = []
		for await (const chunk of process.stdin) {
			chunks.push(chunk)
		}
		url = chunks.join('').trim()
	}

	if (!url) {
		throw new Error('URL required')
	}

	if (!url.startsWith('http')) {
		throw new Error('URL must start with http:// or https://')
	}

	const urlHash = createHash('md5').update(url).digest('hex')
	const cacheDir = `/tmp/fetch_cache`
	const cacheFile = `${cacheDir}/${urlHash}.txt`
	const CACHE_TTL = 7 * 24 * 60 * 60 * 1000

	if (!noCache && (await Bun.file(cacheFile).exists())) {
		const stats = await Bun.file(cacheFile).stat()
		const age = Date.now() - stats.mtime.getTime()

		if (age < CACHE_TTL) {
			const days = Math.floor(age / (24 * 60 * 60 * 1000))
			const hours = Math.floor((age % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
			const ageStr = days > 0 ? `${days}g ${hours}s` : `${hours}s`
			console.error(`[CACHE] ${ageStr} önce alınmış`)
			const cached = await Bun.file(cacheFile).text()
			console.log(cached)
			return
		}
	}

	const domain = extractDomain(url)
	const llmsTxtUrl = await findLlmsTxt(domain)

	if (llmsTxtUrl) {
		console.error(`[llms.txt] ${llmsTxtUrl}`)

		const llmsTxtHash = createHash('md5').update(llmsTxtUrl).digest('hex')
		const llmsTxtCacheFile = `${cacheDir}/${llmsTxtHash}.txt`

		let content: string

		if (!noCache && (await Bun.file(llmsTxtCacheFile).exists())) {
			const stats = await Bun.file(llmsTxtCacheFile).stat()
			const age = Date.now() - stats.mtime.getTime()

			if (age < CACHE_TTL) {
				content = await Bun.file(llmsTxtCacheFile).text()
			} else {
				content = await fetchLlmsTxt(llmsTxtUrl)
				mkdirSync(cacheDir, { recursive: true })
				await Bun.write(llmsTxtCacheFile, content)
			}
		} else {
			content = await fetchLlmsTxt(llmsTxtUrl)
			mkdirSync(cacheDir, { recursive: true })
			await Bun.write(llmsTxtCacheFile, content)
		}

		const pathSegment = extractPathSegment(url)
		const result = pathSegment ? grepSection(content, pathSegment) : content

		mkdirSync(cacheDir, { recursive: true })
		await Bun.write(cacheFile, result)

		console.log(result)
		return
	}

	const browser = await puppeteer.launch({
		headless: true,
		args: ['--no-sandbox', '--disable-setuid-sandbox']
	})

	const page = await browser.newPage()
	await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })
	await new Promise(resolve => setTimeout(resolve, 3000))

	const text = await page.evaluate(() => {
		// @ts-ignore
		const unwanted = document.querySelectorAll('script, style, noscript')
		// @ts-ignore
		unwanted.forEach(el => el.remove())
		// @ts-ignore
		return document.body.innerText
	})

	await browser.close()

	if (!text || text.length < 100) {
		throw new Error('Puppeteer failed to fetch content')
	}

	const result = text.trim()

	mkdirSync(cacheDir, { recursive: true })
	await Bun.write(cacheFile, result)

	console.log(result)
}

if (import.meta.main) {
	main().catch(err => {
		console.error(`Error: ${err.message}`)
		process.exit(1)
	})
}
