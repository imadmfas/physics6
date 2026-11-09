import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'fs';
await build({ entryPoints: ['src/js/app.js'], bundle: true, minify: true, format: 'esm', outfile: 'app.js', external: ['https://*'], target: 'es2020', legalComments: 'none' });
const css = readFileSync('src/style.css', 'utf8');
const html = readFileSync('src/index.html', 'utf8').replace('/*CSS*/', css).replace('VERSION', Date.now().toString(36));
writeFileSync('index.html', html);
console.log('built');
