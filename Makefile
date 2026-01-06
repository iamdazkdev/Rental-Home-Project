# Rental Home Project Makefile
# Usage: make project - to setup and start the entire project

.PHONY: all project install install-server install-client install-mobile start start-server start-client start-all stop clean help

# Default target
all: project

# Main command to setup and start the project
project: install start-all
	@echo "✅ Project is ready!"

# Install all dependencies
install: install-server install-client
	@echo "✅ All dependencies installed!"

# Install server dependencies
install-server:
	@echo "📦 Installing server dependencies..."
	@cd server && npm install
	@echo "✅ Server dependencies installed!"

# Install client dependencies
install-client:
	@echo "📦 Installing client dependencies..."
	@cd client && npm install
	@echo "✅ Client dependencies installed!"

# Install mobile dependencies (Flutter)
install-mobile:
	@echo "📦 Installing mobile dependencies..."
	@cd mobile && flutter pub get
	@echo "✅ Mobile dependencies installed!"

# Start server only
start-server:
	@echo "🚀 Starting server..."
	@cd server && npm start &
	@echo "✅ Server started on http://localhost:3001"

# Start client only
start-client:
	@echo "🚀 Starting client..."
	@cd client && npm start &
	@echo "✅ Client started on http://localhost:3000"

# Start both server and client
start-all:
	@echo "🚀 Starting Rental Home Project..."
	@echo ""
	@echo "📡 Starting Server (Port 3001)..."
	@cd server && npm start &
	@sleep 3
	@echo ""
	@echo "🌐 Starting Client (Port 3000)..."
	@cd client && npm start &
	@echo ""
	@echo "═══════════════════════════════════════════════════════════"
	@echo "✅ Rental Home Project is running!"
	@echo ""
	@echo "   🌐 Client: http://localhost:3000"
	@echo "   📡 Server: http://localhost:3001"
	@echo ""
	@echo "   Press Ctrl+C to stop all services"
	@echo "═══════════════════════════════════════════════════════════"

# Start mobile app
start-mobile:
	@echo "📱 Starting mobile app..."
	@cd mobile && flutter run

# Stop all running processes
stop:
	@echo "🛑 Stopping all services..."
	@pkill -f "node.*server" || true
	@pkill -f "react-scripts start" || true
	@echo "✅ All services stopped!"

# Clean all node_modules and build files
clean:
	@echo "🧹 Cleaning project..."
	@rm -rf server/node_modules
	@rm -rf client/node_modules
	@rm -rf client/build
	@rm -rf mobile/build
	@echo "✅ Project cleaned!"

# Rebuild the project
rebuild: clean install
	@echo "✅ Project rebuilt!"

# Run server tests
test-server:
	@echo "🧪 Running server tests..."
	@cd server && npm test

# Run concurrent booking tests
test-concurrent:
	@echo "🧪 Running concurrent booking tests..."
	@cd server && npm run test:concurrent

# Run booking scenario tests
test-scenarios:
	@echo "🧪 Running booking scenario tests..."
	@cd server && npm run test:scenarios:all

# Build client for production
build-client:
	@echo "🏗️ Building client for production..."
	@cd client && npm run build
	@echo "✅ Client build complete!"

# Build mobile for Android
build-android:
	@echo "🏗️ Building Android APK..."
	@cd mobile && flutter build apk
	@echo "✅ Android build complete!"

# Build mobile for iOS
build-ios:
	@echo "🏗️ Building iOS..."
	@cd mobile && flutter build ios
	@echo "✅ iOS build complete!"

# Setup environment files
setup-env:
	@echo "⚙️ Setting up environment files..."
	@if [ ! -f server/.env ]; then \
		echo "Creating server/.env from example..."; \
		cp server/.env.example server/.env 2>/dev/null || echo "No .env.example found"; \
	fi
	@echo "✅ Environment setup complete!"

# Database migration (if needed)
migrate:
	@echo "🗄️ Running database migrations..."
	@cd server && npm run migrate 2>/dev/null || echo "No migration script found"
	@echo "✅ Migrations complete!"

# Full setup from scratch
setup: setup-env install migrate
	@echo "✅ Full setup complete!"

# Development mode with hot reload
dev:
	@echo "🔧 Starting in development mode..."
	@make start-all

# Help command
help:
	@echo ""
	@echo "═══════════════════════════════════════════════════════════"
	@echo "         Rental Home Project - Makefile Commands"
	@echo "═══════════════════════════════════════════════════════════"
	@echo ""
	@echo "  Main Commands:"
	@echo "    make project      - Install deps & start entire project"
	@echo "    make install      - Install all dependencies"
	@echo "    make start-all    - Start server and client"
	@echo "    make stop         - Stop all running services"
	@echo ""
	@echo "  Individual Services:"
	@echo "    make start-server - Start only the server"
	@echo "    make start-client - Start only the client"
	@echo "    make start-mobile - Start Flutter mobile app"
	@echo ""
	@echo "  Installation:"
	@echo "    make install-server - Install server deps only"
	@echo "    make install-client - Install client deps only"
	@echo "    make install-mobile - Install mobile deps only"
	@echo ""
	@echo "  Testing:"
	@echo "    make test-server     - Run server tests"
	@echo "    make test-concurrent - Run concurrent booking tests"
	@echo "    make test-scenarios  - Run booking scenario tests"
	@echo ""
	@echo "  Building:"
	@echo "    make build-client  - Build client for production"
	@echo "    make build-android - Build Android APK"
	@echo "    make build-ios     - Build iOS app"
	@echo ""
	@echo "  Maintenance:"
	@echo "    make clean    - Remove node_modules & build files"
	@echo "    make rebuild  - Clean and reinstall everything"
	@echo "    make setup    - Full setup from scratch"
	@echo ""
	@echo "═══════════════════════════════════════════════════════════"

