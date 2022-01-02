const { execSync } = require("child_process");
const { existsSync, readdirSync, lstatSync, mkdirSync, writeFileSync } = require("fs");
const { resolve } = require("path");

console.log(`Building doc pages for examples...`);

const examplesDir = resolve(__dirname, "./examples");
if (!existsSync(examplesDir)) {
  process.exit(1);
}

let examples = readdirSync(examplesDir);

// get built examples
examples = examples.filter((example) => {
  const p = resolve(examplesDir, example);
  if (
    !existsSync(p) ||
    !lstatSync(p).isDirectory() ||
    !existsSync(resolve(examplesDir, example, "build")) ||
    example.startsWith("_")
  )
    return false;

  return true;
});

const buildFolders = examples.map((example) => {
  return resolve(examplesDir, example, "build");
});

// copy builds to docs static pages
for (let i = 0; i < examples.length; i++) {
  const example = examples[i];
  const folder = buildFolders[i];

  const destination = resolve(__dirname, "docs/static/examples", example);
  mkdirSync(destination, { recursive: true });

  execSync(`yarn shx cp -R ${folder}/* ${destination}`);
}

// build doc pages
const urls = examples.map((example) => {
  return resolve("/examples", example);
});

const examplesPath = resolve(__dirname, "docs/docs/examples");
mkdirSync(examplesPath, { recursive: true });

writeFileSync(resolve(examplesPath, "_category_.yml"), `position: 0\nlabel: "Examples"`);
writeFileSync(
  resolve(examplesPath, "index.md"),
  `---
id: "index"
title: "Examples"
slug: "/examples/"
sidebar_label: "Readme"
sidebar_position: 0
---

In this section you will find a collection of small games and demos built with Blaze. Feel free to check them out and use any of their code in one of your own projects.
`,
);

for (let i = 0; i < examples.length; i++) {
  const example = examples[i];
  const url = urls[i];
  const path = resolve(examplesPath, `${example}.md`);

  const header = `---
id: "${example}"
title: "${example}"
slug: "${url}"
sidebar_label: "${example}"
sidebar_position: ${i + 1} 
custom_edit_url: null
---`;

  const content = `
<iframe tabindex="0" title="${example}" width="100%" height="800" src="${url}"></iframe>

<a href="pathname://${url}" style={{marginLeft: "1.5rem", float: "right"}}>View Fullscreen</a>
<a href="https://github.com/freddie-nelson/blaze-2d/tree/master/examples/${example}" style={{float: "right"}}>View Code</a>
`;

  writeFileSync(path, header + content);
}

console.log(`Finished building doc pages for examples.`);
