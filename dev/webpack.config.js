const path = require("path");

module.exports = {
  target: "web",
  mode: "development",
  // stats: "none",
  entry: {
    main: "./dev/main.ts",
  },
  output: {
    path: __dirname,
    filename: "[name].js",
    publicPath: "",
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    modules: ["../node_modules"],
  },
  devtool: "inline-source-map",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        exclude: /node_modules/,
        // options: {
        //   silent: true,
        // },
      },
    ],
  },
};
