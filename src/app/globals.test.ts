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

test("light mode uses clear glass controls and deeper text tokens", () => {
  assert.equal(getToken("light", "glass-fallback-bg"), "rgba(255, 255, 255, 0.18)");
  assert.equal(getToken("light", "glass-floating-bg"), "rgba(255, 255, 255, 0.18)");
  assert.equal(getToken("light", "ios-material-bg"), "rgba(255, 255, 255, 0.24)");
  assert.equal(getToken("light", "text-secondary"), "#1e293b");
  assert.equal(getToken("light", "text-tertiary"), "#475569");
});

test("light mode background veil stays clear enough for liquid refraction", () => {
  assert.equal(getToken("light", "bg-overlay"), "rgba(244, 247, 251, 0.18)");
  assert.equal(getToken("light", "bg-overlay-gradient-top"), "rgba(248, 250, 252, 0.42)");
  assert.equal(getToken("light", "bg-overlay-gradient-bottom"), "rgba(241, 245, 249, 0.34)");
  assert.equal(getToken("light", "glass-scene-veil-strength"), "0.88");
});

test("legacy prism inner-control systems are removed from global styling", () => {
  assert.doesNotMatch(globalsCss, /--prism-/);
  assert.doesNotMatch(globalsCss, /\.prism-/);
  assert.doesNotMatch(globalsCss, new RegExp(`\\.glass-inner-${"sur"}${"face"}`));
  assert.doesNotMatch(globalsCss, /\.glass-chip/);
  assert.doesNotMatch(globalsCss, /\.glass-icon-button/);
  assert.doesNotMatch(globalsCss, /\.pill-tag/);
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

test("affected components do not use legacy shared inner-control classes", () => {
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
      "prism-",
      `glass-inner-${"sur"}${"face"}`,
      "glass-chip",
      "glass-icon-button",
      "pill-tag",
    ]) {
      assert.doesNotMatch(
        source,
        new RegExp(removedClassName.replace("-", "\\-")),
        `Expected ${path} to stop using ${removedClassName}`,
      );
    }
  }
});

test("informational chips stay static instead of clickable hover controls", () => {
  for (const path of [
    "src/components/skills-card.tsx",
    "src/components/hardware-card.tsx",
  ]) {
    const source = readFileSync(new URL(path, projectRoot), "utf8");

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
  assert.doesNotMatch(blogSource, /whileHover=\{\{\s*backgroundColor:/, "Expected blog rows to use CSS hover styling");
});

test("profile hero text can wrap inside narrow mobile cards", () => {
  const source = readFileSync(new URL("src/components/profile-card.tsx", projectRoot), "utf8");

  assert.match(source, /break-words/, "Expected ProfileCard headline and title to opt into wrapping");
  assert.match(source, /w-full/, "Expected ProfileCard info column to fill the mobile card content width");
  assert.match(source, /Typewriter[\s\S]*className="[^"]*max-w-full/, "Expected Typewriter text to stay within the mobile card width");
});
