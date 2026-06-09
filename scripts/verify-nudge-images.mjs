import fs from 'fs';
import path from 'path';

const NUDGE_FOODS_DIR = path.resolve('public/nudge-foods');

const SUSPICIOUS_MARKERS = [
  '<html',
  '<!doctype',
  '404',
  'not found',
  'access denied',
  'forbidden',
  'error',
  'xml'
];

function checkHeaders(buffer) {
  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { valid: true, type: 'JPEG' };
  }
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return { valid: true, type: 'PNG' };
  }
  // WebP: RIFF at 0-3, WEBP at 8-11
  const isRiff = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46; // "RIFF"
  const isWebp = buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50; // "WEBP"
  if (isRiff && isWebp) {
    return { valid: true, type: 'WebP' };
  }

  return { valid: false, type: 'Unknown' };
}

function verifyImage(filepath) {
  const stats = fs.statSync(filepath);
  
  // Rule 1: Size check
  if (stats.size < 5120) { // 5KB
    return { valid: false, reason: `File size too small (${(stats.size / 1024).toFixed(2)} KB, must be >= 5KB)` };
  }

  const fd = fs.openSync(filepath, 'r');
  const buffer = Buffer.alloc(Math.min(stats.size, 2048)); // Read first 2KB to capture headers and initial segment
  fs.readSync(fd, buffer, 0, buffer.length, 0);
  fs.closeSync(fd);

  // Rule 2: Signature check
  const headerCheck = checkHeaders(buffer);
  if (!headerCheck.valid) {
    return { valid: false, reason: `Invalid image signature (detected: ${headerCheck.type})` };
  }

  // Rule 3: Content scanning for HTML/text markers
  const contentStr = buffer.toString('utf8').toLowerCase();
  for (const marker of SUSPICIOUS_MARKERS) {
    const idx = contentStr.indexOf(marker);
    if (idx !== -1) {
      // If the marker is "xml" or "error", we ignore it if it appears after the first 100 bytes
      // and the file starts with a valid image header (which means it is XMP/EXIF metadata in a binary image).
      if ((marker === 'xml' || marker === 'error') && idx > 100 && headerCheck.valid) {
        continue;
      }
      return { valid: false, reason: `Found suspicious text marker: "${marker}" at index ${idx}` };
    }
  }

  return { valid: true, type: headerCheck.type, size: stats.size };
}

function scanDir(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath, files);
    } else {
      const ext = path.extname(file).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

function runVerification() {
  console.log(`=== Auditing Nudge Image Catalog at: ${NUDGE_FOODS_DIR} ===`);
  if (!fs.existsSync(NUDGE_FOODS_DIR)) {
    console.error(`Error: Nudge foods directory does not exist: ${NUDGE_FOODS_DIR}`);
    process.exit(1);
  }

  const imageFiles = scanDir(NUDGE_FOODS_DIR);
  let passedCount = 0;
  let failedCount = 0;
  const failures = [];

  for (const file of imageFiles) {
    const relPath = path.relative(process.cwd(), file);
    try {
      const result = verifyImage(file);
      if (result.valid) {
        console.log(`[PASS] ${relPath} (${result.type}, ${(result.size / 1024).toFixed(2)} KB)`);
        passedCount++;
      } else {
        console.error(`[FAIL] ${relPath}: ${result.reason}`);
        failures.push({ file: relPath, reason: result.reason });
        failedCount++;
      }
    } catch (err) {
      console.error(`[FAIL] ${relPath}: Error reading file: ${err.message}`);
      failures.push({ file: relPath, reason: `Error: ${err.message}` });
      failedCount++;
    }
  }

  console.log('\n=== Audit Summary ===');
  console.log(`Total checked:  ${imageFiles.length}`);
  console.log(`Valid:          ${passedCount}`);
  console.log(`Failed/Suspect: ${failedCount}`);

  if (failedCount > 0) {
    console.error('\nVerification failed! Please fix the invalid images listed above.');
    process.exit(1);
  } else {
    console.log('\nAll images passed validation successfully! 🎉');
    process.exit(0);
  }
}

runVerification();
