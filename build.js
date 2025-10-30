#!/usr/bin/env node

/**
 * Build script for Wolfpack - Lake Champlain Fishing Game
 * Creates a production-ready distribution in the dist/ folder
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BUILD_DIR = 'dist';
const PACKAGE_JSON = require('./package.json');
const ZIP_FILE = `wolfpack-itch-dist-v${PACKAGE_JSON.version}.zip`;

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(message) {
  log(`\n▶ ${message}`, colors.blue + colors.bright);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

// Recursively copy directory
function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    logWarning(`Source directory not found: ${src}`);
    return;
  }

  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy a single file
function copyFile(src, dest) {
  if (!fs.existsSync(src)) {
    logWarning(`Source file not found: ${src}`);
    return;
  }

  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  fs.copyFileSync(src, dest);
}

// Generate version.json and commits.txt from main branch
function generateVersionFiles() {
  logStep('Generating version files from main branch...');

  try {
    // Fetch latest from origin to ensure we have up-to-date main
    execSync('git fetch origin main', { encoding: 'utf-8', stdio: 'pipe' });

    // Get latest commit hash from origin/main branch (short format)
    const commitHash = execSync('git rev-parse --short origin/main', { encoding: 'utf-8' }).trim();

    // Get commit date
    const commitDate = execSync('git log origin/main -1 --format=%cd --date=short', { encoding: 'utf-8' }).trim();

    // Get commit message
    const commitMsg = execSync('git log origin/main -1 --format=%s', { encoding: 'utf-8' }).trim();

    // Create version.json
    const versionData = {
      version: PACKAGE_JSON.version,
      commit: commitHash,
      date: commitDate,
      description: commitMsg
    };

    fs.writeFileSync('version.json', JSON.stringify(versionData, null, 2) + '\n');
    logSuccess(`Generated version.json (v${PACKAGE_JSON.version} @ ${commitHash})`);

    // Generate commits.txt with last 50 commits from origin/main
    const commits = execSync('git log origin/main -50 --format="%h - %cd - %s" --date=short', { encoding: 'utf-8' }).trim();
    fs.writeFileSync('commits.txt', commits + '\n');
    logSuccess('Generated commits.txt from origin/main branch');

  } catch (error) {
    logWarning(`Failed to generate version files: ${error.message}`);
    logWarning('Build will continue with existing version files if available');
  }
}

// Clean dist directory
function cleanDist() {
  logStep('Cleaning dist directory...');

  if (fs.existsSync(BUILD_DIR)) {
    fs.rmSync(BUILD_DIR, { recursive: true, force: true });
    logSuccess('Cleaned existing dist directory');
  }

  fs.mkdirSync(BUILD_DIR, { recursive: true });
  logSuccess('Created fresh dist directory');
}

// Copy source files
function copySources() {
  logStep('Copying source files...');

  // Copy src directory
  copyDir('src', path.join(BUILD_DIR, 'src'));
  logSuccess('Copied src/ directory');

  // Copy assets directory
  if (fs.existsSync('assets')) {
    copyDir('assets', path.join(BUILD_DIR, 'assets'));
    logSuccess('Copied assets/ directory');
  }

  // Copy main HTML file
  copyFile('index.html', path.join(BUILD_DIR, 'index.html'));
  logSuccess('Copied index.html');

  // Copy version info if it exists
  if (fs.existsSync('version.json')) {
    copyFile('version.json', path.join(BUILD_DIR, 'version.json'));
    logSuccess('Copied version.json');
  }

  // Copy commit log if it exists
  if (fs.existsSync('commits.txt')) {
    copyFile('commits.txt', path.join(BUILD_DIR, 'commits.txt'));
    logSuccess('Copied commits.txt');
  }
}

// Create build info file
function createBuildInfo() {
  logStep('Creating build information...');

  const buildInfo = {
    buildDate: new Date().toISOString(),
    buildVersion: require('./package.json').version,
    gameName: 'Wolfpack - Lake Champlain Fishing Game',
    platform: 'web',
    phaserVersion: '3.80.1'
  };

  fs.writeFileSync(
    path.join(BUILD_DIR, 'build-info.json'),
    JSON.stringify(buildInfo, null, 2)
  );

  logSuccess('Created build-info.json');
}

// Create README for distribution
function createDistReadme() {
  logStep('Creating distribution README...');

  const readme = `# Wolfpack - Lake Champlain Fishing Game

## Distribution Package

This is a production-ready build of Wolfpack.

### Contents

- \`index.html\` - Main game file (open this in a browser)
- \`src/\` - Game source code
- \`assets/\` - Game assets (images, sounds, etc.)
- \`version.json\` - Version information
- \`commits.txt\` - Git commit history
- \`build-info.json\` - Build metadata

### How to Run Locally

1. Open \`index.html\` in a modern web browser
2. Or use a local web server:
   \`\`\`bash
   # Using Python 3
   python3 -m http.server 8080

   # Using Node.js http-server
   npx http-server . -p 8080
   \`\`\`
3. Navigate to http://localhost:8080

### How to Deploy

#### Itch.io
1. Compress this entire folder as a ZIP file
2. Upload to itch.io as an HTML5 game
3. Set \`index.html\` as the main file

#### Your Own Server
Upload all files to your web server maintaining the directory structure.

### Browser Requirements

- Modern browser with WebGL support
- JavaScript enabled
- Gamepad API support (optional, for controller input)

### Controls

- Keyboard: Arrow keys, Space, R
- Gamepad: PS4, Xbox, 8BitDo controllers supported

### Links

- Repository: https://github.com/dirtybirdnj/lake-trout-fishing-game

Built on ${new Date().toISOString().split('T')[0]}
`;

  fs.writeFileSync(path.join(BUILD_DIR, 'README.txt'), readme);
  logSuccess('Created README.txt');
}

// Create ZIP archive for itch.io
function createZipArchive() {
  logStep('Creating itch.io distribution ZIP...');

  // Remove existing zip if it exists
  if (fs.existsSync(ZIP_FILE)) {
    fs.unlinkSync(ZIP_FILE);
    logSuccess('Removed existing ZIP file');
  }

  try {
    // Create zip with contents of dist/ folder (not the folder itself)
    // Using -r for recursive, -q for quiet, and specifying the dist/* contents
    execSync(`cd ${BUILD_DIR} && zip -r ../${ZIP_FILE} . -q`, { stdio: 'inherit' });

    const zipStats = fs.statSync(ZIP_FILE);
    logSuccess(`Created ${ZIP_FILE} (${formatBytes(zipStats.size)})`);

    return zipStats.size;
  } catch (error) {
    logError(`Failed to create ZIP: ${error.message}`);
    logWarning('You can manually create the ZIP with: cd dist && zip -r ../wolfpack-itch-dist.zip .');
    return 0;
  }
}

// Get directory size
function getDirSize(dirPath) {
  let size = 0;

  if (!fs.existsSync(dirPath)) return 0;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (let entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      size += getDirSize(fullPath);
    } else {
      size += fs.statSync(fullPath).size;
    }
  }

  return size;
}

// Format bytes to human readable
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Count files in directory
function countFiles(dirPath) {
  let count = 0;

  if (!fs.existsSync(dirPath)) return 0;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (let entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      count += countFiles(fullPath);
    } else {
      count++;
    }
  }

  return count;
}

// Print build summary
function printSummary(zipSize = 0) {
  logStep('Build Summary');

  const distSize = getDirSize(BUILD_DIR);
  const fileCount = countFiles(BUILD_DIR);

  log('\n┌─────────────────────────────────────────┐', colors.bright);
  log('│  WOLFPACK BUILD COMPLETE                │', colors.green + colors.bright);
  log('├─────────────────────────────────────────┤', colors.bright);
  log(`│  Output: ${BUILD_DIR}/                        │`, colors.bright);
  log(`│  Files:  ${fileCount.toString().padEnd(28)} │`, colors.bright);
  log(`│  Size:   ${formatBytes(distSize).padEnd(28)} │`, colors.bright);
  if (zipSize > 0) {
    log(`│  ZIP:    ${ZIP_FILE.padEnd(28)} │`, colors.bright);
    log(`│          ${formatBytes(zipSize).padEnd(28)} │`, colors.bright);
  }
  log('└─────────────────────────────────────────┘\n', colors.bright);

  log('Next steps:', colors.yellow + colors.bright);
  log('  • Test locally:  npm run preview');
  if (zipSize > 0) {
    log(`  • Upload:        ${ZIP_FILE} to itch.io`);
  } else {
    log('  • Compress:      zip -r wolfpack-itch-dist.zip dist/');
    log('  • Upload to:     itch.io or your web server');
  }

  log('\nFor itch.io publishing instructions:', colors.blue);
  log('  Read PUBLISH_ITCH.md\n');
}

// Main build function
async function build() {
  log('\n╔════════════════════════════════════════════╗', colors.bright);
  log('║  WOLFPACK - Production Build               ║', colors.blue + colors.bright);
  log('╚════════════════════════════════════════════╝\n', colors.bright);

  try {
    generateVersionFiles();
    cleanDist();
    copySources();
    createBuildInfo();
    createDistReadme();
    const zipSize = createZipArchive();
    printSummary(zipSize);

    process.exit(0);
  } catch (error) {
    logError(`\nBuild failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run build
build();
