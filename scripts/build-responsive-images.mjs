/** Optional asset authoring step; generated variants are committed for static hosting. */
import { fileURLToPath } from "node:url";
import sharp from "sharp";
const root = new URL("../", import.meta.url);
for (const width of [640, 960]) {
  const name = `assets/hero-characters-${width}.webp`;
  const result = await sharp(fileURLToPath(new URL("assets/hero-characters.png", root)))
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 85, effort: 6 })
    .toFile(fileURLToPath(new URL(name, root)));
  console.log(`${name}: ${result.width}×${result.height}, ${result.size} bytes`);
}
