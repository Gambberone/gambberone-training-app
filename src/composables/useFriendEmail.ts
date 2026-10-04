import { auth, db } from '@/firebase';
import { useAuth } from './useAuth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { onUnmounted, ref, watch } from 'vue';

export function useFriendEmail() {
  const { currentUser } = useAuth();
  const enabled = ref(false);
  const ready = ref(false);
  const saving = ref(false);
  const error = ref(false);
  let stop: (() => void) | undefined;
  let generation = 0;
  watch(() => currentUser.value?.uid, (uid) => {
    stop?.();
    const version = ++generation;
    enabled.value = false; ready.value = false; error.value = false;
    if (!uid) return;
    stop = onSnapshot(doc(db, 'friendContacts', uid), (snapshot) => {
      if (version !== generation) return;
      enabled.value = typeof snapshot.data()?.email === 'string';
      ready.value = true;
    }, () => { if (version === generation) error.value = true; });
  }, { immediate: true });
  onUnmounted(() => { generation++; stop?.(); });
  async function setEnabled(value: boolean) {
    const user = auth.currentUser;
    if (!user || saving.value || !ready.value) return;
    const version = generation;
    saving.value = true; error.value = false;
    try {
      await setDoc(doc(db, 'friendContacts', user.uid), { email: value ? user.email : null });
      if (version === generation) enabled.value = value;
    } catch { if (version === generation) error.value = true; }
    finally { saving.value = false; }
  }
  return { enabled, ready, saving, error, setEnabled };
}
