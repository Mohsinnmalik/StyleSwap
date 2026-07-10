const fs = require('fs');
const path = require('path');

const IGNORE_DIRS = ['node_modules', '.next', '.git', '.tempmediaStorage'];
const TARGET_EXTENSIONS = ['.ts', '.tsx', '.css', '.json', '.md', '.html', '.env', '.local', '.example'];

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
      if (TARGET_EXTENSIONS.includes(ext) || file === 'Dockerfile' || file === 'vercel.env' || file === '.env.local' || file === '.env.example') {
        replaceInFile(fullPath);
      }
    }
  }
}

function replaceInFile(filePath) {
  try {
    // Skip this script itself
    if (filePath === __filename) return;

    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if there are any occurrences first
    if (
      !content.includes('StyleSwap') && 
      !content.includes('styleswap') && 
      !content.includes('Style Swap') &&
      !content.includes('style-swap')
    ) {
      return;
    }

    let updated = content;
    
    // Replace combinations
    updated = updated.replace(/StyleSwap/g, 'Tryonity');
    updated = updated.replace(/Style Swap/g, 'Tryonity');
    updated = updated.replace(/styleswap/g, 'tryonity');
    updated = updated.replace(/style-swap/g, 'tryonity');

    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
  } catch (err) {
    console.error(`❌ Error updating ${filePath}:`, err);
  }
}

console.log('Starting project rename to Tryonity...');
walkAndReplace(path.join(__dirname, '..'));
console.log('Project rename complete!');
