import { createApp } from "vue";
import App from "./App.vue";

import "@/styles/reset.css";
import "@/styles/variable.css";
import "@/styles/theme.css";

import { router } from "@/router";
import { initializeTheme } from "@/services/theme";
import { store } from "@/stores";

initializeTheme();

createApp(App)
  .use(store)
  .use(router)
  .mount("#app");
