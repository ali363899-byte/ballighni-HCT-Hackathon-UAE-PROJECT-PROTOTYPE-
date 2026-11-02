const width = Number(new URLSearchParams(location.search).get("width")) || 390;
if ([320, 360, 390, 412].includes(width)) {
  document.querySelector("iframe").style.width = `${width}px`;
  document.querySelector("#dimensions").textContent =
    `${width} × 844 CSS pixels · responsive layout test, not an Android emulator`;
}
