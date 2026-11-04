import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests',use:{baseURL:'http://localhost:4175'},webServer:{command:'npm run dev -- --port 4175 --strictPort',url:'http://localhost:4175',reuseExistingServer:false}});
