import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /  const lessonContainerRef = useRef<HTMLDivElement>\(null\);\n\n  React\.useEffect\(\(\) => \{\n    setLessonZoom\(1\);\n    setLessonPan\(\{ x: 0, y: 0 \}\);\n  \}, \[selectedLesson\]\);\n\n  const handleLessonPan = \([\s\S]*?\}\n  \};\n\n  const handleLessonZoomIn = \(\) => setLessonZoom\(prev => Math\.min\(prev \+ 0\.5, 5\)\);\n  const handleLessonZoomOut = \(\) => setLessonZoom\(prev => \{\n[\s\S]*?  \}\);\n\n  const handleLessonWheel = \([\s\S]*?\}\n  \};\n/m;

content = content.replace(regex, '');
fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('done');
