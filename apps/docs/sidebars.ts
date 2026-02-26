import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  mainSidebar: [
    "intro",
    {
      type: "category",
      label: "Getting Started",
      collapsed: false,
      items: [
        "getting-started/installation",
        "getting-started/quick-start",
      ],
    },
    {
      type: "category",
      label: "Core Concepts",
      items: [
        "core-concepts/overview",
        "core-concepts/generation",
        "core-concepts/validation",
      ],
    },
    {
      type: "category",
      label: "CLI Reference",
      items: [
        "cli-reference/generate",
        "cli-reference/validate",
        "cli-reference/screenshots",
      ],
    },
    {
      type: "category",
      label: "Examples",
      items: ["examples/todo-app"],
    },
  ],
};

export default sidebars;
