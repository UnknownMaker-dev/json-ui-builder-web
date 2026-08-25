import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  /**
   * O GitHub Pages serve o projeto em /<nome-do-repo>/, não na raiz do domínio.
   * `BASE` é definido pelo workflow de publicação; localmente fica "/".
   */
  base: process.env.BASE ?? "/",
});
