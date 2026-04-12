import fs from 'fs';
const buffer = fs.readFileSync('src/assets/simple_squamous_epithelium.png');
console.log(buffer.slice(0, 8).toString('hex'));
