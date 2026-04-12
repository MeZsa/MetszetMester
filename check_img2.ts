import fs from 'fs';
const stats = fs.statSync('src/assets/simple_squamous_epithelium.png');
console.log('Size:', stats.size);
