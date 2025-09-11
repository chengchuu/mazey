const fs = require('fs');

const newName = process.argv[2];
if (!newName) {
  console.error('Error: New name argument is required.');
  process.exit(1);
}

const pkgPath = 'package.json';
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.name = newName;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
console.log(`package.json name changed to "${newName}"`);
