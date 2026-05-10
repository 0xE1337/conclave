#!/usr/bin/env node
/**
 * Capture hero screenshots of the live Conclave dApp for the README.
 * Uses Playwright Chromium headless. Saves to docs/screenshots/.
 *
 * Run: node scripts/capture-screenshots.mjs [URL]
 *   URL defaults to https://conclave-rho.vercel.app
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "docs", "screenshots");
const URL = process.argv[2] || "http://localhost:3700";

const DESKTOP = { width: 1280, height: 900, deviceScaleFactor: 2 };
const MOBILE  = { width: 390,  height: 844, deviceScaleFactor: 2 };

async function clickButtonByText(page, text) {
  await page.evaluate((t) => {
    const btn = [...document.querySelectorAll("button")].find(
      (b) => b.textContent.trim() === t || b.textContent.trim().startsWith(t),
    );
    btn?.click();
  }, text);
}

async function clickButtonContaining(page, text) {
  await page.evaluate((t) => {
    const btn = [...document.querySelectorAll("button")].find((b) =>
      b.textContent.includes(t),
    );
    btn?.click();
  }, text);
}

async function shoot(page, name) {
  const path = join(OUT, name);
  await page.screenshot({ path, fullPage: false });
  console.log(`  → ${name}`);
}

async function shootFull(page, name) {
  const path = join(OUT, name);
  await page.screenshot({ path, fullPage: true });
  console.log(`  → ${name} (full)`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function captureHomePersona(ctx, persona, file) {
  const page = await ctx.newPage();
  await page.setViewportSize({ width: DESKTOP.width, height: DESKTOP.height });
  await page.goto(URL, { waitUntil: "networkidle" });
  await sleep(800);
  if (persona !== "Borrower") {
    await clickButtonByText(page, `🌿${persona}`); // wrong emoji, try variants
    // The 4 persona buttons start with their emoji; use textContent including label
    await page.evaluate((label) => {
      const btn = [...document.querySelectorAll("button")].find((b) =>
        b.textContent.includes(label),
      );
      btn?.click();
    }, persona);
  }
  await sleep(700);
  await shoot(page, file);
  await page.close();
}

async function main() {
  await mkdir(OUT, { recursive: true });
  console.log(`Capturing screenshots from ${URL} → ${OUT}`);

  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: DESKTOP,
    deviceScaleFactor: 2,
    colorScheme: "light",
    reducedMotion: "no-preference",
  });

  // 1. Home (Borrower) — desktop hero
  {
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: "networkidle" });
    await sleep(1000);
    await shoot(page, "01-home-borrower.png");
    await page.close();
  }

  // 2. Home (Regulator) — show the persona tint differentiation
  {
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: "networkidle" });
    await sleep(800);
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")].find((b) =>
        b.textContent.includes("Regulator"),
      );
      btn?.click();
    });
    await sleep(700);
    await shoot(page, "02-home-regulator.png");
    await page.close();
  }

  // 3. Score app, tier resolved (TierBand spring landed)
  {
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: "networkidle" });
    await sleep(800);
    // Open Score app
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")].find((b) =>
        b.textContent.includes("CreditScoreEngine"),
      );
      btn?.click();
    });
    await sleep(900);
    // Resolve tier
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")].find(
        (b) => b.textContent.trim() === "Resolve tier on ciphertext",
      );
      btn?.click();
    });
    await sleep(900);
    await shoot(page, "03-score-tier-resolved.png");
    await page.close();
  }

  // 4. Score app, regulator authorized (DecryptionReveal climax)
  {
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: "networkidle" });
    await sleep(800);
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")].find((b) =>
        b.textContent.includes("CreditScoreEngine"),
      );
      btn?.click();
    });
    await sleep(900);
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")].find(
        (b) => b.textContent.trim() === "Resolve tier on ciphertext",
      );
      btn?.click();
    });
    await sleep(700);
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")].find((b) =>
        b.textContent.includes("Authorize regulator"),
      );
      btn?.click();
    });
    await sleep(1200);
    // scroll to DecryptionReveal section
    await page.evaluate(() => {
      const h = [...document.querySelectorAll("h3")].find((x) =>
        x.textContent.includes("Selective regulator"),
      );
      h?.scrollIntoView({ block: "start" });
    });
    await sleep(500);
    await shoot(page, "04-score-decryption-reveal.png");
    await page.close();
  }

  // 5. Conclave app — Underwriter persona, sealed proposals
  {
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: "networkidle" });
    await sleep(800);
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")].find((b) =>
        b.textContent.includes("Underwriter"),
      );
      btn?.click();
    });
    await sleep(500);
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")].find((b) =>
        b.textContent.includes("ListingConclave"),
      );
      btn?.click();
    });
    await sleep(900);
    await shoot(page, "05-conclave-app.png");
    await page.close();
  }

  // 6. Registry — full borrower roster
  {
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: "networkidle" });
    await sleep(800);
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")].find((b) =>
        b.textContent.includes("BorrowerRegistry"),
      );
      btn?.click();
    });
    await sleep(900);
    await shoot(page, "06-registry-app.png");
    await page.close();
  }

  // 7. Pool app
  {
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: "networkidle" });
    await sleep(800);
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")].find((b) =>
        b.textContent.includes("PrivateCreditPool"),
      );
      btn?.click();
    });
    await sleep(900);
    await shoot(page, "07-pool-app.png");
    await page.close();
  }

  // 8. Mobile home
  {
    const ctxM = await browser.newContext({
      viewport: MOBILE,
      deviceScaleFactor: 2,
      colorScheme: "light",
    });
    const page = await ctxM.newPage();
    await page.goto(URL, { waitUntil: "networkidle" });
    await sleep(1000);
    await shootFull(page, "08-mobile-home.png");
    await page.close();
    await ctxM.close();
  }

  await ctx.close();
  await browser.close();
  console.log("\n✓ Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
