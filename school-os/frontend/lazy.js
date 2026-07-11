import fs from 'fs';
import path from 'path';

const appJsxPath = path.join(process.cwd(), 'src', 'App.jsx');
let content = fs.readFileSync(appJsxPath, 'utf8');

// 1. Add Suspense, lazy to react import
if (!content.includes('import { Suspense, lazy }')) {
  content = `import { Suspense, lazy } from "react";\n` + content;
}

// 2. Replace static imports for dashboard pages with lazy imports
const regex = /import\s+([A-Za-z0-9_]+)\s+from\s+"(\.\/pages\/[^"]+)";/g;
content = content.replace(regex, (match, name, p) => {
  if (p.includes('/public/') || p.includes('/auth/')) {
    // Keep public pages static for fast initial load
    return match;
  }
  return `const ${name} = lazy(() => import("${p}"));`;
});

// 3. Wrap <Routes> in Suspense
if (!content.includes('<Suspense fallback=')) {
  const loader = `<div className="flex h-screen items-center justify-center bg-paper"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div></div>`;
  content = content.replace(/<Routes>/g, `<Suspense fallback={${loader}}>\n      <Routes>`);
  content = content.replace(/<\/Routes>/g, `</Routes>\n    </Suspense>`);
}

fs.writeFileSync(appJsxPath, content);
console.log('App.jsx successfully converted to React.lazy!');
