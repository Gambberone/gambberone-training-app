import { selectLocalDataOwner } from "./localRef";
import { auth, db } from "@/firebase";
import { tr } from "@/localization";
import {
  deleteAccountData,
  resetDeletedAccountData,
} from "@/services/firestoreSync";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { computed, readonly, ref, triggerRef } from "vue";

const allowedPhotoTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxPhotoSize = 5 * 1024 * 1024;
const maxStoredPhotoLength = 250_000;

const currentUser = ref<User | null>(null);
const profilePhoto = ref<string | null>(null);
const isAuthReady = ref(false);
let stopProfilePhotoListener: (() => void) | undefined;
const profilePhotoDocument = (userId: string) =>
  doc(db, "users", userId, "settings", "profile");

async function resizeProfilePhoto(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    const scale = Math.min(
      1,
      256 / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Unable to process photo");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export const authReady = new Promise<void>((resolve) => {
  onAuthStateChanged(auth, (user) => {
    stopProfilePhotoListener?.();
    profilePhoto.value = null;
    selectLocalDataOwner(user?.uid ?? null);
    currentUser.value = user;
    isAuthReady.value = true;
    resolve();
    if (user) {
      void setDoc(
        doc(db, "publicProfiles", user.uid),
        {
          displayName: user.displayName || user.uid,
        },
        { merge: true },
      ).catch((error) =>
        console.error("Unable to publish public profile", error),
      );
      stopProfilePhotoListener = onSnapshot(
        profilePhotoDocument(user.uid),
        (snapshot) => {
          const photo = snapshot.data()?.photoDataUrl;
          profilePhoto.value = typeof photo === "string" ? photo : null;
        },
        (error) => console.error("Unable to load profile photo", error),
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
    signIn: (email: string, password: string) =>
      signInWithEmailAndPassword(auth, email, password),
    register: (email: string, password: string) =>
      createUserWithEmailAndPassword(auth, email, password),
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
      if (!user) throw new Error("No authenticated user");
      await updateProfile(user, { displayName });
      selectLocalDataOwner(user?.uid ?? null);
    currentUser.value = user;
      triggerRef(currentUser);
      await setDoc(
        doc(db, "publicProfiles", user.uid),
        { displayName },
        { merge: true },
      );
    },
    updateProfilePhoto: async (file: File) => {
      const user = auth.currentUser;
      if (!user) throw new Error("No authenticated user");
      if (!allowedPhotoTypes.has(file.type))
        throw new Error("Invalid photo type");
      if (file.size > maxPhotoSize) throw new Error("Photo too large");

      const photoDataUrl = await resizeProfilePhoto(file);
      if (photoDataUrl.length > maxStoredPhotoLength)
        throw new Error("Processed photo too large");
      await setDoc(
        profilePhotoDocument(user.uid),
        { photoDataUrl },
        { merge: true },
      );
      profilePhoto.value = photoDataUrl;
    },
    removeProfilePhoto: async () => {
      const user = auth.currentUser;
      if (!user) throw new Error("No authenticated user");
      await setDoc(
        profilePhotoDocument(user.uid),
        { photoDataUrl: null },
        { merge: true },
      );
      profilePhoto.value = null;
    },
    changePassword: async (currentPassword: string, newPassword: string) => {
      const user = auth.currentUser;
      if (!user?.email) throw new Error("No authenticated user");
      await reauthenticateWithCredential(
        user,
        EmailAuthProvider.credential(user.email, currentPassword),
      );
      await updatePassword(user, newPassword);
    },
    deleteAccount: async (password: string) => {
      const user = auth.currentUser;
      if (!user?.email) throw new Error("No authenticated user");
      await reauthenticateWithCredential(
        user,
        EmailAuthProvider.credential(user.email, password),
      );
      await deleteAccountData(user.uid);
      {
        const { collection, getDocs, query, where, writeBatch } =
          await import("firebase/firestore");
        const matches = await getDocs(
          query(
            collection(db, "friendships"),
            where("participants", "array-contains", user.uid),
          ),
        );
        for (let offset = 0; offset < matches.docs.length; offset += 400) {
          const batch = writeBatch(db);
          matches.docs
            .slice(offset, offset + 400)
            .forEach((item) => batch.delete(item.ref));
          await batch.commit();
        }
      }
      const { deleteDoc } = await import("firebase/firestore");
      const {
        collection: presenceCollection,
        getDocs: presenceDocs,
        writeBatch: presenceBatch,
      } = await import("firebase/firestore");
      await setDoc(doc(db, "friendPresence", user.uid), { enabled: false });
      const sessions = await presenceDocs(
        presenceCollection(db, "friendPresence", user.uid, "sessions"),
      );
      for (let offset = 0; offset < sessions.docs.length; offset += 400) {
        const batch = presenceBatch(db);
        sessions.docs
          .slice(offset, offset + 400)
          .forEach((item) => batch.delete(item.ref));
        await batch.commit();
      }
      await deleteDoc(doc(db, "friendPresence", user.uid));
      await deleteDoc(doc(db, "friendContacts", user.uid));
      await deleteDoc(doc(db, "publicProfiles", user.uid));
      resetDeletedAccountData();
      await deleteUser(user);
    },
    signOut: () => signOut(auth),
  };
}

export function authErrorMessage(error: unknown) {
  const code =
    typeof error === "object" && error && "code" in error
      ? error.code
      : undefined;

  switch (code) {
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return tr("ui.incorrect_email_or_password");
    case "auth/email-already-in-use":
      return tr("ui.an_account_with_this_email_already_exists");
    case "auth/weak-password":
      return tr("ui.password_must_contain_at_least_6_characters");
    case "auth/invalid-email":
      return tr("ui.enter_a_valid_email_address");
    case "auth/too-many-requests":
      return tr("ui.too_many_attempts_wait_a_few_minutes_and_try_again");
    case "auth/invalid-action-code":
      return tr(
        "ui.this_link_is_no_longer_valid_request_another_verification_email",
      );
    default:
      return tr("ui.something_went_wrong_try_again_shortly");
  }
}
