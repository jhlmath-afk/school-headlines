const fs = require("node:fs/promises");
const path = require("node:path");
const sharp = require("/Users/leehj/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp");
const { chromium } = require("/Users/leehj/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const sharp = require("sharp");
const { chromium } = require("playwright");

const root = __dirname;
const rawDir = path.join(root, "newsstand-captures", "clean-raw");
const finalDir = path.join(root, "newsstand-captures", "clean");
const htmlPath = path.join(root, "newspaper.html");
const htmlPath = path.join(root, "index.html");

const papers = [
  { code: "023", name: "chosun" },
  await fs.writeFile(htmlPath, updated);
}

async function capturePaper(page, paper) {
  const url = `https://newsstand.naver.com/?list=&pcode=${paper.code}`;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      console.log(`Capturing ${paper.name}, attempt ${attempt}`);

      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      await page.waitForTimeout(9000);

      const rawPath = path.join(rawDir, `${paper.name}.png`);
      await page.screenshot({ path: rawPath, fullPage: false });

      await sharp(rawPath)
        .extract({
          left: 1010,
          top: 435,
          width: 1800,
          height: 1080,
        })
        .resize({ width: 960 })
        .png({ compressionLevel: 9, adaptiveFiltering: true })
        .toFile(path.join(finalDir, `${paper.name}.png`));

      return;
    } catch (error) {
      console.log(`${paper.name} failed on attempt ${attempt}: ${error.message}`);
      if (attempt === 3) throw error;
      await page.waitForTimeout(5000);
    }
  }
}

async function main() {
  await fs.mkdir(rawDir, { recursive: true });
  await fs.mkdir(finalDir, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
  });

  for (const paper of papers) {
    const url = `https://newsstand.naver.com/?list=&pcode=${paper.code}`;
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(3500);

    const rawPath = path.join(rawDir, `${paper.name}.png`);
    await page.screenshot({ path: rawPath, fullPage: false });

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
    await capturePaper(page, paper);
  }

  await browser.close();
