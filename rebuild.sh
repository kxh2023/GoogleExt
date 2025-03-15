#!/bin/bash

# Stop on errors
set -e

echo "Cleaning build directory..."
rm -rf dist || true

echo "Building extension..."
npm run build

echo "Build completed! Extension files in dist/"

echo "To debug, look for these console messages:"
echo "1. 'Codemirror inject script loaded' - Confirms inject script was loaded"
echo "2. 'Starting CodeMirror detection' - Script is running"
echo "3. 'Found .cm-content element' - Found CM6 editor"
echo "4. 'CodeMirror view found!' - Successfully found CM6 instance"
echo "5. 'Cursor at line: X' - Cursor tracking is working"

echo ""
echo "If your ShadowDOM isn't visible, check:"
echo "1. Make sure the content script logs show 'Container added to body'"
echo "2. Check the browser console for errors"
echo "3. Try turning extensions off and back on"

echo ""
echo "To manually reload the extension in Chrome:"
echo "1. Go to chrome://extensions"
echo "2. Find your extension and click the refresh icon"
echo "3. Reload the Overleaf page" 