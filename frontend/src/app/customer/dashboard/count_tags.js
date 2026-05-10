import fs from 'fs';

const content = fs.readFileSync('c:\\FIXNOW\\frontend\\src\\app\\customer\\dashboard\\page.tsx', 'utf8');

const openDivs = (content.match(/<div/g) || []).length;
const closeDivs = (content.match(/<\/div>/g) || []).length;

const openMotionDivs = (content.match(/<motion\.div/g) || []).length;
const closeMotionDivs = (content.match(/<\/motion\.div>/g) || []).length;

console.log(`Divs: Open=${openDivs}, Close=${closeDivs}, Diff=${openDivs - closeDivs}`);
console.log(`MotionDivs: Open=${openMotionDivs}, Close=${closeMotionDivs}, Diff=${openMotionDivs - closeMotionDivs}`);
