const { execSync } = require("child_process");
const { existsSync, readdirSync, lstatSync } = require("fs");
const { resolve } = require("path");

const examplesDir = resolve(__dirname, "./examples");
if (!existsSync(examplesDir)) {
  console.log(`Error: Examples could not be found at ${examplesDir}.`);
  process.exit(1);
}

console.log(`Getting examples in ${examplesDir}...`);
const examples = readdirSync(examplesDir);
console.log(`Found ${examples.length} exampels in ${examplesDir}.`);

console.log(`Building examples...`);
examples.forEach((example) => {
  const p = resolve(examplesDir, example);
  if (!existsSync(p) || !lstatSync(p).isDirectory()) return;

  console.log(`Building ${example}...`);
  execSync(`yarn example:build ${example}`);
  console.log(`Finished building ${example}.`);
});
console.log(`Finished building examples.`);
