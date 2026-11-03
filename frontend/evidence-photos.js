// Shared queue keeps camera shots and gallery photos together until upload.
export function mergeEvidencePhotos(existing, additions) {
  const next = [...existing];
  for (const file of additions) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
      throw new Error(
        "Use JPEG, PNG or WebP photos. If your camera uses HEIC, choose its JPEG / Most Compatible setting.",
      );
    if (file.size > 8 * 1024 * 1024)
      throw new Error("Each photo must be no larger than 8 MB.");
    if (
      !next.some(
        (item) =>
          item.name === file.name &&
          item.size === file.size &&
          item.lastModified === file.lastModified,
      )
    )
      next.push(file);
  }
  if (next.length > 6)
    throw new Error("Keep up to six photos. Remove one before taking another.");
  return next;
}
