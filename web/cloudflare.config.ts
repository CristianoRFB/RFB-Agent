// RFB Method: Cloudflare cf CLI 1.0 release-candidate configuration.
// This config is inert by default. No assets deployed and no billing enabled.
import {bindings,defineConfig} from "cf/config";
import * as entrypoint from "../worker/index.mjs" with {type:"cf-worker"};

export default defineConfig({
 worker:{
  name:"rfb-agent-staging",
  entrypoint,
  compatibilityDate:"2026-11-23",
  env:{
   // Worker API requires both gating values + secrets. The generated build is
   // intentionally FAIL-CLOSED, even if accidentally served online.
   RFB_WORKER_ENABLED:bindings.text("false"),
   RFB_API_ENV:bindings.text("staging")
  }
 }
});
