import fs from 'fs';

const content = fs.readFileSync('c:\\FIXNOW\\frontend\\src\\app\\customer\\dashboard\\page.tsx', 'utf8');

const doubleQuotes = (content.match(/"/g) || []).length;
const singleQuotes = (content.match(/'/g) || []).length;
const backticks = (content.match(/`/g) || []).length;

console.log(`DoubleQuotes: ${doubleQuotes} (${doubleQuotes % 2 === 0 ? 'Balanced' : 'Imbalanced'})`);
console.log(`SingleQuotes: ${singleQuotes} (${singleQuotes % 2 === 0 ? 'Balanced' : 'Imbalanced'})`);
console.log(`Backticks: ${backticks} (${backticks % 2 === 0 ? 'Balanced' : 'Imbalanced'})`);

// Check for unclosed JSX tags
const tags = [];
const tagRegex = /<([a-zA-Z0-9\.]+)|<\/([a-zA-Z0-9\.]+)>|<([a-zA-Z0-9\.]+)\s.*\/>/g;
// This is very simplified, but maybe it finds something.
