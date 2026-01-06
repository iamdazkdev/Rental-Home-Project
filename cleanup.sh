#!/bin/bash
echo "🧹 Cleaning up project..."

# Remove directories
rm -rf node_modules build dist .next out .cache .idea .vscode logs coverage .nyc_output test-results uploads public/uploads user-data tmp temp

# Remove files
rm -f .env .env.local .env.development .env.production .env.test package-lock.json yarn.lock pnpm-lock.yaml

# Remove by pattern
find . -type f \( -name "*.log" -o -name "*.swp" -o -name "*.swo" -o -name "*~" -o -name ".DS_Store" -o -name "*.tmp" \) -delete

echo "✅ Cleanup complete!"