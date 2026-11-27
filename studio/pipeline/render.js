// Rendert eine Story Bild fuer Bild: node pipeline/render.js <story> [--preview shotId:t,shotId:t] [--fps 30]
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path'); const { spawn } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2); const story = args[0];
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const FPS = +opt('--fps', 30);
const TYPES = { '.js': 'text/javascript', '.html': 'text/html', '.woff2': 'font/woff2', '.json': 'application/json' };

function serve() {
  return new Promise((res) => {
    const srv = http.createServer((req, rsp) => {
      let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/engine/index.html';
      const f = path.join(ROOT, p);
      if (!f.startsWith(ROOT) || !fs.existsSync(f)) { rsp.writeHead(404); return rsp.end(); }
      rsp.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(rsp);
    }).listen(0, () => res(srv));
  });
}

(async () => {
  const srv = await serve(); const port = srv.address().port;
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 720, height: 1280 } });
  page.on('console', (m) => { if (m.type() === 'error') console.error('[page]', m.text()); });
  page.on('pageerror', (e) => console.error('[pageerror]', e.message));
  let size = opt('--size', null);
  if (!size) { try { size = JSON.parse(fs.readFileSync(path.join(ROOT, 'stories', story, 'story.json'), 'utf8')).size; } catch (e) {} }
  size = (size || '720x1280').split('x');
  await page.goto(`http://localhost:${port}/engine/index.html?story=${story}&w=${size[0]}&h=${size[1]}`);
  await page.waitForFunction('window.ready === true', null, { timeout: 60000 });
  const outDir = path.join(ROOT, 'stories', story, 'out'); fs.mkdirSync(outDir, { recursive: true });

  const preview = opt('--preview', null);
  if (preview) {
    for (const item of preview.split(',')) {
      const [id, t, d, cam] = item.split(':');
      await page.evaluate(([id, d]) => window.studio.build(id, d), [id, +(d || 3)]);
      const url = await page.evaluate(([t, cam]) => window.studio.frame(t, 0.92, cam), [+t, cam ? cam.split('/').map(Number) : null]);
      fs.writeFileSync(path.join(outDir, `preview_${id}_${t}${cam ? '_dbg' : ''}.jpg`), Buffer.from(url.split(',')[1], 'base64'));
      console.log('preview', id, t);
    }
    await browser.close(); srv.close(); return;
  }

  const timeline = JSON.parse(fs.readFileSync(path.join(outDir, 'timeline.json'), 'utf8'));
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', path.join(outDir, 'video_noaudio.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now(); let total = 0;
  for (const shot of timeline.shots) {
    const frames = shot.frames;
    await page.evaluate(([id, d, x]) => window.studio.build(id, d, x), [shot.id, frames / FPS, shot.dissolve || 0]);
    for (let i = 0; i < frames; i++) {
      const url = await page.evaluate((t) => window.studio.frame(t, 0.93), i / FPS);
      const buf = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
      total++;
    }
    console.log(`${shot.id}: ${frames} frames  (${((Date.now() - t0) / 1000).toFixed(0)}s, ${(total / ((Date.now() - t0) / 1000)).toFixed(1)} fps)`);
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r));
  await browser.close(); srv.close();
  console.log('fertig:', total, 'Frames in', ((Date.now() - t0) / 1000).toFixed(0), 's');
})();
