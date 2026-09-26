import { createApp } from 'vue';
import './style.css';
import './wavebinder';
import App from './App.vue';
import { i18n } from './i18n';
import './composables/useLanguage';
import router from './router/index.ts';
import { startFirestoreSync } from './services/firestoreSync';

startFirestoreSync();
createApp(App).use(router).use(i18n).mount('#app');
