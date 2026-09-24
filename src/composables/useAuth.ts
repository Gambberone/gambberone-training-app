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
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase';

const allowedPhotoTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const maxPhotoSize = 5 * 1024 * 1024;
const maxStoredPhotoLength = 250_000;

const currentUser = ref<User | null>(null);
const profilePhoto = ref<string | null>(null);
const isAuthReady = ref(false);
let stopProfilePhotoListener: (() => void) | undefined;
const profilePhotoDocument = (userId: string) => doc(db, 'users', userId, 'settings', 'profile');

async function resizeProfilePhoto(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    const scale = Math.min(1, 256 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Unable to process photo');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.82);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export const authReady = new Promise<void>((resolve) => {
  onAuthStateChanged(auth, (user) => {
    stopProfilePhotoListener?.();
    profilePhoto.value = null;
    currentUser.value = user;
    isAuthReady.value = true;
    resolve();
    if (user) {
      stopProfilePhotoListener = onSnapshot(
        profilePhotoDocument(user.uid),
        (snapshot) => {
          const photo = snapshot.data()?.photoDataUrl;
          profilePhoto.value = typeof photo === 'string' ? photo : null;
        },
        (error) => console.error('Unable to load profile photo', error),
      );
    }
  });
});

export function useAuth() {
  const isAuthenticated = computed(() => currentUser.value !== null);

  return {
    currentUser: readonly(currentUser),
    profilePhoto: readonly(profilePhoto),
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
    updateProfilePhoto: async (file: File) => {
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user');
      if (!allowedPhotoTypes.has(file.type)) throw new Error('Invalid photo type');
      if (file.size > maxPhotoSize) throw new Error('Photo too large');

      const photoDataUrl = await resizeProfilePhoto(file);
      if (photoDataUrl.length > maxStoredPhotoLength) throw new Error('Processed photo too large');
      await setDoc(profilePhotoDocument(user.uid), { photoDataUrl }, { merge: true });
      profilePhoto.value = photoDataUrl;
    },
    removeProfilePhoto: async () => {
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user');
      await setDoc(profilePhotoDocument(user.uid), { photoDataUrl: null }, { merge: true });
      profilePhoto.value = null;
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
