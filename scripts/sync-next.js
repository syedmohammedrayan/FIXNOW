const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'frontend', '.next');
const destDir = path.join(__dirname, '..', '.next');

if (fs.existsSync(srcDir) && !fs.existsSync(destDir)) {
  try {
    fs.symlinkSync(srcDir, destDir, 'junction');
    console.log('Successfully linked frontend/.next to .next');
  } catch (err) {
    try {
      fs.cpSync(srcDir, destDir, { recursive: true });
      console.log('Successfully copied frontend/.next to .next');
    } catch (copyErr) {
      console.warn('Could not link or copy .next directory:', copyErr);
    }
  }
}
