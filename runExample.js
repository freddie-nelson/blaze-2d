const { spawn, exec } = require("child_process");
const { existsSync, createReadStream } = require("fs");
const { createServer } = require("http");
const { extname, resolve } = require("path");
const path = require("path");

const example = process.argv[2];
if (!example) {
  console.log("Usage: npm run example:serve [name]");
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

const build = spawn("webpack", ["--watch", "--config", "webpack.config.js"], { cwd: dir });

build.stdout.on("data", (data) => {
  console.log(data.toString());
});

build.stderr.on("data", (data) => {
  console.log("Error: Failed to run example.", data.toString());
  process.exit(1);
});

// serve html
const public = path.resolve(dir, "build");
const liveServer = require("live-server");

const params = {
  port: 5050,
  root: public,
  file: "index.html",
  wait: 1000,
};
liveServer.start(params);
