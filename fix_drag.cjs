
const fs = require("fs");
let code = fs.readFileSync("src/App.tsx", "utf8");

const startIdx = code.indexOf("const handleDragOver = useCallback((event: any) => {");
const endIdx = code.indexOf("const handleDragEnd = useCallback((event: any) => {");
let dragOver = code.substring(startIdx, endIdx);

// For departmentsData block with map
dragOver = dragOver.replace(/setDepartmentsData\(\(prev\) => \{\n([\s\S]*?)return prev\.map\(\(d\) => \{\n([\s\S]*?)return d;\n\s*\}\);\n\s*\}\);/g, 
  (match, p1, p2) => {
    return "setDepartmentsData((prev) => {\n" + p1 + "return prev.map((d) => {\n" + p2 + "return { ...d, data: d.data.filter(e => e.id !== activeId), count: Math.max(0, d.data.filter(e => e.id !== activeId).length) };\n        });\n      });";
});

// For departmentsData without block
dragOver = dragOver.replace(/setDepartmentsData\(\(prev\) =>\n\s*prev\.map\(\(d\) => \{\n([\s\S]*?)return d;\n\s*\}\),\n\s*\);/g,
  (match, p1) => {
    return "setDepartmentsData((prev) =>\n          prev.map((d) => {\n" + p1 + "return { ...d, data: d.data.filter(e => e.id !== activeId), count: Math.max(0, d.data.filter(e => e.id !== activeId).length) };\n          }),\n        );";
});

// For supportRolesData block with map
dragOver = dragOver.replace(/setSupportRolesData\(\(prev\) => \{\n([\s\S]*?)return prev\.map\(\(group, idx\) => \{\n([\s\S]*?)return group;\n\s*\}\);\n\s*\}\);/g,
  (match, p1, p2) => {
    return "setSupportRolesData((prev) => {\n" + p1 + "return prev.map((group, idx) => {\n" + p2 + "return group.filter(e => e.id !== activeId);\n          });\n        });";
});

// For supportRolesData without block
dragOver = dragOver.replace(/setSupportRolesData\(\(prev\) =>\n\s*prev\.map\(\(group, idx\) => \{\n([\s\S]*?)return group;\n\s*\}\),\n\s*\);/g,
  (match, p1) => {
    return "setSupportRolesData((prev) =>\n          prev.map((group, idx) => {\n" + p1 + "return group.filter(e => e.id !== activeId);\n          }),\n        );";
});

fs.writeFileSync("src/App.tsx", code.substring(0, startIdx) + dragOver + code.substring(endIdx));
console.log("App.tsx rewritten successfully!");

