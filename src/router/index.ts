import { createRouter, createWebHistory } from 'vue-router';
import { authReady, useAuth } from '../composables/useAuth';
import routes from './routes';

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  await authReady;
  const { currentUser, isAuthenticated } = useAuth();
  const requiresAuth = to.matched.some((route) => route.meta.requiresAuth);
  const isLoginOrRegister = to.name === 'login' || to.name === 'register';

  if (requiresAuth && !isAuthenticated.value) return { name: 'login' };
  if (requiresAuth && !currentUser.value?.emailVerified) return { name: 'verify-email' };
  if (isLoginOrRegister && isAuthenticated.value) return { name: 'home' };
});

export default router;
