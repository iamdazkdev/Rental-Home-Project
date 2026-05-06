const fs = require('fs');
const path = require('path');

const clientSrcPath = path.join(__dirname, 'src');
const componentsPath = path.join(clientSrcPath, 'components');

const barrelFiles = fs.readdirSync(componentsPath).filter(f => f.endsWith('.jsx') || f.endsWith('.js'));

const mappings = {};

barrelFiles.forEach(file => {
  const content = fs.readFileSync(path.join(componentsPath, file), 'utf8');
  // Match export { default } from "./folder/Component";
  const match = content.match(/from\s+['"]\.\/([^/]+)\/([^'"]+)['"]/);
  if (match) {
    const folder = match[1];
    mappings[file.replace(/\.jsx?$/, '')] = folder;
  }
});

console.log("Mappings found:", mappings);

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.js') || file.endsWith('.jsx')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });
  return arrayOfFiles;
}

const allFiles = getAllFiles(clientSrcPath);

for (const file of allFiles) {
  // Skip the barrel files themselves
  if (path.dirname(file) === componentsPath && mappings[path.basename(file, path.extname(file))]) {
    continue;
  }
  
  let content = fs.readFileSync(file, 'utf8');
  let hasChanges = false;
  
  for (const [compName, folder] of Object.entries(mappings)) {
    // Regex 1: Matches path/to/components/CompName
    const regex1 = new RegExp(`(from\\s+['"])(.*?\\/components)\\/(${compName})(['"])`, 'g');
    if (regex1.test(content)) {
      content = content.replace(regex1, `$1$2/${folder}/$3$4`);
      hasChanges = true;
    }
    
    // Regex 2: Matches ../CompName
    const regex2 = new RegExp(`(from\\s+['"])\\.\\.\\/(${compName})(['"])`, 'g');
    if (regex2.test(content)) {
      content = content.replace(regex2, `$1../${folder}/$2$3`);
      hasChanges = true;
    }
  }
  
  if (hasChanges) {
    fs.writeFileSync(file, content);
  }
}

// Delete barrel files
barrelFiles.forEach(file => {
  if (mappings[file.replace(/\.jsx?$/, '')]) {
    fs.unlinkSync(path.join(componentsPath, file));
  }
});

console.log('Cleanup completed successfully!');
