import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "Duck",
  tagline: "AI-powered documentation that stays in sync with your code.",
  favicon: "img/favicon.ico",

  url: "https://orcha-new.westeurope.cloudapp.azure.com",
  baseUrl: "/duck/",

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          routeBasePath: "docs",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    // Local search (offline, no Algolia needed)
    [
      require.resolve("@easyops-cn/docusaurus-search-local"),
      {
        hashed: true,
        language: ["en"],
        indexBlog: false,
        docsRouteBasePath: ["/docs", "/todo"],
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
      },
    ],
    // Second docs instance: generated output for the todo app
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "todo",
        path: "../../apps/todo/docs/agent",
        routeBasePath: "todo",
        sidebarPath: "./sidebars-todo.ts",
      },
    ],
  ],

  themeConfig: {
    image: "img/duck-social.png",
    colorMode: {
      defaultMode: "light",
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: "Duck",
      logo: {
        alt: "Duck logo",
        src: "img/duck.svg",
        srcDark: "img/duck-dark.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "mainSidebar",
          position: "left",
          label: "Docs",
        },
        {
          type: "docSidebar",
          sidebarId: "todoSidebar",
          docsPluginId: "todo",
          position: "left",
          label: "Todo App ✦",
        },
        {
          href: "https://github.com/your-org/duck",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Duck Docs",
          items: [
            { label: "Getting Started", to: "/docs/getting-started/installation" },
            { label: "CLI Reference", to: "/docs/cli-reference/generate" },
            { label: "Core Concepts", to: "/docs/core-concepts/overview" },
          ],
        },
        {
          title: "Generated App Docs",
          items: [
            { label: "Todo App — Overview", to: "/todo" },
            { label: "Store", to: "/todo/api/store" },
            { label: "Types", to: "/todo/api/types" },
          ],
        },
        {
          title: "Community",
          items: [
            { label: "GitHub", href: "https://github.com/your-org/duck" },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Duck. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["bash", "yaml", "typescript", "json"],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
