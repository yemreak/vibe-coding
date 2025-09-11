.PHONY: help readme

# Default
help:
	@echo "vibe-coding - Tool Collection"
	@echo ""
	@echo "Commands:"
	@echo "  make readme       - Generate README from packages"

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
	@echo "---" >> README.tmp
	@echo "Generated: $$(date '+%Y-%m-%d %H:%M:%S')" >> README.tmp
	@# Replace README.md with the new version
	@mv README.tmp README.md
	@echo "README.md updated successfully"

# Check and update package READMEs only if needed
readme-packages-check:
	@for dir in $$(fd package.json packages/ -x dirname {}); do \
		name=$$(basename "$$dir"); \
		if [ ! -f "$$dir/README.md" ] || [ "$$dir/package.json" -nt "$$dir/README.md" ] || [ "$$dir/index.ts" -nt "$$dir/README.md" ] || [ "$$dir/index.js" -nt "$$dir/README.md" ]; then \
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
			echo '```' >> "$$dir/README.md"; \
			echo "" >> "$$dir/README.md"; \
			echo "## Usage" >> "$$dir/README.md"; \
			echo "" >> "$$dir/README.md"; \
			echo '```' >> "$$dir/README.md"; \
			if [ -f "$$dir/index.ts" ]; then \
				(cd "$$dir" && timeout 5s bun run ./index.ts -h 2>/dev/null | head -20) >> "$$dir/README.md" || true; \
			elif [ -f "$$dir/index.js" ]; then \
				(cd "$$dir" && timeout 5s node ./index.js -h 2>/dev/null | head -20) >> "$$dir/README.md" || true; \
			fi; \
			echo '```' >> "$$dir/README.md"; \
		else \
			echo "README for $$name is up to date"; \
		fi; \
	done