import {defineConfig,devices} from '@playwright/test';
const port=Number(process.env.PLAYWRIGHT_PORT||4321);
export default defineConfig({testDir:'./tests',fullyParallel:true,use:{baseURL:`http://127.0.0.1:${port}`},webServer:{command:`npm run build && npx astro preview --host 127.0.0.1 --port ${port} --ignore-lock`,url:`http://127.0.0.1:${port}`,reuseExistingServer:false},projects:[{name:'chromium',use:{...devices['Desktop Chrome']}},{name:'webkit',use:{...devices['Desktop Safari']}}]});
