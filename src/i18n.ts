import { watch } from 'vue';
import { createI18n } from 'vue-i18n';
import it from './locales/it.json';
import en from './locales/en.json';

const storageKey = 'gtt:language';
let savedLanguage: string | null = null;
try { savedLanguage = localStorage.getItem(storageKey); } catch { /* Use Italian when storage is unavailable. */ }

export const i18n = createI18n({
  legacy: false,
  locale: savedLanguage === 'en' ? 'en' : 'it',
  fallbackLocale: 'it',
  messages: { it, en },
});

watch(i18n.global.locale, (language) => {
  document.documentElement.lang = language;
  try { localStorage.setItem(storageKey, language); } catch { /* Language still changes for this session. */ }
}, { immediate: true });
