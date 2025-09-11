.PHONY: help readme publish publish-all list clean test commit

# Default
help:
	@echo "vibe-coding - Tool Collection"
	@echo ""
	@echo "Commands:"
	@echo "  make readme       - Generate README from packages"
	@echo "  make publish      - Publish changed packages"
	@echo "  make publish-all  - Publish all packages"
	@echo "  make list         - List all packages"
	@echo "  make clean        - Remove node_modules"
	@echo "  make test         - Test all tools"
	@echo "  make commit       - Smart commit with learned patterns"

# List packages
list:
	@echo "Available packages:"
	@fd package.json packages/ -x dirname {} | xargs -I {} basename {} | sort

# Smart README generation (updates only between markers)
readme:
	@echo "Updating README.md dynamic content..."
	@if [ ! -f README.md ]; then \
		echo "Error: README.md not found. Please create it with static content first."; \
		exit 1; \
	fi
	@$(MAKE) readme-update-dynamic
	@# Always check package READMEs for updates
	@$(MAKE) readme-packages-check

# Update dynamic content between markers
readme-update-dynamic:
	@# Create temporary file with content before marker
	@awk '/<!-- Auto-generated -->/{ exit } { print }' README.md > README.tmp
	@# Add marker and dynamic content
	@echo "<!-- Auto-generated -->" >> README.tmp
	@echo "" >> README.tmp
	@echo "## AI Usage" >> README.tmp
	@echo "" >> README.tmp
	@echo "These tools are designed for AI agents. Share this repository with your AI and they can:" >> README.tmp
	@echo "- Understand tool usage via \`--help\` output" >> README.tmp
	@echo "- Install tools on your system" >> README.tmp
	@echo "- Execute commands in your workflow" >> README.tmp
	@echo "" >> README.tmp
	@echo "**For AI agents:** Each tool has detailed README. Use \`toolname --help\` for usage." >> README.tmp
	@echo "" >> README.tmp
	@echo "## ⚠️ Active Development Notice" >> README.tmp
	@echo "" >> README.tmp
	@echo "**These packages are under active development** and may receive frequent updates with breaking changes." >> README.tmp
	@echo "" >> README.tmp
	@echo "**Recommendation:** If you find a version that works for your use case, pin it to avoid unexpected changes:" >> README.tmp
	@echo "" >> README.tmp
	@echo '```bash' >> README.tmp
	@echo "# Pin to specific version instead of latest" >> README.tmp
	@echo "npm install -g @yemreak/toolname@1.2.3" >> README.tmp
	@echo "" >> README.tmp
	@echo "# Check current version" >> README.tmp
	@echo "npm list -g @yemreak/toolname" >> README.tmp
	@echo '```' >> README.tmp
	@echo "" >> README.tmp
	@echo "I follow semantic versioning, but core functionality may evolve rapidly during this phase." >> README.tmp
	@echo "" >> README.tmp
	@echo "## Tools" >> README.tmp
	@echo "" >> README.tmp
	@echo "| Tool | Package | Description |" >> README.tmp
	@echo "|------|---------|-------------|" >> README.tmp
	@# Sort by creation time (newest first), then by name
	@for dir in $$(fd package.json packages/ -x dirname {} | xargs -I {} stat -f "%B %N" {} | sort -rn | cut -d' ' -f2-); do \
		name=$$(basename "$$dir"); \
		pkg=$$(jq -r '.name' "$$dir/package.json"); \
		desc=$$(jq -r '.description' "$$dir/package.json"); \
		echo "| [\`$$name\`](packages/$$name) | \`$$pkg\` | $$desc |" >> README.tmp; \
	done
	@echo "" >> README.tmp
	@echo "## Development" >> README.tmp
	@echo "" >> README.tmp
	@echo '```bash' >> README.tmp
	@echo 'make readme    # Smart README generation' >> README.tmp
	@echo 'make publish   # Publish packages' >> README.tmp
	@echo 'make test      # Test all tools' >> README.tmp
	@echo '```' >> README.tmp
	@echo "" >> README.tmp
	@echo "---" >> README.tmp
	@echo "Generated: $$(date '+%Y-%m-%d %H:%M:%S')" >> README.tmp
	@# Replace README.md with the new version
	@mv README.tmp README.md
	@echo "README.md updated successfully"

