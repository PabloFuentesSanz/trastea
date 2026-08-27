import { chromium } from "@playwright/test";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await b.newPage({
  viewport: { width: 1100, height: 900 },
  deviceScaleFactor: 1.5,
});
const errores = [];
p.on("console", (m) => m.type() === "error" && errores.push(m.text()));
await p.goto(process.argv[2], { waitUntil: "networkidle" });
await p.screenshot({ path: process.argv[3], fullPage: false });
console.error("ERRORES:" + JSON.stringify(errores));
await b.close();
