import "@fontsource/barlow/latin-600.css";
import "@fontsource/barlow/latin-700.css";
import "@fontsource/barlow/latin-800.css";
import { createApp } from "vue";
import App from "./App.vue";
import GttButton from "./components/generic/GttButton.vue";
import GttModal from "./components/generic/GttModal.vue";
import "./composables/useLanguage";
import { i18n } from "./i18n";
import router from "./router/index.ts";
import { startFirestoreSync } from "./services/firestoreSync";
import { startSharedWorkouts } from "./services/sharedWorkout";
import { startPresence } from "./services/presence";
import "./style.css";
import "./wavebinder";

startFirestoreSync();
startPresence();
startSharedWorkouts();
createApp(App)
  .component("GttButton", GttButton)
  .component("GttModal", GttModal)
  .use(router)
  .use(i18n)
  .mount("#app");
