# Rental Home Project - Root Makefile
# Usage: make help - to see all available commands
#
# This Makefile delegates to client/Makefile and server/Makefile
# For detailed commands, use:
#   cd client && make help
#   cd server && make help

.PHONY: help install start clean client server mobile

# Default target
help:
	@echo ""
	@echo "═══════════════════════════════════════════════════════════"
	@echo "         Rental Home Project - Root Makefile"
	@echo "═══════════════════════════════════════════════════════════"
	@echo ""
	@echo "  Quick Start:"
	@echo "    make install      - Install all dependencies"
	@echo "    make start        - Start both client & server"
	@echo "    make clean        - Clean all build files"
	@echo ""
	@echo "  Individual Services:"
	@echo "    make client       - Go to client folder (then run: make help)"
	@echo "    make server       - Go to server folder (then run: make help)"
	@echo "    make mobile       - Go to mobile folder"
	@echo ""
	@echo "  Detailed Commands:"
	@echo "    cd client && make help   - See all client commands"
	@echo "    cd server && make help   - See all server commands"
	@echo ""
	@echo "═══════════════════════════════════════════════════════════"
	@echo ""
	@echo "  Examples:"
	@echo "    cd client && make dev          - Start client dev server"
	@echo "    cd client && make deploy       - Build & deploy client"
	@echo "    cd server && make dev          - Start server with nodemon"
	@echo "    cd server && make test         - Run server tests"
	@echo ""
	@echo "═══════════════════════════════════════════════════════════"

# Install all dependencies
install:
	@echo "📦 Installing all dependencies..."
	@echo ""
	@echo "Installing server dependencies..."
	@cd server && $(MAKE) install
	@echo ""
	@echo "Installing client dependencies..."
	@cd client && $(MAKE) install
	@echo ""
	@echo "✅ All dependencies installed!"

# Start both services
start:
	@echo "🚀 Starting Rental Home Project..."
	@echo ""
	@echo "Starting server..."
	@cd server && npm start &
	@sleep 3
	@echo ""
	@echo "Starting client..."
	@cd client && npm start &
	@echo ""
	@echo "═══════════════════════════════════════════════════════════"
	@echo "✅ Project running!"
	@echo ""
	@echo "   🌐 Client: http://localhost:3000"
	@echo "   📡 Server: http://localhost:3001"
	@echo ""
	@echo "   Press Ctrl+C to stop"
	@echo "═══════════════════════════════════════════════════════════"

# Clean all
clean:
	@echo "🧹 Cleaning entire project..."
	@echo ""
	@cd server && $(MAKE) clean
	@cd client && $(MAKE) clean
	@echo ""
	@echo "✅ Project cleaned!"

# Stop all services
stop:
	@echo "🛑 Stopping all services..."
	@pkill -f "node.*server" || true
	@pkill -f "react-scripts start" || true
	@echo "✅ All services stopped!"

# Shortcuts to navigate to folders
client:
	@echo "💡 Use: cd client && make help"
	@echo ""
	@cd client && $(MAKE) help

server:
	@echo "💡 Use: cd server && make help"
	@echo ""
	@cd server && $(MAKE) help

mobile:
	@echo "📱 Mobile folder: ./mobile"
	@echo ""
	@echo "Available commands:"
	@echo "  flutter pub get   - Install dependencies"
	@echo "  flutter run       - Run app on device"
	@echo "  flutter build apk - Build Android APK"


