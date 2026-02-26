import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  todoSidebar: [
    {
      type: "doc",
      id: "index",
      label: "Overview",
    },
    {
      type: "doc",
      id: "user-guide",
      label: "User Guide ✦",
    },
    {
      type: "category",
      label: "API",
      collapsed: false,
      items: [
        { type: "doc", id: "api/store", label: "Store" },
        { type: "doc", id: "api/types", label: "Types" },
      ],
    },
    {
      type: "category",
      label: "Frontend",
      items: [
        { type: "doc", id: "ui/App", label: "App" },
        { type: "doc", id: "ui/api", label: "HTTP Client" },
      ],
    },
  ],
};

export default sidebars;
