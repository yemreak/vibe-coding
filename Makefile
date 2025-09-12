.PHONY: help readme readme-all publish

# Default
help:
	@echo "vibe-coding - Experimental Tool Collection"
	@echo ""
	@echo "⚠️  WARNING: All packages are EXPERIMENTAL and UNDER DEVELOPMENT"
	@echo "   Breaking changes may occur at any time"
	@echo "   Use at your own risk - APIs may change without notice"
	@echo "   If you like a version, stick with it: npm install @yemreak/tool@version"
	@echo ""
	@echo "Commands:"
	@echo "  make readme                - Update main README"
	@echo "  make readme PKG=culture    - Update specific package README"
	@echo "  make readme-all            - Update all READMEs"
	@echo "  make publish PKG=culture   - Publish specific package to npm"

# Update README based on PKG parameter
readme:
	@if [ -z "$(PKG)" ]; then \
		echo "Updating main README..."; \
		$(MAKE) readme-main; \
	else \
		echo "Updating README for $(PKG)..."; \
		$(MAKE) readme-package PKG=$(PKG); \
	fi

# Update all READMEs
readme-all:
	@echo "Updating all READMEs..."
	@$(MAKE) readme-main
	@for dir in $$(fd package.json packages/ -x dirname {}); do \
		name=$$(basename "$$dir"); \
		$(MAKE) readme-package PKG=$$name; \
	done

# Update main README
readme-main:
	@if [ ! -f README.md ]; then \
		echo "Error: README.md not found."; \
		exit 1; \
	fi
	@# Create temporary file with content before marker
	@awk '/<!-- Auto-generated -->/{ exit } { print }' README.md > README.tmp
	@# Add marker and dynamic content
	@echo "<!-- Auto-generated -->" >> README.tmp
	@echo "" >> README.tmp
	@echo "## Tools" >> README.tmp
	@echo "" >> README.tmp
	@echo "| Tool | Package | Description |" >> README.tmp
	@echo "|------|---------|-------------|" >> README.tmp
	@# Sort by creation time (newest first)
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
	@echo "✓ Main README updated"

# Update specific package README
readme-package:
	@if [ -z "$(PKG)" ]; then \
		echo "Error: PKG parameter required"; \
		exit 1; \
	fi
	@if [ ! -d "packages/$(PKG)" ]; then \
		echo "Error: Package $(PKG) not found"; \
		exit 1; \
	fi
	@dir="packages/$(PKG)"; \
	pkg=$$(jq -r '.name' "$$dir/package.json"); \
	desc=$$(jq -r '.description' "$$dir/package.json"); \
	echo "# $(PKG)" > "$$dir/README.md"; \
	echo "" >> "$$dir/README.md"; \
	echo "$$desc" >> "$$dir/README.md"; \
	echo "" >> "$$dir/README.md"; \
	echo "⚠️ **EXPERIMENTAL**: This package is under active development. Breaking changes may occur at any time." >> "$$dir/README.md"; \
	echo "" >> "$$dir/README.md"; \
	echo "If you like a version, stick with it: \`npm install $$pkg@version\`" >> "$$dir/README.md"; \
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
	echo "" >> "$$dir/README.md"; \
	echo "## License" >> "$$dir/README.md"; \
	echo "" >> "$$dir/README.md"; \
	echo "Apache-2.0 ~ Yunus Emre Ak - yemreak" >> "$$dir/README.md"; \
	echo "" >> "$$dir/README.md"; \
	echo "---" >> "$$dir/README.md"; \
	echo "Generated: $$(date '+%Y-%m-%d %H:%M:%S')" >> "$$dir/README.md"
	@echo "✓ README for $(PKG) updated"

# Publish package to npm
publish:
	@if [ -z "$(PKG)" ]; then \
		echo "Usage: make publish PKG=culture"; \
		exit 1; \
	fi
	@if [ ! -d "packages/$(PKG)" ]; then \
		echo "Error: Package $(PKG) not found"; \
		exit 1; \
	fi
	@echo "⚠️  Publishing EXPERIMENTAL package @yemreak/$(PKG)..."
	@echo "   Breaking changes may occur at any time"
	@cd packages/$(PKG) && npm publish --access public
	@echo "✓ Published @yemreak/$(PKG) (experimental)"