// Dependency/import sanity check (dev utility).
const fs = require('fs');
const path = require('path');

const root = process.argv[2] || 'src';
const files = [];
(function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (/\.(jsx?|mjs)$/.test(f)) files.push(full);
  }
})(root);

const bad = [];
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const re = /from\s*['"](\.[^'"]+)['"]/g;
  let m;
  while ((m = re.exec(src))) {
    const base = path.resolve(path.dirname(f), m[1]);
    const ok =
      fs.existsSync(base) ||
      fs.existsSync(base + '.js') ||
      fs.existsSync(base + '.jsx') ||
      fs.existsSync(path.join(base, 'index.js')) ||
      fs.existsSync(path.join(base, 'index.jsx'));
    if (!ok) bad.push(`${f} -> ${m[1]}`);
  }
}

console.log(bad.length ? bad.join('\n') : 'all relative imports resolve');
console.log(`scanned ${files.length} files`);
