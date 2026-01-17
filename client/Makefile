# Client Makefile - Rental Home Project
# Usage: make help - to see all available commands

.PHONY: help install clean dev build deploy surge-deploy prepare-dev prepare-prod test lint

# Default target
help:
	@echo ""
	@echo "═══════════════════════════════════════════════════════════"
	@echo "           Client Makefile - Available Commands"
	@echo "═══════════════════════════════════════════════════════════"
	@echo ""
	@echo "  Development:"
	@echo "    make install        - Install all dependencies"
	@echo "    make dev            - Start development server"
	@echo "    make clean          - Clean build & node_modules"
	@echo "    make prepare-dev    - Prepare for development (clean + install)"
	@echo ""
	@echo "  Production:"
	@echo "    make build          - Build for production"
	@echo "    make prepare-prod   - Prepare for production deploy"
	@echo "    make deploy         - Build and deploy to Surge.sh"
	@echo ""
	@echo "  Surge Deployment:"
	@echo "    make surge-deploy   - Deploy to Surge.sh (after build)"
	@echo ""
	@echo "  Testing & Quality:"
	@echo "    make test           - Run tests"
	@echo "    make lint           - Run linter"
	@echo ""
	@echo "═══════════════════════════════════════════════════════════"
	@echo ""

# Install dependencies
install:
	@echo "📦 Installing client dependencies..."
	@npm install
	@echo "✅ Client dependencies installed!"
	@echo ""
	@echo "Next: Run 'make dev' to start development server"

# Clean build files and node_modules
clean:
	@echo "🧹 Cleaning client files..."
	@rm -rf node_modules
	@rm -rf build
	@rm -rf .cache
	@echo "✅ Client cleaned!"

# Start development server
dev:
	@echo "🚀 Starting client development server..."
	@echo ""
	@echo "═══════════════════════════════════════════════════════════"
	@echo "   Client will start on: http://localhost:3000"
	@echo "   Press Ctrl+C to stop"
	@echo "═══════════════════════════════════════════════════════════"
	@echo ""
	@npm start

# Build for production
build:
	@echo "🏗️  Building client for production..."
	@echo ""
	@npm run build
	@echo ""
	@echo "✅ Client build complete!"
	@echo "📦 Build output: ./build/"
	@echo ""
	@echo "Next steps:"
	@echo "  - Deploy to Surge: make surge-deploy"
	@echo "  - Test locally: npx serve -s build"

# Prepare for development (clean install)
prepare-dev: clean install
	@echo "✅ Client ready for development!"
	@echo ""
	@echo "Run 'make dev' to start development server"

# Prepare for production deployment
prepare-prod: clean install build
	@echo "✅ Client ready for production deployment!"
	@echo ""
	@echo "Next: Run 'make surge-deploy' to deploy to Surge.sh"

# Deploy to Surge.sh (requires build first)
surge-deploy:
	@echo "🚀 Deploying to Surge.sh..."
	@echo ""
	@if [ ! -d "build" ]; then \
		echo "❌ Build folder not found!"; \
		echo "Run 'make build' first"; \
		exit 1; \
	fi
	@npm run deploy
	@echo ""
	@echo "✅ Deployed to Surge.sh!"
	@echo "🌐 URL: https://rental-home-iamdazk.surge.sh"

# Build and deploy (complete workflow)
deploy: build surge-deploy
	@echo ""
	@echo "✅ Build and deployment complete!"

# Run tests
test:
	@echo "🧪 Running client tests..."
	@npm test

# Run linter
lint:
	@echo "🔍 Running linter..."
	@npm run lint 2>/dev/null || echo "No lint script found"

# Quick commands
.PHONY: i d b c
i: install
d: dev
b: build
c: clean

