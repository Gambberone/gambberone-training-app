import type { RouteRecordRaw } from 'vue-router';
import AppLayout from '../layouts/AppLayout.vue';
import HomeView from '../views/HomeView.vue';
import HistoryView from '../views/HistoryView.vue';
import CalendarView from '../views/CalendarView.vue';
import WorkoutsView from '../views/WorkoutsView.vue';

const routes: RouteRecordRaw[] = [
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
    ],
  },
];

export default routes;
