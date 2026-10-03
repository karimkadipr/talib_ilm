import { defineConfig } from "i18next-cli";

export default defineConfig({
  locales: ["en", "fr", "ar"],
  extract: {
    input: "app/**/*.{js,jsx,ts,tsx}",
    output: "app/locales/{{language}}/namespaces/{{namespace}}.ts",
    outputFormat: "ts",
    removeUnusedKeys: true,
    keySeparator: false,
    defaultNS: "common",
    transComponents: ["Trans", "Translation"],
  },

  lint: {
    ignoredAttributes: ["data-testid", "aria-label"],
  },
});
