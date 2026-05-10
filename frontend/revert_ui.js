const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'c:/FIXNOW/frontend/src/app/admin/dashboard/page.tsx',
  'c:/FIXNOW/frontend/src/app/customer/dashboard/page.tsx',
  'c:/FIXNOW/frontend/src/app/technician/dashboard/page.tsx',
  'c:/FIXNOW/frontend/src/app/auth/login/page.tsx',
  'c:/FIXNOW/frontend/src/app/auth/signup/page.tsx'
];

const replacements = [
  { from: /\btext-slate-900\b/g, to: 'text-white' },
  { from: /\btext-slate-600\b/g, to: 'text-slate-400' },
  { from: /\btext-indigo-700\b/g, to: 'text-indigo-300' },
  { from: /\btext-slate-700\b/g, to: 'text-slate-300' },
  { from: /\bbg-white\/60\b/g, to: 'bg-slate-800' },
  { from: /\bborder-indigo-500\/20\b/g, to: 'border-white/10' },
  { from: /\bborder-indigo-100\b/g, to: 'border-slate-800' },
  { from: /\bborder-indigo-200\b/g, to: 'border-slate-700' },
  { from: /\bbg-indigo-50\/50\b/g, to: 'bg-slate-800/50' },
  { from: /\bbg-indigo-50\/40\b/g, to: 'bg-slate-800/40' },
  { from: /\bbg-indigo-50\/80\b/g, to: 'bg-slate-800/80' },
  { from: /\btext-indigo-800\b/g, to: 'text-indigo-200' }
];

filesToUpdate.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    replacements.forEach(r => {
      content = content.replace(r.from, r.to);
    });
    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Updated ${file}`);
    }
  } else {
    console.log(`File not found: ${file}`);
  }
});
