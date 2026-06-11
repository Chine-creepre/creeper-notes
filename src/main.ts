import { createApp } from "vue";
import App from "./App.vue";

import "./styles/reset.css";

import { router } from "@/router";
import { store } from "@/stores";

createApp(App)
  .use(store)
  .use(router)
  .mount("#app");
