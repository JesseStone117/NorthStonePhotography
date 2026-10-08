import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'src/generated');
const categories = {
  'Grad': 'graduation',
  'Couples and Engagement': 'couples',
  'Family': 'family',
  'Maternity': 'maternity',
  'Aesthetic for Website': 'aesthetic',
};
const slug = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
await mkdir(resolve(output, 'photos'), { recursive: true });
const cachePath = resolve(output, '.cache.json');
let cache = {};
try { cache = JSON.parse(await readFile(cachePath, 'utf8')); } catch { /* First build. */ }
const imports = [];
const records = [];
const catalog = [];
let count = 0;
let optimized = 0;

for (const [folder, category] of Object.entries(categories)) {
  const directory = resolve(root, 'assets/photos', folder);
  const files = (await readdir(directory)).filter(name => /\.jpe?g$/i.test(name)).sort();
  for (const filename of files) {
    const source = resolve(directory, filename);
    const id = `${category}-${slug(filename.replace(/\.jpe?g$/i, ''))}`;
    const buffer = await readFile(source);
    const hash = createHash('sha256').update(buffer).update('webp-82-effort-5-v1').digest('hex');
    const metadata = await sharp(buffer).metadata();
    const sideways = [5, 6, 7, 8].includes(metadata.orientation);
    const width = sideways ? metadata.height : metadata.width;
    const height = sideways ? metadata.width : metadata.height;
    const widths = [...new Set([480, 960, 1920].map(size => Math.min(size, width)))];
    const variants = [];
    for (const size of widths) {
      const target = `photos/${id}-${size}.webp`;
      let exists = false;
      try { await access(resolve(output, target)); exists = true; } catch { /* Generate missing sizes. */ }
      if (cache[id] !== hash || !exists) {
        await sharp(buffer).rotate().resize({ width: size, withoutEnlargement: true })
          .webp({ quality: 82, effort: 5 }).toFile(resolve(output, target));
        optimized++;
      }
      const variable = `photo${count++}`;
      imports.push(`import ${variable} from './${target}';`);
      variants.push({ variable, width: size });
    }
    records.push(`{ id: ${JSON.stringify(id)}, category: ${JSON.stringify(category)}, width: ${width}, height: ${height}, src: ${variants.at(-1).variable}, preview: ${variants.find(v => v.width >= 960)?.variable ?? variants.at(-1).variable}, srcset: [${variants.map(v => `${v.variable} + ' ${v.width}w'`).join(', ')}].join(', ') }`);
    catalog.push({ id, category, width, height });
    cache[id] = hash;
  }
}
const module = `${imports.join('\n')}\n\nexport const photos = [\n${records.join(',\n')}\n];\n`;
await writeFile(resolve(output, 'photos.js'), module);
await writeFile(resolve(output, 'catalog.json'), JSON.stringify(catalog));
await writeFile(cachePath, JSON.stringify(cache));
console.log(`Prepared ${records.length} photos (${optimized} responsive WebP files updated).`);
