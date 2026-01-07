import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SQL_DIR = path.resolve(process.cwd(), "docs/sql");
const OUTPUT_FILE = path.resolve(process.cwd(), "src/shared/api/functions.json");

async function syncSqlFunctions() {
  console.log("🔍 Scanning SQL files for functions...");
  
  const files = (await readdir(SQL_DIR)).filter(f => f.endsWith(".sql")).sort();
  const functions: { name: string; signature: string; file: string }[] = [];
  
  for (const file of files) {
    const content = await readFile(path.join(SQL_DIR, file), "utf-8");
    
    // Simple regex to find function definitions
    const functionRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+public\.(\w+)\s*\(([^)]*)\)/gi;
    let match;
    
    while ((match = functionRegex.exec(content)) !== null) {
      functions.push({
        name: match[1],
        signature: match[2].replace(/\s+/g, " ").trim(),
        file: file
      });
    }
  }
  
  await writeFile(OUTPUT_FILE, JSON.stringify(functions, null, 2));
  
  console.log(`✅ Extracted ${functions.length} functions to ${OUTPUT_FILE}`);
  functions.forEach(f => console.log(`  - ${f.name} (${f.file})`));
}

syncSqlFunctions().catch(console.error);
