import type { RouteRecordRaw } from 'vue-router';
import AppLayout from '../layouts/AppLayout.vue';
import HomeView from '../views/HomeView.vue';
import HistoryView from '../views/HistoryView.vue';
import CalendarView from '../views/CalendarView.vue';
import WorkoutsView from '../views/WorkoutsView.vue';
import AccountView from '../views/AccountView.vue';
import AuthLayout from '../layouts/AuthLayout.vue';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/auth',
    component: AuthLayout,
    children: [
      {
        path: 'login',
        name: 'login',
        component: LoginView,
      },
      {
        path: 'register',
        name: 'register',
        component: RegisterView,
      },
    ],
  },
  {
    path: '/',
    component: AppLayout,
    children: [
      {
        path: '',
        name: 'home',
        meta: {
          title: 'Dashboard',
        },
        component: HomeView,
      },
      {
        path: 'calendar',
        name: 'calendar',
        meta: {
          title: 'Calendario',
        },
        component: CalendarView,
      },
      {
        path: 'workouts',
        name: 'workouts',
        meta: {
          title: 'I tuoi workout',
        },
        component: WorkoutsView,
      },
      {
        path: 'history',
        name: 'history',
        meta: {
          title: 'Storico',
        },
        component: HistoryView,
      },
      {
        path: 'account',
        name: 'account',
        meta: {
          title: 'Account',
        },
        component: AccountView,
      },
    ],
  },
];

export default routes;
