import { authReady, useAuth } from '@/composables/useAuth';
import { createRouter, createWebHistory } from 'vue-router';
import routes from './routes';
import { hasChosenLocalMode } from '@/composables/localMode';
import { activeWorkoutSessionRef } from '@/stores/workoutCreator';

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  await authReady;
  const { currentUser, isAuthenticated } = useAuth();
  const requiresAuth = to.matched.some((route) => route.meta.requiresAuth);
  const isLoginOrRegister = to.name === 'login' || to.name === 'register';

  const isAppRoute = to.matched.some((record) => record.meta.appRoute);
  const localModeChosen = hasChosenLocalMode();

  if (isAppRoute && !isAuthenticated.value && !localModeChosen) return { name: 'login' };
  if (isLoginOrRegister && localModeChosen && activeWorkoutSessionRef.value && !isAuthenticated.value) return { name: 'account' };
  if (requiresAuth && !isAuthenticated.value) return { name: 'login' };
  if (isAppRoute && currentUser.value && !currentUser.value.emailVerified) return { name: 'verify-email' };
  if (isLoginOrRegister && isAuthenticated.value) return { name: 'home' };
});

export default router;
