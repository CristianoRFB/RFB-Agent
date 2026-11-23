import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import {cloudflare} from "@cloudflare/vite-plugin";

// Browser/Emulator stays local in ordinary development; Cloudflare plugin
// generates structured Build Output for an explicitly selected staging mode.
export default defineConfig(({mode})=>({
  plugins:[react(),...(mode==="staging"?[cloudflare()]:[])],
  server:{host:"127.0.0.1",port:5173},
  build:{outDir:"dist",sourcemap:false}
}));
