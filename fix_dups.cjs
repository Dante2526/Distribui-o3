
const fs = require("fs");

function deduplicateFile(file) {
  let code = fs.readFileSync(file, "utf8");
  code = code.replace(/const sortableItems = React\.useMemo\(\s*\(\) => (data|roles)\.map\(\(e\) => e\.id \|\| e\.name\),\s*\[(data|roles)\](?:,\s*)?\s*\);/g, (match, arrayName) => {
    return `const uniqueData = React.useMemo(() => {
    const seen = new Set();
    return ${arrayName}.filter(e => {
      if (seen.has(e.id || e.name)) return false;
      seen.add(e.id || e.name);
      return true;
    });
  }, [${arrayName}]);

  const sortableItems = React.useMemo(
    () => uniqueData.map((e) => e.id || e.name),
    [uniqueData],
  );`;
  });
  
  // also replace the map that renders children!
  code = code.replace(/\{data\.map\(\(emp, i\) =>/g, "{uniqueData.map((emp, i) =>");
  code = code.replace(/\{roles\.map\(\(emp, i\) =>/g, "{uniqueData.map((emp, i) =>");

  fs.writeFileSync(file, code);
  console.log("Fixed", file);
}

deduplicateFile("src/components/SupportCard.tsx");
deduplicateFile("src/components/DepartmentCard.tsx");

