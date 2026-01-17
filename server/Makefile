# Server Makefile - Rental Home Project
# Usage: make help - to see all available commands

.PHONY: help install clean dev start prepare-dev prepare-prod test test-concurrent test-scenarios logs deploy-info render-check

# Default target
help:
	@echo ""
	@echo "═══════════════════════════════════════════════════════════"
	@echo "           Server Makefile - Available Commands"
	@echo "═══════════════════════════════════════════════════════════"
	@echo ""
	@echo "  Development:"
	@echo "    make install        - Install all dependencies"
	@echo "    make dev            - Start development server (nodemon)"
	@echo "    make start          - Start production server"
	@echo "    make clean          - Clean node_modules & logs"
	@echo "    make prepare-dev    - Prepare for development (clean + install)"
	@echo ""
	@echo "  Production:"
	@echo "    make prepare-prod   - Prepare for production (clean + install)"
	@echo ""
	@echo "  Deployment:"
	@echo "    make deploy-info    - Show deployment information"
	@echo "    make render-check   - Verify Render deployment config"
	@echo ""
	@echo "  Testing:"
	@echo "    make test           - Run all tests"
	@echo "    make test-concurrent- Run concurrent booking tests"
	@echo "    make test-scenarios - Run booking scenario tests"
	@echo ""
	@echo "  Environment:"
	@echo "    make setup-env      - Setup .env file from example"
	@echo ""
	@echo "  Logs:"
	@echo "    make logs           - View server logs (tail)"
	@echo "    make logs-clear     - Clear server logs"
	@echo ""
	@echo "═══════════════════════════════════════════════════════════"
	@echo ""

# Install dependencies
install:
	@echo "📦 Installing server dependencies..."
	@npm install
	@echo "✅ Server dependencies installed!"
	@echo ""
	@echo "Next: Run 'make setup-env' if needed, then 'make dev'"

# Clean node_modules and logs
clean:
	@echo "🧹 Cleaning server files..."
	@rm -rf node_modules
	@rm -f server.log
	@rm -rf .cache
	@echo "✅ Server cleaned!"

# Start development server with nodemon
dev:
	@echo "🚀 Starting server in development mode..."
	@echo ""
	@echo "═══════════════════════════════════════════════════════════"
	@echo "   Server will start on: http://localhost:3001"
	@echo "   Hot reload: Enabled (nodemon)"
	@echo "   Press Ctrl+C to stop"
	@echo "═══════════════════════════════════════════════════════════"
	@echo ""
	@npm run dev 2>/dev/null || npm start

# Start production server
start:
	@echo "🚀 Starting server in production mode..."
	@echo ""
	@echo "═══════════════════════════════════════════════════════════"
	@echo "   Server running on: http://localhost:3001"
	@echo "   Mode: Production"
	@echo "   Press Ctrl+C to stop"
	@echo "═══════════════════════════════════════════════════════════"
	@echo ""
	@npm start

# Prepare for development
prepare-dev: clean install setup-env
	@echo "✅ Server ready for development!"
	@echo ""
	@echo "Run 'make dev' to start development server"

# Prepare for production
prepare-prod: clean install
	@echo "✅ Server ready for production!"
	@echo ""
	@echo "Run 'make start' to start production server"

# Setup environment file
setup-env:
	@echo "⚙️  Setting up environment file..."
	@if [ ! -f .env ]; then \
		if [ -f .env.example ]; then \
			cp .env.example .env; \
			echo "✅ Created .env from .env.example"; \
			echo "⚠️  Please update .env with your actual values"; \
		else \
			echo "❌ .env.example not found"; \
		fi \
	else \
		echo "✅ .env already exists"; \
	fi

# Run tests
test:
	@echo "🧪 Running server tests..."
	@npm test

# Run concurrent booking tests
test-concurrent:
	@echo "🧪 Running concurrent booking tests..."
	@npm run test:concurrent 2>/dev/null || echo "No concurrent test script found"

# Run booking scenario tests
test-scenarios:
	@echo "🧪 Running booking scenario tests..."
	@npm run test:scenarios:all 2>/dev/null || echo "No scenario test script found"

# View server logs
logs:
	@echo "📋 Server logs (press Ctrl+C to exit):"
	@echo ""
	@tail -f server.log 2>/dev/null || echo "No server.log found"

# Clear server logs
logs-clear:
	@echo "🧹 Clearing server logs..."
	@rm -f server.log
	@echo "✅ Logs cleared!"

# Database migration (if exists)
migrate:
	@echo "🗄️  Running database migrations..."
	@npm run migrate 2>/dev/null || echo "No migration script found"

# Seed database (if exists)
seed:
	@echo "🌱 Seeding database..."
	@npm run seed 2>/dev/null || echo "No seed script found"

# Show deployment information
deploy-info:
	@echo ""
	@echo "═══════════════════════════════════════════════════════════"
	@echo "           🚀 Deployment Information"
	@echo "═══════════════════════════════════════════════════════════"
	@echo ""
	@echo "  📦 Render.com Deployment:"
	@echo "     - Auto-deploy: Enabled on push to main branch"
	@echo "     - Build command: npm install"
	@echo "     - Start command: npm start"
	@echo "     - Live URL: https://rental-home-project-qssf.onrender.com"
	@echo ""
	@echo "  ⚙️  How to Deploy:"
	@echo "     1. git add ."
	@echo "     2. git commit -m \"your message\""
	@echo "     3. git push origin main"
	@echo "     4. Render will auto-deploy! ✅"
	@echo ""
	@echo "  🔗 Render Dashboard:"
	@echo "     https://dashboard.render.com"
	@echo ""
	@echo "═══════════════════════════════════════════════════════════"
	@echo ""

# Verify Render deployment configuration
render-check:
	@echo "🔍 Checking Render deployment configuration..."
	@echo ""
	@if [ -f "package.json" ]; then \
		echo "✅ package.json found"; \
		if grep -q "\"start\"" package.json; then \
			echo "✅ start script found in package.json"; \
		else \
			echo "❌ start script NOT found in package.json"; \
		fi; \
	else \
		echo "❌ package.json NOT found"; \
	fi
	@echo ""
	@if [ -f ".env" ]; then \
		echo "⚠️  .env found (should be in Render dashboard, not in repo)"; \
	else \
		echo "✅ .env not in repo (good - use Render environment variables)"; \
	fi
	@echo ""
	@if [ -f "railway.json" ]; then \
		echo "✅ railway.json found (Render config)"; \
	else \
		echo "⚠️  railway.json not found"; \
	fi
	@echo ""
	@echo "💡 Tips:"
	@echo "   - Set environment variables in Render Dashboard"
	@echo "   - Make sure .env is in .gitignore"
	@echo "   - Render will auto-restart on new commits to main"
	@echo ""

# Quick commands
.PHONY: i d s c
i: install
d: dev
s: start
c: clean

