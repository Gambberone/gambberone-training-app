import { auth, db } from '@/firebase';
import { i18n } from '@/i18n';
import router from '@/router';
import { activeWorkoutSessionRef } from '@/stores/workoutCreator';
import { driver, type Driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { nextTick, readonly, ref, watch } from 'vue';
import { useLanguage } from './useLanguage';

const running = ref(false);
const error = ref(false);
const ready = ref(false);
const seen = ref(true);
let tour: Driver | undefined;
let stopListener: (() => void) | undefined;
let offeredUser: string | undefined;
let navigating = false;
const preferenceDoc = (uid: string) => doc(db, 'users', uid, 'settings', 'onboarding');
const destinations = [
  { name: 'home', selector: '[data-tour="nav-home"]' },
  { name: 'calendar', selector: '[data-tour="nav-calendar"]' },
  { name: 'workouts', selector: '[data-tour="nav-workouts"]' },
  { name: 'workouts', query: { tab: 'exercises' }, selector: '[data-tour-tab="exercises"]' },
  { name: 'history', selector: '[data-tour="nav-history"]' },
];

async function persistSeen(uid: string) {
  try {
    await setDoc(
      preferenceDoc(uid),
      { version: 1, seenAt: new Date().toISOString() },
      { merge: true },
    );
  } catch {
    if (auth.currentUser?.uid === uid) error.value = true;
  }
}

async function startTour() {
  const user = auth.currentUser;
  if (!user || running.value || activeWorkoutSessionRef.value) return;
  error.value = false;
  running.value = true;
  const t = i18n.global.t;
  async function goTo(index: number) {
    if (navigating || !running.value) return;
    if (index >= destinations.length) {
      tour?.destroy();
      return;
    }
    const destination = destinations[index];
    if (!destination) return;
    navigating = true;
    try {
      await router.push({ name: destination.name, query: destination.query });
      await nextTick();
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      if (running.value && auth.currentUser?.uid === user!.uid) {
        if (tour?.isActive()) tour.moveTo(index);
        else tour?.drive(index);
      }
    } catch {
      error.value = true;
      tour?.destroy();
    } finally {
      navigating = false;
    }
  }
  tour = driver({
    animate: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    overlayOpacity: 0.65,
    stagePadding: 8,
    stageRadius: 12,
    disableActiveInteraction: true,
    allowKeyboardControl: false,
    overlayClickBehavior: () => {},
    popoverClass: 'app-tour-popover',
    showProgress: true,
    progressText: t('tour.progress', { current: '{{current}}', total: '{{total}}' }),
    nextBtnText: t('tour.next'),
    prevBtnText: t('tour.previous'),
    doneBtnText: t('tour.done'),
    onNextClick: () => {
      void goTo((tour?.getActiveIndex() ?? 0) + 1);
    },
    onPrevClick: () => {
      void goTo((tour?.getActiveIndex() ?? 0) - 1);
    },
    onCloseClick: () => tour?.destroy(),
    onPopoverRender: (popover) => {
      popover.closeButton.setAttribute('aria-label', t('tour.skip'));
      popover.closeButton.textContent = t('tour.skip');
    },
    onDestroyed: () => {
      running.value = false;
      tour = undefined;
      if (auth.currentUser?.uid === user.uid) {
        seen.value = true;
        void persistSeen(user.uid);
      }
    },
    steps: destinations.map((destination, index) => ({
      element: destination.selector,
      popover: {
        title: t(`tour.steps.${index}.title`),
        description: t(`tour.steps.${index}.description`),
        side: window.matchMedia('(min-width: 1024px)').matches ? 'right' : 'top',
        align: 'center',
      },
    })),
  });
  await goTo(0);
}

export function initializeAppTour() {
  const { isLanguageReady } = useLanguage();
  onAuthStateChanged(auth, (user) => {
    stopListener?.();
    tour?.destroy();
    ready.value = false;
    seen.value = true;
    if (!user) {
      tour?.destroy();
      offeredUser = undefined;
      return;
    }
    stopListener = onSnapshot(
      preferenceDoc(user.uid),
      (snapshot) => {
        if (auth.currentUser?.uid !== user.uid) return;
        seen.value = snapshot.data()?.version >= 1;
        ready.value = true;
      },
      () => {
        error.value = true;
      },
    );
  });
  watch(
    [ready, seen, isLanguageReady, () => router.currentRoute.value.name, activeWorkoutSessionRef],
    () => {
      const user = auth.currentUser;
      if (
        !user?.emailVerified ||
        !ready.value ||
        seen.value ||
        !isLanguageReady.value ||
        running.value ||
        activeWorkoutSessionRef.value
      )
        return;
      if (
        !router.currentRoute.value.matched.some((record) => record.meta.requiresAuth) ||
        offeredUser === user.uid
      )
        return;
      offeredUser = user.uid;
      void startTour();
    },
  );
}

export function useAppTour() {
  return { startTour, isTourRunning: readonly(running), tourError: readonly(error) };
}
