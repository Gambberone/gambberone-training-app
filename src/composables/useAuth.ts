import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { computed, readonly, ref, triggerRef } from 'vue';
import { auth } from '@/firebase';

const currentUser = ref<User | null>(null);
const isAuthReady = ref(false);

export const authReady = new Promise<void>((resolve) => {
  onAuthStateChanged(auth, (user) => {
    currentUser.value = user;
    isAuthReady.value = true;
    resolve();
  });
});

export function useAuth() {
  const isAuthenticated = computed(() => currentUser.value !== null);

  return {
    currentUser: readonly(currentUser),
    isAuthenticated,
    isAuthReady: readonly(isAuthReady),
    signIn: (email: string, password: string) => signInWithEmailAndPassword(auth, email, password),
    register: (email: string, password: string) => createUserWithEmailAndPassword(auth, email, password),
    sendVerificationEmail: (user: User = auth.currentUser!) =>
      sendEmailVerification(user, {
        url: `${window.location.origin}/auth/verify-email`,
        handleCodeInApp: true,
      }),
    resetPassword: (email: string) =>
      sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/auth/login`,
      }),
    updateDisplayName: async (displayName: string) => {
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user');
      await updateProfile(user, { displayName });
      currentUser.value = user;
      triggerRef(currentUser);
    },
    signOut: () => signOut(auth),
  };
}

export function authErrorMessage(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? error.code : undefined;

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Email o password non corretti.';
    case 'auth/email-already-in-use':
      return 'Esiste già un account associato a questa email.';
    case 'auth/weak-password':
      return 'La password deve contenere almeno 6 caratteri.';
    case 'auth/invalid-email':
      return 'Inserisci un indirizzo email valido.';
    case 'auth/too-many-requests':
      return 'Troppi tentativi. Attendi qualche minuto e riprova.';
    case 'auth/invalid-action-code':
      return 'Questo link non è più valido. Richiedi una nuova email di verifica.';
    default:
      return 'Qualcosa non ha funzionato. Riprova tra poco.';
  }
}
