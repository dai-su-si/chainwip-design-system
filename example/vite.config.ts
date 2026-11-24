// example/ の開発サーバー。chainwip-design-system の部品だけで画面を組めるかを確かめるための、最小のアプリ。
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [react()],
  resolve: {
    // 使う側と同じく、パッケージの名前で読む（src/index.ts）
    alias: { "chainwip-design-system": fileURLToPath(new URL("../src/index.ts", import.meta.url)) },
  },
  server: { port: 5120, strictPort: true },
});
