import AppLayout from '@/layouts/AppLayout.vue';
import AuthLayout from '@/layouts/AuthLayout.vue';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/auth',
    component: AuthLayout,
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import('@/views/LoginView.vue'),
      },
      {
        path: 'register',
        name: 'register',
        component: () => import('@/views/RegisterView.vue'),
      },
      {
        path: 'verify-email',
        name: 'verify-email',
        component: () => import('@/views/VerifyEmailView.vue'),
      },
      {
        path: 'forgot-password',
        name: 'forgot-password',
        component: () => import('@/views/ForgotPasswordView.vue'),
      },
    ],
  },
  {
    path: '/',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'home',
        meta: {
          title: 'Dashboard',
        },
        component: () => import('@/views/HomeView.vue'),
      },
      {
        path: 'calendar',
        name: 'calendar',
        meta: {
          title: 'Calendario',
        },
        component: () => import('@/views/CalendarView.vue'),
      },
      {
        path: 'workouts',
        name: 'workouts',
        meta: {
          title: 'I tuoi workout',
        },
        component: () => import('@/views/WorkoutsView.vue'),
      },
      {
        path: 'friends',
        name: 'friends',
        meta: { title: 'Amici' },
        component: () => import('@/views/FriendsView.vue'),
      },
      {
        path: 'history',
        name: 'history',
        meta: {
          title: 'Storico',
        },
        component: () => import('@/views/HistoryView.vue'),
      },
      {
        path: 'account',
        name: 'account',
        meta: {
          title: 'Account',
        },
        component: () => import('@/views/AccountView.vue'),
      },
    ],
  },
];

export default routes;
