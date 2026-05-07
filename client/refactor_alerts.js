const fs = require('fs');
const path = require('path');

function getRelativePath(fromFile, targetPath) {
    let rel = path.relative(path.dirname(fromFile), targetPath);
    if (!rel.startsWith('.')) rel = './' + rel;
    // ensure unix paths
    return rel.replace(/\\/g, '/');
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    const hasAlert = /\b(window\.)?alert\(/.test(content);
    const hasConfirm = /\b(window\.)?confirm\(/.test(content);
    
    if (!hasAlert && !hasConfirm) return;

    console.log(`Processing ${filePath}...`);
    
    // Replace window.alert(...) and alert(...) with toast.error(...) or toast.info(...) 
    // We'll just use toast.info for generic ones, or infer from emojis (❌ vs ✅)
    content = content.replace(/\b(?:window\.)?alert\((.*?)\)/g, (match, args) => {
        if (args.includes('✅') || args.toLowerCase().includes('success')) {
            return `toast.success(${args})`;
        } else if (args.includes('❌') || args.toLowerCase().includes('fail') || args.toLowerCase().includes('error')) {
            return `toast.error(${args})`;
        }
        return `toast.info(${args})`;
    });

    // Replace window.confirm and confirm with await confirmDialog
    // Note: this assumes it's inside an async function! If not, it might cause syntax errors.
    // However, most confirms are in async functions or event handlers which we can make async.
    // For now, let's just replace the call. If it causes issues, we'll fix them during build check.
    content = content.replace(/\b(?:window\.)?confirm\((.*?)\)/g, `await confirmDialog({ message: $1 })`);
    
    // Make sure containing functions for confirmDialog are async
    // This is tricky via regex, so we'll rely on developers to fix the build errors if any, 
    // or we just replace confirmDialog.
    
    // Check if imports exist
    const hasToastImport = /import.*\{.*toast.*\}.*useNotificationStore/.test(content);
    const hasConfirmImport = /import.*\{.*confirmDialog.*\}.*useNotificationStore/.test(content);
    
    let importsToAdd = [];
    if (/\btoast\.(error|success|info|warning)\(/.test(content) && !hasToastImport) importsToAdd.push('toast');
    if (/\bconfirmDialog\(/.test(content) && !hasConfirmImport) importsToAdd.push('confirmDialog');
    
    if (importsToAdd.length > 0) {
        const targetStore = path.resolve(__dirname, 'src/stores/useNotificationStore');
        const relativeImportPath = getRelativePath(filePath, targetStore);
        
        const importStatement = `\nimport { ${importsToAdd.join(', ')} } from "${relativeImportPath}";\n`;
        
        // Find last import
        const lastImportRegex = /import.*?;?(?=\n(?!import))/g;
        let lastMatch;
        let match;
        while ((match = lastImportRegex.exec(content)) !== null) {
            lastMatch = match;
        }
        
        if (lastMatch) {
            const index = lastMatch.index + lastMatch[0].length;
            content = content.slice(0, index) + importStatement + content.slice(index);
        } else {
            content = importStatement + content;
        }
    }
    
    // Fix async for confirmDialog if possible
    // Very rough: if `await confirmDialog` is used but function is not async
    // Let's just write the content first
    fs.writeFileSync(filePath, content, 'utf8');
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            processFile(fullPath);
        }
    }
}

walkDir(path.join(__dirname, 'src'));
console.log('Done replacing alerts and confirms!');
