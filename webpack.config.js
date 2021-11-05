const { exec } = require("child_process");
const path = require("path");

module.exports = {
  target: "web",
  mode: "production",
  entry: {
    blaze: "./src/blaze.ts",
  },
  output: {
    path: path.resolve(__dirname, "lib/bundle"),
    publicPath: "/",
    filename: "[name].js",
    library: {
      name: "Blaze",
      type: "umd",
      export: "default",
    },
    publicPath: "/",
    umdNamedDefine: true,
  },
  devtool: "source-map",
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    modules: ["node_modules"],
  },
  plugins: [
    {
      apply: (compiler) => {
        compiler.hooks.afterCompile.tap("ReplaceShadersPlugin", () => {
          console.log("Replacing shader imports...");
          exec("node replaceShaders.js", (err, out) => {
            err ? console.error(err) : console.log(out);
          });
        });
      },
    },
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        exclude: /node_modules/,
        options: {
          projectReferences: true,
        },
      },
      {
        test: /\.glsl$/,
        loader: "raw-loader",
      },
    ],
  },
};
