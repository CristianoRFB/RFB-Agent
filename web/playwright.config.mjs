import {defineConfig} from "@playwright/test";
export default defineConfig({
 testDir:"./tests",timeout:30000,retries:0,workers:1,reporter:"list",
 use:{baseURL:"http://127.0.0.1:5173",trace:"retain-on-failure"},
 webServer:{command:"npm run dev --prefix web -- --host 127.0.0.1",url:"http://127.0.0.1:5173",reuseExistingServer:false,timeout:30000,env:{VITE_USE_FIREBASE_EMULATORS:"true"}}
});
