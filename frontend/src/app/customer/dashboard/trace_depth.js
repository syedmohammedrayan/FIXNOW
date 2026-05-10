import fs from 'fs';

const content = fs.readFileSync('c:\\FIXNOW\\frontend\\src\\app\\customer\\dashboard\\page.tsx', 'utf8');
const lines = content.split('\n');

let depth = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const opens = (line.match(/<div(?!\w)(?![^>]*\/>)/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  depth += opens - closes;
  if (line.includes('return (')) {
    console.log(`Line ${i + 1}: Return started, current overall depth = ${depth}`);
  }
}
console.log(`Final Depth: ${depth}`);
