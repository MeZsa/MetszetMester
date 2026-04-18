import fs from 'fs';

const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /  const lessonContainerRef = useRef<HTMLDivElement>\(null\);\n\n  React\.useEffect\(\(\) => \{\n    setLessonZoom\(1\);\n    setLessonPan\(\{ x: 0, y: 0 \}\);\n  \}, \[selectedLesson\]\);\n\n  const handleLessonPan = \([\s\S]*?\}\n  \};\n\n  const handleLessonZoomIn = \([\s\S]*?  \};\n\n  const handleLessonWheel = \([\s\S]*?  \};\n/m;
content = content.replace(regex, '');

fs.writeFileSync(file, content, 'utf8');
console.log('Removed residual lesson logic!');
