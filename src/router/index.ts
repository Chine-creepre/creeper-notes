import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "Bootstrap",
    component: () => import("@/views/Bootstrap/index.vue"),
  },
  {
    path: "/search",
    name: "Search",
    component: () => import("@/views/Search/index.vue"),
  },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
