import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import vm from 'node:vm';

const projectRoot = resolve(process.cwd());
const manifestPath = resolve(projectRoot, 'service-worker-assets.js');

const budgets = {
  jsGzipBytes: 85 * 1024,
  cssGzipBytes: 28 * 1024,
  appShellGzipBytes: 180 * 1024,
  singleAssetGzipBytes: 35 * 1024
};

const formatKb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

const loadManifest = () => {
  if (!existsSync(manifestPath)) {
    throw new Error('Missing service-worker-assets.js. Run npm run pwa:manifest first.');
  }

  const sandbox = { self: {} };
  vm.runInNewContext(readFileSync(manifestPath, 'utf8'), sandbox);
  return sandbox.self.FLOWDESK_SW_MANIFEST;
};

const readAsset = (assetPath) => {
  const filePath = assetPath === '/' ? resolve(projectRoot, 'index.html') : resolve(projectRoot, assetPath.slice(1));
  return existsSync(filePath) ? readFileSync(filePath) : Buffer.from('');
};

const gzipSize = (buffer) => gzipSync(buffer).byteLength;
const sumGzip = (assets) => assets.reduce((total, assetPath) => total + gzipSize(readAsset(assetPath)), 0);

const manifest = loadManifest();
const appShell = manifest.appShell || [];
const jsAssets = appShell.filter((assetPath) => assetPath.endsWith('.js') && !assetPath.includes('service-worker'));
const cssAssets = appShell.filter((assetPath) => assetPath.endsWith('.css'));
const appShellGzipBytes = sumGzip(appShell);
const jsGzipBytes = sumGzip(jsAssets);
const cssGzipBytes = sumGzip(cssAssets);
const largestAssets = appShell
  .map((assetPath) => ({ assetPath, gzipBytes: gzipSize(readAsset(assetPath)) }))
  .sort((left, right) => right.gzipBytes - left.gzipBytes)
  .slice(0, 5);

const checks = [
  ['JavaScript gzip size', jsGzipBytes, budgets.jsGzipBytes],
  ['CSS gzip size', cssGzipBytes, budgets.cssGzipBytes],
  ['App-shell gzip size', appShellGzipBytes, budgets.appShellGzipBytes],
  ...largestAssets.map((asset) => [`Single asset gzip size: ${asset.assetPath}`, asset.gzipBytes, budgets.singleAssetGzipBytes])
];

let failed = false;

checks.forEach(([label, actual, budget]) => {
  const status = actual <= budget ? 'PASS' : 'FAIL';
  if (actual > budget) failed = true;
  console.log(`${status} ${label}: ${formatKb(actual)} / ${formatKb(budget)}`);
});

if (failed) {
  process.exit(1);
}
