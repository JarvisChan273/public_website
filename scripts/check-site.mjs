import { readFileSync } from "node:fs";

const files = {
  index: readFileSync(new URL("../index.html", import.meta.url), "utf8"),
  background: readFileSync(new URL("../background.html", import.meta.url), "utf8"),
  learning: readFileSync(new URL("../learning.html", import.meta.url), "utf8"),
  css: readFileSync(new URL("../styles.css", import.meta.url), "utf8"),
  script: readFileSync(new URL("../script.js", import.meta.url), "utf8"),
};

const failures = [];

function expectIncludes(name, text, needle) {
  if (!text.includes(needle)) failures.push(`${name} is missing ${JSON.stringify(needle)}`);
}

function expectExcludes(name, text, needle) {
  if (text.includes(needle)) failures.push(`${name} unexpectedly contains ${JSON.stringify(needle)}`);
}

expectIncludes("index", files.index, "Information engineering graduate, now studying financial technology and data analytics, with a focus on cybersecurity.");
expectIncludes("index", files.index, 'href="background.html"');
expectIncludes("index", files.index, 'href="learning.html"');
expectIncludes("index", files.index, 'aria-current="page"');
expectIncludes("background", files.background, "City University of Hong Kong");
expectIncludes("background", files.background, "Certified in Cybersecurity (CC)");
expectIncludes("learning", files.learning, "FITE7407");
expectIncludes("learning", files.learning, "CISM");
expectIncludes("learning", files.learning, "Title still open");
expectIncludes("learning", files.learning, "COMP7103 Data mining");
expectIncludes("learning", files.learning, "COMP7409 Machine learning in trading and finance");
expectIncludes("learning", files.learning, "FITE7409 Blockchain and cryptocurrency");
expectIncludes("css", files.css, "focus-visible");
expectIncludes("css", files.css, "max-width: 40rem");
expectIncludes("script", files.script, "aria-current");

for (const [name, text] of Object.entries(files)) {
  if (name === "css" || name === "script") continue;
  expectExcludes(name, text, "past paper");
  expectExcludes(name, text, "consulting");
  expectExcludes(name, text, "@");
  expectIncludes(name, text, 'href="styles.css"');
  expectIncludes(name, text, 'src="script.js"');
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("static site checks passed");
