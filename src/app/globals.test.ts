import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const globalsCss = readFileSync(new URL("./globals.css", import.meta.url), "utf8");
const projectRoot = new URL("../..", import.meta.url);

function getRootBlock(mode: "light" | "dark"): string {
  const pattern = mode === "light"
    ? /:root\s*\{([\s\S]*?)\n\}/
    : /@media\s*\(prefers-color-scheme:\s*dark\)\s*\{\s*:root\s*\{([\s\S]*?)\n\s*\}\s*\}/;
  const match = globalsCss.match(pattern);
  assert.ok(match, `Expected to find the ${mode}-mode :root block in globals.css`);
  return match[1];
}

function getToken(mode: "light" | "dark", name: string): string {
  const block = getRootBlock(mode);
  const pattern = new RegExp(`--${name}:\\s*([^;]+);`);
  const match = block.match(pattern);
  assert.ok(match, `Expected to find --${name} in the ${mode}-mode :root block`);
  return match[1].trim();
}

test("light mode uses denser glass surfaces and deeper text tokens", () => {
  assert.equal(getToken("light", "glass-fallback-bg"), "rgba(255, 255, 255, 0.24)");
  assert.equal(getToken("light", "glass-floating-bg"), "rgba(255, 255, 255, 0.26)");
  assert.equal(getToken("light", "ios-material-bg"), "rgba(255, 255, 255, 0.3)");
  assert.equal(getToken("light", "text-secondary"), "#1e293b");
  assert.equal(getToken("light", "text-tertiary"), "#475569");
});

test("light mode background veil stays strong enough for busy photography", () => {
  assert.equal(getToken("light", "bg-overlay"), "rgba(244, 247, 251, 0.38)");
  assert.equal(getToken("light", "bg-overlay-gradient-top"), "rgba(248, 250, 252, 0.76)");
  assert.equal(getToken("light", "bg-overlay-gradient-bottom"), "rgba(241, 245, 249, 0.62)");
});

test("prism tokens are defined for light and dark mode", () => {
  const expectedLight = {
    "prism-fill": "rgba(255, 255, 255, 0.1)",
    "prism-fill-strong": "rgba(255, 255, 255, 0.14)",
    "prism-border": "rgba(255, 255, 255, 0.22)",
    "prism-highlight": "rgba(255, 255, 255, 0.28)",
    "prism-shadow": "rgba(15, 23, 42, 0.05)",
    "prism-tint-rgb": "190, 24, 93",
    "prism-orb-glow": "rgba(255, 255, 255, 0)",
    "prism-press-depth": "0.985",
  };
  const expectedDark = {
    "prism-fill": "rgba(255, 255, 255, 0.035)",
    "prism-fill-strong": "rgba(255, 255, 255, 0.055)",
    "prism-border": "rgba(255, 255, 255, 0.09)",
    "prism-highlight": "rgba(255, 255, 255, 0.12)",
    "prism-shadow": "rgba(2, 6, 23, 0.16)",
    "prism-tint-rgb": "251, 113, 133",
    "prism-orb-glow": "rgba(255, 255, 255, 0)",
    "prism-press-depth": "0.985",
  };

  for (const [name, value] of Object.entries(expectedLight)) {
    assert.equal(getToken("light", name), value);
  }

  for (const [name, value] of Object.entries(expectedDark)) {
    assert.equal(getToken("dark", name), value);
  }
});

