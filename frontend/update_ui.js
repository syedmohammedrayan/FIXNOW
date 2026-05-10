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
  { from: /\btext-white\b/g, to: 'text-slate-900' },
  { from: /\btext-slate-400\b/g, to: 'text-slate-600' },
  { from: /\btext-indigo-300\b/g, to: 'text-indigo-700' },
  { from: /\btext-slate-300\b/g, to: 'text-slate-700' },
  { from: /\bbg-slate-800\b/g, to: 'bg-white/60' },
  { from: /\bborder-white\/10\b/g, to: 'border-indigo-500/20' },
  { from: /\bborder-slate-800\b/g, to: 'border-indigo-100' },
  { from: /\bborder-slate-700\b/g, to: 'border-indigo-200' },
  { from: /\bbg-slate-800\/50\b/g, to: 'bg-indigo-50/50' },
  { from: /\bbg-slate-800\/40\b/g, to: 'bg-indigo-50/40' },
  { from: /\bbg-slate-800\/80\b/g, to: 'bg-indigo-50/80' },
  { from: /\btext-slate-200\b/g, to: 'text-slate-700' },
  { from: /\btext-indigo-200\b/g, to: 'text-indigo-800' }
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
