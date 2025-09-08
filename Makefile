.PHONY: help readme publish publish-all list clean test

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

# List packages
list:
	@echo "Available packages:"
	@fd package.json packages/ -x dirname {} | xargs -I {} basename {} | sort

# Generate README dynamically
readme:
	@echo "# vibe-coding" > README.md
	@echo "" >> README.md
	@echo "## Tools" >> README.md
	@echo "" >> README.md
	@echo "| Command | Package | Description |" >> README.md
	@echo "|---------|---------|-------------|" >> README.md
	@for dir in $$(fd package.json packages/ -x dirname {} | sort); do \
		name=$$(basename $$dir); \
		pkg=$$(jq -r '.name' $$dir/package.json); \
		desc=$$(jq -r '.description' $$dir/package.json); \
		echo "| [\`$$name\`](packages/$$name) | \`$$pkg\` | $$desc |" >> README.md; \
	done
	@echo "" >> README.md
	@echo "## Installation" >> README.md
	@echo "" >> README.md
	@echo '```bash' >> README.md
	@echo '# Install specific tool' >> README.md
	@echo 'npm install -g @yemreak/<tool-name>' >> README.md
	@echo '' >> README.md
	@echo '# Or use directly with npx' >> README.md
	@echo 'npx @yemreak/<tool-name>' >> README.md
	@echo '```' >> README.md
	@echo "" >> README.md
	@echo "## Development" >> README.md
	@echo "" >> README.md
	@echo '```bash' >> README.md
	@echo '# Generate README' >> README.md
	@echo 'make readme' >> README.md
	@echo '' >> README.md
	@echo '# Publish packages' >> README.md
	@echo 'make publish' >> README.md
	@echo '```' >> README.md
	@echo "" >> README.md
	@echo "---" >> README.md
	@echo "Generated: $$(date '+%Y-%m-%d %H:%M:%S')" >> README.md

# Publish changed packages
publish:
	@echo "Checking for changes..."
	@for dir in $$(fd package.json packages/ -x dirname {}); do \
		name=$$(basename $$dir); \
		pkg=$$(jq -r '.name' $$dir/package.json); \
		version=$$(jq -r '.version' $$dir/package.json); \
		published=$$(npm view $$pkg version 2>/dev/null || echo "0.0.0"); \
		if [ "$$version" != "$$published" ]; then \
			echo "Publishing $$pkg@$$version (was $$published)..."; \
			(cd $$dir && npm publish); \
		else \
			echo "$$pkg@$$version is up to date"; \
		fi \
	done

# Force publish all
publish-all:
	@for dir in $$(fd package.json packages/ -x dirname {}); do \
		pkg=$$(jq -r '.name' $$dir/package.json); \
		version=$$(jq -r '.version' $$dir/package.json); \
		echo "Publishing $$pkg@$$version..."; \
		(cd $$dir && npm publish --force); \
	done

# Version bump
bump:
	@for dir in $$(fd package.json packages/ -x dirname {}); do \
		pkg=$$(jq -r '.name' $$dir/package.json); \
		old=$$(jq -r '.version' $$dir/package.json); \
		new=$$(echo $$old | awk -F. '{print $$1"."$$2"."$$3+1}'); \
		jq ".version = \"$$new\"" $$dir/package.json > $$dir/package.json.tmp && \
		mv $$dir/package.json.tmp $$dir/package.json; \
		echo "$$pkg: $$old → $$new"; \
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