test("flat micro surfaces avoid loud glow and decorative gradients", () => {
  assert.match(globalsCss, /\.prism-orb-button\s*\{/);
  assert.doesNotMatch(
    globalsCss,
    /radial-gradient\(circle at 76% 78%, rgba\(var\(--prism-tint-rgb\), 0\.18\)/,
  );
  assert.doesNotMatch(
    globalsCss,
    /0 0 10px var\(--prism-orb-glow\)/,
  );
  assert.doesNotMatch(
    globalsCss,
    /0 0 0 1px rgba\(255, 255, 255, 0\.04\),\s*0 0 10px var\(--prism-orb-glow\)/,
  );
});

test("globals.css defines the prism surface selectors", () => {
  for (const selector of [
    ".prism-panel",
    ".prism-badge",
    ".prism-orb-button",
    ".prism-pill",
    ".prism-avatar-disc",
    ".prism-interactive",
    ".prism-static",
  ]) {
    assert.match(globalsCss, new RegExp(`\\${selector}\\b`));
  }
});

test("glass-card fallback shell keeps the shared liquid glass radius", () => {
  const baseGlassCardRule = globalsCss.match(/(?:^|\n)\.glass-card\s*\{([\s\S]*?)\n\}/);
  assert.ok(baseGlassCardRule, "Expected globals.css to define the base .glass-card rule");

  assert.match(
    globalsCss,
    /:root\[data-liquid-glass="fallback"\]\s+\.glass-card\s*\{[\s\S]*border-radius:\s*var\(--glass-radius\);/,
    "Expected the explicit fallback shell to use the shared radius so it never boots as a square tile",
  );

  assert.doesNotMatch(
    baseGlassCardRule[1],
    /background:\s*var\(--glass-fallback-bg\);/,
    "Expected fallback paint to be opt-in instead of shipping in the default server-rendered shell",
  );
});

test("ios media card shell stays borderless", () => {
  const iosMediaCardRule = globalsCss.match(/(?:^|\n)\.ios-media-card\s*\{([\s\S]*?)\n\}/);
  assert.ok(iosMediaCardRule, "Expected globals.css to define the base .ios-media-card rule");

  assert.match(
    iosMediaCardRule[1],
    /border:\s*none;/,
    "Expected the iOS media shell to rely on highlight and shadow instead of a visible border",
  );

  assert.doesNotMatch(
    iosMediaCardRule[1],
    /border:\s*1px solid var\(--ios-material-border\);/,
    "Expected the iOS media shell to stop drawing the theme-tinted outline",
  );
});

test("ios media card highlight stays inside the shell edge", () => {
  const iosMediaCardHighlightRule = globalsCss.match(/(?:^|\n)\.ios-media-card::before\s*\{([\s\S]*?)\n\}/);
  assert.ok(iosMediaCardHighlightRule, "Expected globals.css to define the .ios-media-card::before rule");

  assert.match(
    iosMediaCardHighlightRule[1],
    /inset:\s*1px;/,
    "Expected the highlight layer to be inset so it does not read as an outer border",
  );

  assert.match(
    iosMediaCardHighlightRule[1],
    /border-radius:\s*calc\(var\(--glass-radius\)\s*-\s*1px\);/,
    "Expected the inset highlight to keep a matching inner radius",
  );
});

test("affected components migrate from glass utilities to prism surfaces", () => {
  const expectedClassUsage = [
    ["src/components/skills-card.tsx", "prism-pill"],
    ["src/components/hardware-card.tsx", "prism-pill"],
    ["src/components/social-card.tsx", "prism-orb-button"],
    ["src/components/projects-card.tsx", "prism-panel"],
    ["src/components/projects-card.tsx", "prism-badge"],
    ["src/components/software-card.tsx", "prism-panel"],
    ["src/components/friends-card.tsx", "prism-avatar-disc"],
    ["src/components/blog-card.tsx", "prism-badge"],
    ["src/components/photo-stack-card.tsx", "prism-badge"],
  ] as const;

  for (const [path, className] of expectedClassUsage) {
    const source = readFileSync(new URL(path, projectRoot), "utf8");
    assert.match(source, new RegExp(`\\b${className}\\b`), `Expected ${path} to use ${className}`);
  }

  for (const path of [
    "src/components/skills-card.tsx",
    "src/components/hardware-card.tsx",
    "src/components/social-card.tsx",
    "src/components/projects-card.tsx",
    "src/components/software-card.tsx",
    "src/components/friends-card.tsx",
    "src/components/blog-card.tsx",
    "src/components/photo-stack-card.tsx",
  ]) {
    const source = readFileSync(new URL(path, projectRoot), "utf8");

    for (const removedClassName of [
      "glass-inner-surface",
      "glass-chip",
      "glass-icon-button",
      "pill-tag",
    ]) {
      assert.doesNotMatch(
        source,
        new RegExp(`\\b${removedClassName}\\b`),
        `Expected ${path} to stop using ${removedClassName}`,
      );
    }
  }
});

test("informational chips render as static prism surfaces instead of clickable hover controls", () => {
  for (const path of [
    "src/components/skills-card.tsx",
    "src/components/hardware-card.tsx",
  ]) {
    const source = readFileSync(new URL(path, projectRoot), "utf8");

    assert.match(source, /\bprism-pill prism-static\b/, `Expected ${path} to use static Prism pills`);
    assert.doesNotMatch(source, /whileHover=\{\{\s*scale:/, `Expected ${path} not to scale static chips on hover`);
    assert.doesNotMatch(source, /whileTap=\{\{\s*scale:/, `Expected ${path} not to press static chips`);
  }
});

test("dense list cards avoid directional hover shifts and decorative hover arrows", () => {
  const projectsSource = readFileSync(new URL("src/components/projects-card.tsx", projectRoot), "utf8");
  const blogSource = readFileSync(new URL("src/components/blog-card.tsx", projectRoot), "utf8");

  assert.doesNotMatch(projectsSource, /whileHover=\{\{\s*x:/, "Expected project rows not to slide horizontally on hover");
  assert.doesNotMatch(projectsSource, /Left tint accent/, "Expected project rows not to add a decorative hover-only accent rail");
  assert.doesNotMatch(blogSource, /group-hover:translate-x/, "Expected blog rows not to reveal sliding hover arrows");
  assert.doesNotMatch(blogSource, /whileHover=\{\{\s*backgroundColor:/, "Expected blog rows to use shared Prism hover styling");
});

test("profile hero text can wrap inside narrow mobile cards", () => {
  const source = readFileSync(new URL("src/components/profile-card.tsx", projectRoot), "utf8");

  assert.match(source, /break-words/, "Expected ProfileCard headline and title to opt into wrapping");
  assert.match(source, /w-full/, "Expected ProfileCard info column to fill the mobile card content width");
  assert.match(source, /Typewriter[\s\S]*className="[^"]*max-w-full/, "Expected Typewriter text to stay within the mobile card width");
});
