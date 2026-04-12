import fs from 'fs';
const stats = fs.statSync('public/simple_squamous_epithelium.png');
console.log('Size:', stats.size);
