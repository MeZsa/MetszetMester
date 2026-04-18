import fs from 'fs';

const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update view state
content = content.replace(/useState<'main' \| 'courses' \| 'clinical' \| 'report_interpreter'>/g, "useState<'main' | 'clinical' | 'report_interpreter'>");

// Remove selected states
content = content.replace(/  const \[selectedCourse, setSelectedCourse\] = useState<Course \| null>\(null\);\n/g, '');
content = content.replace(/  const \[selectedModule, setSelectedModule\] = useState<Module \| null>\(null\);\n/g, '');
content = content.replace(/  const \[selectedLesson, setSelectedLesson\] = useState<Lesson \| null>\(null\);\n/g, '');

// There is a `useEffect` for `selectedLesson`. Let's remove it.
const effectRegex = /  React\.useEffect\(\(\) => \{\n    if \(selectedLesson\) \{\n      setLessonZoom\(1\);\n      setLessonPan\(\{ x: 0, y: 0 \}\);\n    \}\n  \}, \[selectedLesson\]\);\n/m;
content = content.replace(effectRegex, '');

// Also lessonZoom and lessonPan can probably be removed if they are only used for the course microscope
const lessonZoomRegex = /  const \[lessonZoom, setLessonZoom\] = useState\(1\);\n  const \[lessonPan, setLessonPan\] = useState\(\{ x: 0, y: 0 \}\);\n/m;
content = content.replace(lessonZoomRegex, '');

const lessonWheelRegex = /  const handleLessonWheel = React\.useCallback\(\(e: React\.WheelEvent\) => \{[\s\S]*?^\s*\}\);\n/m;
content = content.replace(lessonWheelRegex, '');

const lessonPanRegex = /  const handleLessonPan = React\.useCallback\(\(direction: 'up' | 'down' | 'left' | 'right'\) => \{[\s\S]*?^\s*\}\);\n/m;
content = content.replace(lessonPanRegex, '');

fs.writeFileSync(file, content, 'utf8');
console.log('Cleanup finished.');
