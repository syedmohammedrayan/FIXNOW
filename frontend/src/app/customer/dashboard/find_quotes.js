import fs from 'fs';

const content = fs.readFileSync('c:\\FIXNOW\\frontend\\src\\app\\customer\\dashboard\\page.tsx', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const singleQuotes = (line.match(/'/g) || []).length;
  // This is naive because a quote could start on one line and end on another,
  // but most single quotes in this file are for strings or tech names.
  if (singleQuotes % 2 !== 0) {
    // Check if it's actually part of a multi-line string or a comment
    console.log(`Line ${i + 1}: ${line.trim()}`);
  }
}
