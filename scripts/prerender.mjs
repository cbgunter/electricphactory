import { build } from "vite";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

async function prerender() {
  // Build an SSR bundle for the entry-server
  await build({
    root,
    logLevel: "warn",
    build: {
      ssr: "src/entry-server.jsx",
      outDir: "dist/server",
      rollupOptions: {
        output: { format: "esm" },
      },
    },
  });

  // Import the built SSR bundle (Node.js ESM — picks .mjs for all deps)
  // Use pathToFileURL for Windows compatibility
  const ssrEntry = path.join(root, "dist", "server", "entry-server.js");
  const { render } = await import(new URL(`file://${ssrEntry.replace(/\\/g, "/")}`))

  const template = readFileSync(path.join(root, "dist", "index.html"), "utf-8");
  const appHtml = render("/");
  const html = template.replace(
    '<div id="root"></div>',
    `<div id="root">${appHtml}</div>`
  );

  writeFileSync(path.join(root, "dist", "index.html"), html);
  console.log("✓ Prerendered /");
}

prerender().catch((err) => {
  console.error("Prerender failed:", err);
  process.exit(1);
});
