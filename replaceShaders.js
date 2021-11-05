const path = require("path");
const fs = require("fs");

// replace shader imports with strings in typescript output
const lib = path.resolve(__dirname, "lib/src");

function replaceShaders(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    if (fs.lstatSync(path.resolve(dir, file)).isDirectory()) {
      replaceShaders(path.resolve(dir, file));
    } else if (file.endsWith(".js")) {
      let text = fs.readFileSync(path.resolve(dir, file), "utf-8");
      const glslImportRegex = /import(.*)from ("(.*).glsl")/g;
      const matches = text.match(glslImportRegex);
      if (!matches) continue;

      matches.forEach((m) => {
        const p = m.match(/"(.*)"/)[0];
        let file = path.resolve(lib, p.substring(1, p.length - 1));
        file = file.replace("/lib", "/src");

        const shaderSource = fs.readFileSync(file, "utf-8");
        let shaderName = m.match(/import (.*) from/)[0];
        shaderName = shaderName.substring("import ".length, shaderName.length - " from".length);

        const variable = `const ${shaderName} = \`${shaderSource}\``;
        text = text.replace(m, variable);

        console.log(`Replaced shader import of ${shaderName} in ${file} with source.`);
      });

      fs.writeFileSync(path.resolve(dir, file), text);
    }
  }
}

replaceShaders(lib);
