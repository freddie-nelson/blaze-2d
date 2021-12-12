const path = require("path");
const fs = require("fs");

// replace css imports with string injection in typescript output
const lib = path.resolve(__dirname, "lib/src");

function fileID() {
  const length = 5;
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }

  return result;
}

function injectCSSString(file) {
  const cssSource = fs.readFileSync(file, "utf-8").replace(/\s/g, "");
  const name = `${path.basename(file, path.extname(file))}_${fileID()}`;

  return `
  const ${name} = document.createElement("style");
  ${name}.textContent = \`${cssSource}\`;
  document.head.appendChild(${name});
  `;
}

function replaceCSS(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    if (fs.lstatSync(path.resolve(dir, file)).isDirectory()) {
      replaceCSS(path.resolve(dir, file));
    } else if (file.endsWith(".js")) {
      let text = fs.readFileSync(path.resolve(dir, file), "utf-8");
      const cssImportRegex = /import ("(.*).css");/g;
      const matches = text.match(cssImportRegex);
      if (!matches) continue;

      matches.forEach((m) => {
        const p = m.match(/"(.*)"/)[0];
        let file = path.resolve(dir, p.substring(1, p.length - 1));
        file = file.replace("/lib", "");

        const injectString = injectCSSString(file);
        text = text.replace(m, injectString);

        console.log(`Replaced css import ('${file}') with style tag inject.`);
      });

      fs.writeFileSync(path.resolve(dir, file), text);
    }
  }
}

replaceCSS(lib);
