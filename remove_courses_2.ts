import fs from 'fs';

const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

const coursesViewRegex = /\) : view === 'courses' \? \([\s\S]*?\)(?=\s*:\s*!image \? \()/;
content = content.replace(coursesViewRegex, ')');

const footerBtnRegex = /<button[\s\n]*onClick=\{.*?setView\('courses'\)\}[\s\S]*?<\/button>\s*/;
content = content.replace(footerBtnRegex, '');

const headerBtnRegex = /<button onClick=\{.*?setView\('courses'\)\} className="hover:text-secondary transition-colors">Kurzusok<\/button>\s*/;
content = content.replace(headerBtnRegex, '');

fs.writeFileSync(file, content, 'utf8');
console.log('Removed courses view and nav buttons.');
