const path = require("path");

module.exports = {
  target: "web",
  mode: "development",
  // stats: "none",
  entry: {
    main: "./src/main.ts",
  },
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "[name].js",
    publicPath: "",
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    modules: ["./node_modules"],
    alias: {
      "@blz": path.resolve(__dirname, "../../lib/src"),
      "@helpers": path.resolve(__dirname, "../_helpers"),
    },
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
