const { spawn } = require("child_process");
const { existsSync } = require("fs");
const path = require("path");

const example = process.argv[2];
if (!example) {
  console.log("Usage: npm run example:build [name]");
  process.exit(1);
}

const dir = path.resolve(__dirname, `examples/${example}`);
if (!existsSync(dir)) {
  console.log(`Error: ${example} is not a valid example.`);
  process.exit(1);
}

const conf = path.resolve(dir, "webpack.config.js");
if (!existsSync(conf)) {
  console.log(`Error: Could not find webpack config at ${conf}.`);
  process.exit(1);
}

const build = spawn("webpack", ["--config", conf]);

build.stdout.on("data", (data) => {
  console.log(data.toString());
});

build.stderr.on("data", (data) => {
  console.log("Error: Failed to build example.", data.toString());
  process.exit(1);
});
