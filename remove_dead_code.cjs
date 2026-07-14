const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex((l, i) => i > 1000 && l.trim() === '/*' && lines[i+1].includes('const mouseSensor = useSensor('));
const end = lines.findIndex((l, i) => i > start && l.trim() === '*/');
if (start !== -1 && end !== -1) {
  lines.splice(start, end - start + 1);
  fs.writeFileSync('src/App.tsx', lines.join('\n'));
  console.log(`Removed lines ${start + 1} to ${end + 1}`);
} else {
  console.log('Block not found. Start: ' + start + ' End: ' + end);
}
