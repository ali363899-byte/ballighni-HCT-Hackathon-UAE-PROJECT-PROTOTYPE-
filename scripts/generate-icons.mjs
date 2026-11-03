import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
const svg = await readFile("frontend/logo.svg");
for (const [density, size, foreground] of [
  ["mdpi", 48, 108],
  ["hdpi", 72, 162],
  ["xhdpi", 96, 216],
  ["xxhdpi", 144, 324],
  ["xxxhdpi", 192, 432],
]) {
  const base = `android/app/src/main/res/mipmap-${density}`;
  const icon = await sharp(svg).resize(size, size).png().toBuffer();
  await writeFile(`${base}/ic_launcher.png`, icon);
  await writeFile(`${base}/ic_launcher_round.png`, icon);
  const inset = Math.round(foreground * 0.62);
  const mark = await sharp(svg).resize(inset, inset).toBuffer();
  await sharp({
    create: {
      width: foreground,
      height: foreground,
      channels: 4,
      background: "#f4f7fb",
    },
  })
    .composite([{ input: mark, gravity: "center" }])
    .png()
    .toFile(`${base}/ic_launcher_foreground.png`);
}
await writeFile(
  "android/app/src/main/res/values/ic_launcher_background.xml",
  '<?xml version="1.0" encoding="utf-8"?><resources><color name="ic_launcher_background">#f4f7fb</color></resources>',
);
console.log("Ballighni launcher icons generated.");
