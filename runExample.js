const { spawn, exec } = require("child_process");
const { existsSync, createReadStream } = require("fs");
const { createServer } = require("http");
const { extname, resolve } = require("path");
const path = require("path");

const example = process.argv[2];
if (!example) {
  console.log("Usage: npm run example::serve [name]");
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

const build = spawn("webpack", ["--watch", "--config", conf]);

build.stdout.on("data", (data) => {
  console.log(data.toString());
});

build.stderr.on("data", (data) => {
  console.log("Error: Failed to run example.", data.toString());
  process.exit(1);
});

// serve html
const public = path.resolve(dir, "build");

const port = 5050;
const server = createServer((req, res) => {
  let file = `.${req.url}`;
  if (file === "./") {
    file = "./index.html";
  }

  file = resolve(public, file);

  const ext = extname(file);
  let type = "text/html";

  switch (ext) {
    case ".js":
      type = "text/javascript";
      break;
    case ".css":
      type = "text/css";
      break;
    case ".json":
      type = "application/json";
      break;
    case ".png":
      type = "image/png";
      break;
    case ".jpg":
      type = "image/jpg";
      break;
  }

  res.writeHead(200, { "content-type": type });

  if (existsSync(file)) {
    createReadStream(file).pipe(res);
  }
});

server.listen(port);

const url = `http://localhost:${port}`;
const start = process.platform == "darwin" ? "open" : process.platform == "win32" ? "start" : "xdg-open";
exec(start + " " + url);
