import fs from 'fs';

const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove imports
const importRegex = /import simpleSquamousImg from '\.\/assets\/simple_squamous_epithelium\.png';\nimport tobbreteguHamokImg from '\.\/assets\/tobbretegu_hamok\.png';\nimport mirigyhamokImg from '\.\/assets\/mirigyhamok\.png';\nimport kotoszovetImg from '\.\/assets\/kotoszovet\.png';\nimport zsirszovetImg from '\.\/assets\/zsirszovet\.png';\nimport porcszovetImg from '\.\/assets\/porcszovet\.png';\nimport csontszovetImg from '\.\/assets\/csontszovet\.png';\nimport izomszovetImg from '\.\/assets\/izomszovet\.png';\nimport idegszovetImg from '\.\/assets\/idegszovet\.png';\n/g;

content = content.replace(importRegex, '');

// Remove interfaces and COURSES
const coursesRegex = /interface Lesson \{\n  id: string;\n  title: string;\n  content: string;\n  images\?: string\[\];\n  microscopeImage\?: string;\n\}\n\ninterface Module \{\n  id: string;\n  title: string;\n  lessons: Lesson\[\];\n\}\n\ninterface Course \{\n  id: string;\n  title: string;\n  description: string;\n  modules: Module\[\];\n\}\n\nconst COURSES: Course\[\] = \[[\s\S]*?\];\n\nexport default function App\(\) \{/m;

content = content.replace(coursesRegex, 'export default function App() {');

// Also remove `console.log("Image source:", simpleSquamousImg);`
content = content.replace(/  console\.log\("Image source:", simpleSquamousImg\);\n/g, '');

fs.writeFileSync(file, content, 'utf8');
console.log('Done script 1');
