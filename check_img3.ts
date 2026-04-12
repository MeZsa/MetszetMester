import fs from 'fs';
const stats = fs.statSync('src/assets/csontszovet.png');
console.log('Size:', stats.size);
