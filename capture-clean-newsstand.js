const fs = require("node:fs/promises");
const path = require("node:path");
const sharp = require("sharp");
const { chromium } = require("playwright");

const root = __dirname;
const rawDir = path.join(root, "newsstand-captures", "clean-raw");
const finalDir = path.join(root, "newsstand-captures", "clean");
const htmlPath = path.join(root, "newspaper.html");

const papers = [
  { code: "023", name: "chosun" },
  { code: "020", name: "donga" },
  { code: "028", name: "hani" },
  { code: "032", name: "khan" },
];

function koreanDateTitle(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return `${formatter.format(date)} 헤드라인 모음`;
}

async function updateHtmlTitle() {
  const title = koreanDateTitle();
  const html = await fs.readFile(htmlPath, "utf8");
  const updated = html
    .replace(/<title>.*?헤드라인 모음<\/title>/, `<title>${title}</title>`)
    .replace(/<h1>.*?헤드라인 모음<\/h1>/, `<h1>${title}</h1>`);
  await fs.writeFile(htmlPath, updated);
}

async function main() {
  await fs.mkdir(rawDir, { recursive: true });
  await fs.mkdir(finalDir, { recursive: true });
  await updateHtmlTitle();

  const browser = await chromium.launch({
    headless: true,
  });

  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
  });

  for (const paper of papers) {
    const url = `https://newsstand.naver.com/?list=&pcode=${paper.code}`;

    await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 45000,
    });

    await page.waitForTimeout(3500);

    const rawPath = path.join(rawDir, `${paper.name}.png`);

    await page.screenshot({
      path: rawPath,
      fullPage: false,
    });

    await sharp(rawPath)
      .extract({
        left: 1010,
        top: 435,
        width: 1800,
        height: 1080,
      })
      .resize({ width: 1440 })
      .png()
      .toFile(path.join(finalDir, `${paper.name}.png`));
  }

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
