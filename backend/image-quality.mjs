import sharp from "sharp";
// Heuristics guide a retake; these values are not a validated blur classifier.
export async function inspectImage(bytes) {
  const meta = await sharp(bytes).metadata();
  const { data, info } = await sharp(bytes)
    .resize(256, 256, { fit: "inside" })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  let sum = 0,
    sumSq = 0,
    count = 0;
  for (let y = 1; y < info.height - 1; y++)
    for (let x = 1; x < info.width - 1; x++) {
      const i = y * info.width + x;
      const lap =
        4 * data[i] -
        data[i - 1] -
        data[i + 1] -
        data[i - info.width] -
        data[i + info.width];
      sum += lap;
      sumSq += lap * lap;
      count++;
    }
  const detail = count ? sumSq / count - (sum / count) ** 2 : 0;
  const flags = [];
  if (Math.min(meta.width, meta.height) < 320)
    flags.push(
      "Low resolution: a closer, higher-resolution image may be needed.",
    );
  if (mean < 35) flags.push("Low light: details may be difficult to inspect.");
  if (mean > 235) flags.push("Very bright image: some detail may be lost.");
  if (detail < 45)
    flags.push("Limited edge detail: check focus and consider another angle.");
  return {
    assessment: "heuristic",
    width: meta.width,
    height: meta.height,
    brightness: Math.round(mean),
    detail_score: Math.round(detail),
    flags,
    usable_for_ai:
      Math.min(meta.width, meta.height) >= 128 &&
      mean >= 20 &&
      mean <= 245 &&
      detail >= 10,
  };
}
