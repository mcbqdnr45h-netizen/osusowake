import { PDFDocument, PageSizes } from 'pdf-lib';
import { readFile, writeFile, unlink, stat } from 'node:fs/promises';

async function jpgToA4Pdf(jpgPath, pdfPath) {
  const buf = await readFile(jpgPath);
  const doc = await PDFDocument.create();
  const img = await doc.embedJpg(buf);
  const [w, h] = PageSizes.A4;
  const page = doc.addPage([w, h]);
  page.drawImage(img, { x: 0, y: 0, width: w, height: h });
  const out = await doc.save();
  await writeFile(pdfPath, out);
  const st = await stat(pdfPath);
  console.log(`OK ${pdfPath} (${(st.size / 1024).toFixed(1)} KB, img ${img.width}x${img.height})`);
}

const jobs = [
  ['attached_assets/flyers/_print_user.jpg',  'attached_assets/flyers/osusowake_flyer_user_A4.pdf'],
  ['attached_assets/flyers/_print_store.jpg', 'attached_assets/flyers/osusowake_flyer_store_A4.pdf'],
];

for (const [jpg, pdf] of jobs) await jpgToA4Pdf(jpg, pdf);
for (const [jpg] of jobs) await unlink(jpg).catch(() => {});
console.log('done');
