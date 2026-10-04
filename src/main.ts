import { createApp } from "vue";
import App from "./App.vue";
import GttButton from "./components/generic/GttButton.vue";
import GttModal from "./components/generic/GttModal.vue";
import "./composables/useLanguage";
import { i18n } from "./i18n";
import router from "./router/index.ts";
import { startFirestoreSync } from "./services/firestoreSync";
import { startPresence } from "./services/presence";
import "./style.css";
import "./wavebinder";

startFirestoreSync();
startPresence();
createApp(App)
  .component("GttButton", GttButton)
  .component("GttModal", GttModal)
  .use(router)
  .use(i18n)
  .mount("#app");
