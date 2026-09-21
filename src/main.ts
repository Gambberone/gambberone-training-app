import { createApp } from 'vue';
import './style.css';
import './wavebinder';
import App from './App.vue';
import router from './router/index.ts';
import { startFirestoreSync } from './services/firestoreSync';

startFirestoreSync();
createApp(App).use(router).mount('#app');
