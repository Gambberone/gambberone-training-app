import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { readonly, ref } from 'vue';
import { auth, db } from '@/firebase';
import { i18n } from '@/i18n';

const isLanguageReady = ref(false);
const isSavingLanguage = ref(false);
const languageError = ref(false);
let unsubscribe: (() => void) | undefined;
const languageDocument = (uid: string) => doc(db, 'users', uid, 'settings', 'preferences');

onAuthStateChanged(auth, (user) => {
  unsubscribe?.();
  isLanguageReady.value = false;
  languageError.value = false;
  if (!user) {
    i18n.global.locale.value = 'it';
    return;
  }
  unsubscribe = onSnapshot(languageDocument(user.uid), (snapshot) => {
    if (auth.currentUser?.uid !== user.uid) return;
    i18n.global.locale.value = snapshot.data()?.language === 'en' ? 'en' : 'it';
    isLanguageReady.value = true;
    languageError.value = false;
  }, () => {
    if (auth.currentUser?.uid !== user.uid) return;
    languageError.value = true;
  });
});

async function changeLanguage(language: string) {
  const user = auth.currentUser;
  if (!user || !isLanguageReady.value || isSavingLanguage.value || (language !== 'it' && language !== 'en')) return;
  const previous = i18n.global.locale.value;
  isSavingLanguage.value = true;
  languageError.value = false;
  try {
    await setDoc(languageDocument(user.uid), { language }, { merge: true });
    if (auth.currentUser?.uid === user.uid) i18n.global.locale.value = language;
  } catch {
    if (auth.currentUser?.uid === user.uid) {
      i18n.global.locale.value = previous;
      languageError.value = true;
    }
  } finally {
    isSavingLanguage.value = false;
  }
}

export function useLanguage() {
  return {
    isLanguageReady: readonly(isLanguageReady),
    isSavingLanguage: readonly(isSavingLanguage),
    languageError: readonly(languageError),
    changeLanguage,
  };
}
