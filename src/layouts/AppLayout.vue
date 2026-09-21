<template>
  <div class="flex min-h-dvh flex-col">
    <main
      class="h-dvh overflow-y-auto p-4"
      style="padding-bottom: calc(4.25rem + env(safe-area-inset-bottom) + max(env(safe-area-inset-bottom), 0.5rem))"
    >
      <!-- <div class="w-full flex">
                <span class="text-2xl font-semibold text-primary">{{ route.meta.title }}</span>
            </div> -->
      <div class="h-full py-3">
        <router-view />
      </div>
    </main>

    <nav
      class="dock dock-sm"
      style="bottom: max(env(safe-area-inset-bottom), 0.5rem)"
      aria-label="Navigazione principale"
    >
      <router-link to="/" :class="{ 'dock-active': route.name === 'home' }">
        <House />
      </router-link>

      <router-link to="/calendar" :class="{ 'dock-active': route.name === 'calendar' }">
        <CalendarDays />
      </router-link>

      <router-link to="/workouts" :class="{ 'dock-active': route.name === 'workouts' }">
        <Dumbbell />
      </router-link>

      <router-link to="/history" :class="{ 'dock-active': route.name === 'history' }">
        <ChartSpline />
      </router-link>

      <router-link to="/account" :class="{ 'dock-active': route.name === 'account' }">
        <div class="avatar">
          <div class="w-7 rounded-full">
            <img
              src="https://img.daisyui.com/images/profile/demo/superperson@192.webp"
              alt="Tailwind-CSS-Avatar-component"
            />
          </div>
        </div>
      </router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { CalendarDays, ChartSpline, Dumbbell, House } from '@lucide/vue';
import { useRoute } from 'vue-router';

const route = useRoute();
</script>
