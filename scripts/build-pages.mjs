import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// เตรียมไฟล์หน้าเว็บสำหรับ GitHub Pages โดยไม่คัดลอก backend หรือฐานข้อมูล
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const out = join(root, "dist");
const copyFiles = [
  "index.html",
  "styles.css",
  "script.js",
  "catalog.js"
];

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const item of copyFiles) {
  await cp(join(root, item), join(out, item), { recursive: true });
}
const html = await readFile(join(root, "index.html"), "utf8");
const referencedComponents = [...html.matchAll(/(?:href|src)="(components\/[^"?#]+)"/g)].map((match) => match[1]);
for (const item of referencedComponents) {
  await mkdir(dirname(join(out, item)), { recursive: true });
  await cp(join(root, item), join(out, item));
}
await cp(join(root, "data"), join(out, "data"), { recursive: true });
await cp(join(root, "assets"), join(out, "assets"), { recursive: true });

// ใช้ตะกร้าจำลองในหน่วยความจำแทน API และปิด checkout สำหรับเว็บพอร์ตโฟลิโอสาธารณะ
const cartApiPath = join(out, "components", "cart-api.js");
await writeFile(cartApiPath, await readFile(join(root, "scripts", "pages-cart-api.js"), "utf8"));

const scriptPath = join(out, "script.js");
let appScript = await readFile(scriptPath, "utf8");
const checkoutHandler = '$("#cartCheckout").addEventListener("click",function(){checkoutKey=null;setCartMode("checkout");$("#cartStatus").textContent="";checkoutForm.querySelector(\'[name="name"]\').focus()});';
const demoCheckoutHandler = '$("#cartCheckout").addEventListener("click",function(){if(cartApi.demo){$("#cartStatus").textContent=t("portfolioDemoCheckout");return}checkoutKey=null;setCartMode("checkout");$("#cartStatus").textContent="";checkoutForm.querySelector(\'[name="name"]\').focus()});';
if (!appScript.includes(checkoutHandler)) throw new Error("Could not locate the checkout handler to protect the public demo.");
appScript = appScript.replace(checkoutHandler, demoCheckoutHandler);
await writeFile(scriptPath, appScript);

const i18nPath = join(out, "components", "i18n.js");
let translations = await readFile(i18nPath, "utf8");
translations = translations.replace(
  'bag:"Bag",',
  'bag:"Bag",portfolioDemoCheckout:"This public portfolio demo has a temporary bag only. Checkout is disabled and no order or customer details are sent.",'
);
translations = translations.replace(
  'bag:"ตะกร้า",',
  'bag:"ตะกร้า",portfolioDemoCheckout:"เว็บไซต์ตัวอย่างนี้ใช้ตะกร้าชั่วคราวเท่านั้น ปิดการสั่งซื้อ และไม่มีการส่งคำสั่งซื้อหรือข้อมูลลูกค้า",'
);
translations = translations.replace(
  'cartNote:"Inventory is not connected yet. Orders are saved for manual confirmation; payment is not processed here."',
  'cartNote:"Portfolio demo: the bag exists only in this browser tab. Checkout and payment are disabled."'
);
translations = translations.replace(
  'cartNote:"ยังไม่ได้เชื่อมต่อสต็อก ระบบจะบันทึกคำขอไว้ให้ทีมงานตรวจสอบ ไม่มีการชำระเงินผ่านหน้านี้"',
  'cartNote:"เว็บพอร์ตโฟลิโอตัวอย่าง: ตะกร้าอยู่ชั่วคราวในแท็บนี้ ปิดการสั่งซื้อและชำระเงิน"'
);
await writeFile(i18nPath, translations);

// บอก Pages ว่าโฟลเดอร์นี้มีไฟล์พร้อมเสิร์ฟ ไม่ต้องประมวลผลด้วย Jekyll
await writeFile(join(out, ".nojekyll"), "");
console.log(`GitHub Pages files prepared in ${out}`);
