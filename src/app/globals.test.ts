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

test("Apple system accent tokens adapt between light and dark appearances", () => {
  const expected = {
    "system-blue-rgb": ["0, 122, 255", "10, 132, 255"],
    "system-green-rgb": ["52, 199, 89", "48, 209, 88"],
    "system-orange-rgb": ["255, 149, 0", "255, 159, 10"],
    "system-purple-rgb": ["175, 82, 222", "191, 90, 242"],
    "system-red-rgb": ["255, 59, 48", "255, 69, 58"],
    "system-mint-rgb": ["0, 199, 190", "102, 212, 207"],
  } as const;

  for (const [token, [light, dark]] of Object.entries(expected)) {
    assert.equal(getToken("light", token), light);
    assert.equal(getToken("dark", token), dark);
    assert.notEqual(light, dark, `Expected --${token} to adapt to dark mode`);
  }
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

test("glass-card fallback keeps a directional layered-glass highlight", () => {
  assert.match(getToken("light", "glass-fallback-highlight"), /^rgba\(/);
  assert.match(getToken("dark", "glass-fallback-highlight"), /^rgba\(/);

  assert.match(
    globalsCss,
    /:root\[data-liquid-glass="fallback"\]\s+\.glass-card::before\s*\{[\s\S]*var\(--glass-fallback-highlight\)[\s\S]*inset\s+0\s+1px\s+0/,
    "Expected the fallback shell to retain an inset directional highlight instead of a flat blur only",
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

test("interests and hardware use static Apple index layouts", () => {
  const interestsSource = readFileSync(new URL("src/components/skills-card.tsx", projectRoot), "utf8");
  const hardwareSource = readFileSync(new URL("src/components/hardware-card.tsx", projectRoot), "utf8");
  const configSource = readFileSync(new URL("src/config/site.ts", projectRoot), "utf8");

  assert.match(configSource, /export type SystemAccent/);
  assert.match(configSource, /interests:\s*\{[\s\S]*label:\s*string;[\s\S]*icon:\s*string;[\s\S]*accent:\s*SystemAccent;[\s\S]*\}\[]/);
  assert.match(configSource, /cardTitles:\s*\{[\s\S]*interests:\s*string;[\s\S]*hardware:\s*string;[\s\S]*projects:\s*string;/);

  assert.match(interestsSource, /grid-cols-2[^"\n]*md:grid-cols-3[^"\n]*lg:grid-cols-4/);
  assert.match(interestsSource, /text-\[22px\][^"\n]*font-\[650\]/);
  assert.match(interestsSource, /w-7[^"\n]*h-7/);
  assert.doesNotMatch(interestsSource, /md:flex-col/);
  assert.match(interestsSource, /md:whitespace-normal[^"\n]*lg:truncate/);
  assert.doesNotMatch(interestsSource, /rounded-full|\bhover:|whileHover|whileTap/);

  assert.match(hardwareSource, /md:grid-cols-2/);
  assert.match(hardwareSource, /text-\[22px\][^"\n]*font-\[650\]/);
  assert.match(hardwareSource, /w-8[^"\n]*h-8/);
  assert.match(hardwareSource, /md:ml-0[^"\n]*lg:ml-11/);
  assert.doesNotMatch(hardwareSource, /rounded-full|\bhover:|whileHover|whileTap/);
});

test("content headers omit unexplained length counters", () => {
  const interestsSource = readFileSync(new URL("src/components/skills-card.tsx", projectRoot), "utf8");
  const hardwareSource = readFileSync(new URL("src/components/hardware-card.tsx", projectRoot), "utf8");
  const projectsSource = readFileSync(new URL("src/components/projects-card.tsx", projectRoot), "utf8");

  assert.doesNotMatch(interestsSource, /\binterests\.length\b/);
  assert.doesNotMatch(hardwareSource, /\bhardware\.length\b|\bgroup\.items\.length\b/);
  assert.doesNotMatch(projectsSource, /\bprojects\.length\b/);
  assert.match(projectsSource, /repoStats\.stars/);
  assert.match(projectsSource, /repoStats\.forks/);
});

test("blog editorial refactor preserves Halo data behavior", () => {
  const source = readFileSync(new URL("src/components/blog-card.tsx", projectRoot), "utf8");
  const successBlock = source.match(/\.then\(\(d: HaloResponse\) => \{[\s\S]*?\n\s*\}\)/)?.[0] ?? "";

  assert.match(source, /size=\$\{size\}&sort=spec\.publishTime%2Cdesc/);
  assert.match(successBlock, /setPosts\(d\.items \?\? \[\]\)/);
  assert.match(successBlock, /setLoading\(false\)/);
  assert.match(source, /\.catch\(\(\) => setLoading\(false\)\)/);
  assert.match(source, /href=\{`\$\{blogConfig\.url\}\$\{post\.status\.permalink\}`\}/);
});

test("blog uses an accessible Apple editorial list", () => {
  const source = readFileSync(new URL("src/components/blog-card.tsx", projectRoot), "utf8");
  const categoryBlock = source.match(/\{post\.categories\?\.\[0\][\s\S]*?displayName[\s\S]*?\n\s*\)\}/)?.[0] ?? "";
  const timeTag = source.match(/<span\s+className="[^"]*"[^>]*>\s*\{timeAgo\(post\.spec\.publishTime\)\}\s*<\/span>/)?.[0] ?? "";
  const viewsTag = source.match(/<span\s+aria-label=\{`\$\{post\.stats\?\.visit \?\? 0\} views`\}[^>]*>/)?.[0] ?? "";
  const arrowTag = source.match(/<ArrowUpRight[^>]*\/>/)?.[0] ?? "";
  const eyeTag = source.match(/<Eye[^>]*\/>/)?.[0] ?? "";
  const motionLinkClasses = [...source.matchAll(/<motion\.a[\s\S]*?className="([^"]+)"/g)].map((match) => match[1]);
  const postLinkClass = motionLinkClasses.find((className) => className.includes("flex-1")) ?? "";

  assert.match(source, /\{cardTitles\.blog\}/);
  assert.match(source, /\{cardTitles\.blogLink\}/);
  assert.match(source, /text-\[22px\][^"\n]*font-\[650\][^"\n]*leading-none/);
  assert.match(source, /min-h-11[^"\n]*min-w-11[^"\n]*text-\[12px\][^"\n]*font-semibold[^"\n]*text-text-tertiary/);
  assert.match(source, /line-clamp-1[^"\n]*text-\[15px\][^"\n]*font-\[640\][^"\n]*leading-\[1\.3\]/);
  assert.match(source, /mt-2[^"\n]*text-\[12px\][^"\n]*font-medium[^"\n]*leading-\[1\.25\]/);
  assert.match(source, /className="[^"]*h-px[^"]*"[\s\S]{0,120}var\(--glass-divider\)/);
  assert.match(categoryBlock, /min-w-0[^"\n]*truncate/);
  assert.match(categoryBlock, /color:\s*"var\(--tint-color\)"/);
  assert.doesNotMatch(categoryBlock, /\b(?:bg-|border|rounded-|p[xy]-)|background:/);
  assert.match(timeTag, /className="[^"]*shrink-0[^"]*text-text-tertiary/);
  assert.match(viewsTag, /className="[^"]*shrink-0[^"]*text-text-tertiary/);
  assert.match(arrowTag, /aria-hidden="true"/);
  assert.match(eyeTag, /aria-hidden="true"/);
  assert.doesNotMatch(postLinkClass, /\bborder(?:-|\b)/);
  assert.ok((source.match(/whileHover="hover"/g) ?? []).length >= 2);
  assert.ok((source.match(/whileFocus="hover"/g) ?? []).length >= 2);
  assert.ok((source.match(/focus-visible:outline-2/g) ?? []).length >= 2);
  assert.ok((source.match(/min-h-11/g) ?? []).length >= 2);
  assert.match(source, /type:\s*"spring"/);
  assert.match(source, /rest:\s*\{\s*color:\s*"var\(--text-tertiary\)"\s*,\s*transition:\s*feedbackSpring/);
  assert.match(source, /rest:\s*\{\s*opacity:\s*0\.52\s*,\s*transition:\s*feedbackSpring/);
  assert.match(source, /rest:\s*\{\s*opacity:\s*0\s*,\s*transition:\s*feedbackSpring/);
  assert.match(source, /var\(--glass-inner-bg\)/);
  assert.match(source, /h-\[15px\][\s\S]*h-3/);
  assert.match(source, /key=\{i\} className="[^"]*-mx-2[^"]*px-3/);
  assert.doesNotMatch(source, /hover:border|group-hover:text-tint|transition-|duration-|animate-pulse/);
  assert.doesNotMatch(source, /whileHover=\{\{[\s\S]*?(?:x|scale):/);
});

test("blog and hardware content colors use semantic theme tokens", () => {
  const blogSource = readFileSync(new URL("src/components/blog-card.tsx", projectRoot), "utf8");
  const hardwareSource = readFileSync(new URL("src/components/hardware-card.tsx", projectRoot), "utf8");

  assert.doesNotMatch(
    blogSource,
    /color:\s*"var\(--text-tertiary\)"\s*,\s*opacity:/,
    "Expected Blog metadata to use the semantic tertiary color without stacking opacity",
  );
  assert.match(blogSource, /ml-auto[^"\n]*text-text-tertiary/);

  assert.doesNotMatch(
    hardwareSource,
    /#[0-9a-f]{6}/i,
    "Expected Hardware category colors to come from centralized CSS variables",
  );
  for (const token of [
    "system-blue-rgb",
    "system-green-rgb",
    "system-orange-rgb",
    "system-purple-rgb",
    "system-red-rgb",
    "system-mint-rgb",
  ]) {
    assert.match(hardwareSource, new RegExp(`--${token}`));
  }
  assert.match(hardwareSource, /\bWatch\b/);
  assert.match(hardwareSource, /const ACCENT_RGB:\s*Record<SystemAccent, string>/);
  assert.doesNotMatch(hardwareSource, /borderColor|color-mix/);
});

test("dense list cards avoid directional hover shifts and decorative hover arrows", () => {
  const projectsSource = readFileSync(new URL("src/components/projects-card.tsx", projectRoot), "utf8");
  const blogSource = readFileSync(new URL("src/components/blog-card.tsx", projectRoot), "utf8");

  assert.doesNotMatch(projectsSource, /whileHover=\{\{\s*x:/, "Expected project rows not to slide horizontally on hover");
  assert.doesNotMatch(projectsSource, /Left tint accent/, "Expected project rows not to add a decorative hover-only accent rail");
  assert.doesNotMatch(blogSource, /group-hover:translate-x/, "Expected blog rows not to reveal sliding hover arrows");
  assert.doesNotMatch(blogSource, /whileHover=\{\{\s*backgroundColor:/, "Expected blog rows to use CSS hover styling");
});

test("project links use a spring material hover without chip styling", () => {
  const source = readFileSync(new URL("src/components/projects-card.tsx", projectRoot), "utf8");

  assert.match(source, /motion\.a/);
  assert.match(source, /whileHover="hover"/);
  assert.match(source, /type:\s*"spring"/);
  assert.ok((source.match(/transition:\s*hoverSpring/g) ?? []).length >= 4);
  assert.match(source, /var\(--glass-inner-bg\)/);
  assert.match(source, /text-\[22px\][^"\n]*font-\[650\]/);
  assert.doesNotMatch(source, /whileHover=\{\{[\s\S]*?(?:x|scale):/);
  assert.doesNotMatch(source, /hover:border|group-hover:text-tint|transition-|rounded-md\s+border/);
});

test("profile hero text can wrap inside narrow mobile cards", () => {
  const source = readFileSync(new URL("src/components/profile-card.tsx", projectRoot), "utf8");

  assert.match(source, /break-words/, "Expected ProfileCard headline and title to opt into wrapping");
  assert.match(source, /w-full/, "Expected ProfileCard info column to fill the mobile card content width");
  assert.match(source, /Typewriter[\s\S]*className="[^"]*max-w-full/, "Expected Typewriter text to stay within the mobile card width");
});
