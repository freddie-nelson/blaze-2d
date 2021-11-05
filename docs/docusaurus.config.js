// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Blaze",
  tagline: "A fast and simple WebGL 2 voxel game engine written in TypeScript",
  url: "https://your-docusaurus-test-site.com",
  baseUrl: process.env.NODE_ENV === "development" ? "/docs/build/" : "/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.ico",
  organizationName: "Freddie Nelson", // Usually your GitHub org/user name.
  projectName: "blaze", // Usually your repo name.

  presets: [
    [
      "@docusaurus/preset-classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          // Please change this to your repo.
          editUrl: "https://github.com/facebook/docusaurus/edit/main/website/",
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: "Blaze",
        logo: {
          alt: "Blaze Logo",
          src: "img/logo.svg",
        },
        items: [
          {
            type: "doc",
            docId: "api/index",
            position: "left",
            label: "API",
          },
          {
            href: "https://github.com/freddie-nelson/blaze",
            label: "GitHub",
            position: "right",
          },
        ],
      },
      footer: {
        style: "dark",
        links: [
          {
            title: "Docs",
            items: [
              {
                label: "API",
                to: "/docs/api",
              },
            ],
          },
          // {
          //   title: "Community",
          //   items: [
          //     {
          //       label: "Stack Overflow",
          //       href: "https://stackoverflow.com/questions/tagged/docusaurus",
          //     },
          //     {
          //       label: "Discord",
          //       href: "https://discordapp.com/invite/docusaurus",
          //     },
          //     {
          //       label: "Twitter",
          //       href: "https://twitter.com/docusaurus",
          //     },
          //   ],
          // },
          {
            title: "More",
            items: [
              {
                label: "GitHub",
                href: "https://github.com/freddie-nelson/blaze",
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Freddie Nelson, Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),

  plugins: [
    require.resolve("@cmfcmf/docusaurus-search-local"),

    [
      "docusaurus-plugin-typedoc",

      // Plugin / TypeDoc options
      {
        entryPoints: ["../src/"],
        entryPointStrategy: "expand",
        tsconfig: "../tsconfig.json",
        plugin: ["typedoc-plugin-rename-defaults"],
      },
    ],
  ],
};

module.exports = config;
