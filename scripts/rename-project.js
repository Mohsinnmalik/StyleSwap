const fs = require('fs');
const path = require('path');

const IGNORE_DIRS = ['node_modules', '.next', '.git', '.tempmediaStorage'];
const TARGET_EXTENSIONS = ['.ts', '.tsx', '.css', '.json', '.md', '.html'];

function walkAndReplace(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (IGNORE_DIRS.includes(file)) continue;
      walkAndReplace(fullPath);
    } else if (stat.isFile()) {
      const ext = path.extname(file);
      if (TARGET_EXTENSIONS.includes(ext) || file === 'Dockerfile') {
        // Skip package-lock.json if needed, but it's fine to rename package name there too
        replaceInFile(fullPath);
      }
    }
  }
}

function replaceInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if there are any occurrences first
    if (!content.includes('FitView') && !content.includes('fitview')) {
      return;
    }

    let updated = content;
    // Replace "FitView" with "StyleSwap"
    updated = updated.replace(/FitView/g, 'StyleSwap');
    // Replace "fitview" with "styleswap"
    updated = updated.replace(/fitview/g, 'styleswap');

    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
  } catch (err) {
    console.error(`❌ Error updating ${filePath}:`, err);
  }
}

console.log('Starting project rename (FitView -> StyleSwap)...');
walkAndReplace(path.join(__dirname, '..'));
console.log('Project rename complete!');
