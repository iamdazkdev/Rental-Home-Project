#!/bin/zsh

echo "Killing any existing server on port 5000..."
lsof -ti:5000 | xargs kill -9 2>/dev/null
sleep 1

cd "/Volumes/Data/SourceCode/Visual Studio Code/Rental Home Project/server"

echo "Starting server..."
exec node index.js

