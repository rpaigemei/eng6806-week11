// Checks every room's tag placement in a real (headless) browser, because tag
// widths depend on font measuring. Prints problems; exits 1 if there are any.
//   node tools/taglayout.cjs        (needs Playwright + Chromium installed)
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = path.join(__dirname, '..');
const types = { '.js': 'text/javascript', '.html': 'text/html', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
  if (!file.startsWith(root) || !fs.existsSync(file)) return res.writeHead(404).end();
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

server.listen(0, async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`http://localhost:${server.address().port}/index.html`);
  await page.waitForTimeout(800);
  const report = await page.evaluate(async () => {
    const { THEMES } = await import('/src/themes/index.js');
    const { tagLayoutProblems } = await import('/src/render/tags.js');
    return THEMES.flatMap((th) => th.levels.map((l) => ({ id: l.id, problems: tagLayoutProblems(l, th) })));
  });
  await browser.close();
  server.close();
  let bad = 0;
  for (const r of report) {
    console.log(`${r.problems.length ? 'FAIL' : 'ok  '} ${r.id}`);
    for (const p of r.problems) console.log(`       - ${p}`);
    bad += r.problems.length;
  }
  console.log(bad ? `\n${bad} tag layout problem(s)` : '\nAll tags sit clearly by their own spots.');
  process.exit(bad ? 1 : 0);
});
