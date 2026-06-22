import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useSystemStore = defineStore("system", () => {
  const appVersion = ref(__APP_VERSION__);

  const appVersionText = computed(() => `v${appVersion.value}`);

  return {
    appVersion,
    appVersionText,
  };
});
