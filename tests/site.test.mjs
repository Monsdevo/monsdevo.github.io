import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
const root = new URL('../dist/client/', import.meta.url);
test('standalone page preserves technical content and gallery', async () => {
  const html = await readFile(new URL('infamous2-ios/index.html', root), 'utf8');
  for (const fact of ['iPhone 15 Pro', 'ARM64', 'SSAO', 'closed source', 'unofficial', '6 FPS']) assert.ok(html.includes(fact), fact);
  assert.equal((html.match(/data-capture /g) || []).length, 4);
  assert.doesNotMatch(html, /<video|<iframe|<!-- (?:STATUS|RUNTIME|METAL|PERFORMANCE)_CAPTURE -->|<!-- DEVELOPMENT LOG -->/i);
  assert.ok(html.includes('href="https://monsdevo.github.io/infamous2-ios/"'));
  assert.ok(html.includes('href="https://monsgames.net/"'));
  assert.doesNotMatch(html, /monsgames\.net\/infamous2-ios/);
});
test('all project page, CSS, gallery and font references resolve in the build', async () => {
  const html = await readFile(new URL('infamous2-ios/index.html', root), 'utf8');
  const css = await readFile(new URL('infamous2-ios/style.css', root), 'utf8');
  const paths = new Set([
    ...Array.from(html.matchAll(/(?:href|src)="(\/[^"?#]+)(?:[?#][^"]*)?"/g), match => match[1]),
    ...Array.from(html.matchAll(/(\/infamous2-ios\/assets\/[^\s",]+)\s+\d+w/g), match => match[1]),
    ...Array.from(css.matchAll(/url\(['"]?(\/[^)'"?#]+)/g), match => match[1]),
  ]);
  assert.ok(paths.size > 15);
  for (const path of paths) await access(new URL('.' + path, root));
});
test('public build excludes source and image provenance files', async () => {
  const files = await readdir(root, { recursive: true });
  assert.equal(files.some(file => /\.json$|\.mjs$|DESIGN|scripts|tests|\.impeccable/.test(file)), false);
});

test('root has no index and project routes resolve to the nested page', async () => {
  await assert.rejects(access(new URL('index.html', root)), { code: 'ENOENT' });
  await assert.rejects(access(new URL('../index.html', import.meta.url)), { code: 'ENOENT' });
  const { default: worker } = await import('../scripts/worker.mjs');
  const env = { ASSETS: { async fetch(request) {
    try { await access(new URL('.' + new URL(request.url).pathname, root)); return new Response('ok'); }
    catch { return new Response('Not found', { status: 404 }); }
  } } };
  for (const path of ['/', '/index.html', '/unknown']) assert.equal((await worker.fetch(new Request('https://monsdevo.github.io' + path), env)).status, 404);
  for (const path of ['/infamous2-ios', '/infamous2-ios/', '/infamous2-ios/index.html']) assert.equal((await worker.fetch(new Request('https://monsdevo.github.io' + path), env)).status, 200);
});