# Check and update package READMEs only if needed
readme-packages-check:
	@for dir in $$(fd package.json packages/ -x dirname {}); do \
		name=$$(basename "$$dir"); \
		if [ ! -f "$$dir/README.md" ] || [ "$$dir/package.json" -nt "$$dir/README.md" ] || [ "$$dir/index.ts" -nt "$$dir/README.md" ]; then \
			echo "Updating README for $$name..."; \
			pkg=$$(jq -r '.name' "$$dir/package.json"); \
			desc=$$(jq -r '.description' "$$dir/package.json"); \
			echo "# $$name" > "$$dir/README.md"; \
			echo "" >> "$$dir/README.md"; \
			echo "$$desc" >> "$$dir/README.md"; \
			echo "" >> "$$dir/README.md"; \
			echo "## Installation" >> "$$dir/README.md"; \
			echo "" >> "$$dir/README.md"; \
			echo '```bash' >> "$$dir/README.md"; \
			echo "npm install -g $$pkg" >> "$$dir/README.md"; \
			echo "bun add -g $$pkg" >> "$$dir/README.md"; \
			echo "" >> "$$dir/README.md"; \
			echo "# Uninstall" >> "$$dir/README.md"; \
			echo "npm uninstall -g $$pkg" >> "$$dir/README.md"; \
			echo "bun remove -g $$pkg" >> "$$dir/README.md"; \
			echo '```' >> "$$dir/README.md"; \
			echo "" >> "$$dir/README.md"; \
			echo "## Usage" >> "$$dir/README.md"; \
			echo "" >> "$$dir/README.md"; \
			echo '```' >> "$$dir/README.md"; \
			(cd "$$dir" && timeout 5s bun run ./index.ts -h 2>/dev/null | head -20) >> "$$dir/README.md" || true; \
			echo '```' >> "$$dir/README.md"; \
			echo "" >> "$$dir/README.md"; \
			echo "## License" >> "$$dir/README.md"; \
			echo "" >> "$$dir/README.md"; \
			echo "Apache-2.0" >> "$$dir/README.md"; \
			echo "" >> "$$dir/README.md"; \
			echo "---" >> "$$dir/README.md"; \
			echo "Generated: $$(date '+%Y-%m-%d %H:%M:%S')" >> "$$dir/README.md"; \
		else \
			echo "README for $$name is up to date"; \
		fi; \
	done


# Clean
clean:
	@fd node_modules . -t d -x rm -rf {}
	@echo "Cleaned node_modules"

# Test tools
test:
	@echo "Testing tools..."
	@for dir in $$(fd package.json packages/ -x dirname {}); do \
		name=$$(basename $$dir); \
		echo "Testing $$name..."; \
		(cd $$dir && bun run ./index.ts -h) || true; \
		echo ""; \
	done

# Commit protocol (information only)
commit:
	@echo "════════════════════════════════════════"
	@echo "COMMIT PROTOCOL"
	@echo "════════════════════════════════════════"
	@echo "1. Git status check:"
	@git status --short
	@echo ""
	@echo "2. Recent learned commits:"
	@echo "────────────────────────────────────────"
	@for i in 0 1 2 3 4; do \
		git log --grep="^learned:" --skip=$$i -n 1 --format="%B" 2>/dev/null | head -n 6; \
		echo "────────────────────────────────────────"; \
	done
	@echo ""
	@echo "3. Changes:"
	@git diff --cached --stat
	@echo ""
	@echo "════════════════════════════════════════"
	@echo "REMINDER:"
	@echo "- Focus on actions (add, remove, fix, update)"
	@echo "- What did you learn? (patterns, not tool details)"
	@echo "- What is the goal? (attention reduction, speed, etc)"
	@echo "════════════════════════════════════════"
	@echo ""
	@echo "Manual commit template:"
	@echo "git commit -m 'learned: [title]"
	@echo ""
	@echo "- [learning 1]"
	@echo "- [learning 2]"
	@echo "- [learning 3]"
	@echo ""
	@echo "Co-Authored-By: Claude <noreply@anthropic.com>'"

# Test tools
test:
	@echo "Testing tools..."
	@for dir in $$(fd package.json packages/ -x dirname {}); do \
		name=$$(basename "$$dir"); \
		echo "Testing $$name..."; \
		(cd "$$dir" && bun run ./index.ts -h) || true; \
		echo ""; \
	done
