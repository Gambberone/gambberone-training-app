<script setup lang="ts">
import { House, ChartSpline, CalendarDays, Dumbbell } from '@lucide/vue';
import { useRoute } from 'vue-router';

const route = useRoute();
</script>
<template>
    <div class="flex min-h-dvh flex-col">
        <main class="h-[calc(100dvh-4rem-env(safe-area-inset-bottom))] overflow-y-auto p-4">
            <div class="w-full flex">
                <span class="text-2xl font-semibold text-primary">{{ route.meta.title }}</span>
            </div>
            <div class="py-3">
                <router-view />
            </div>
        </main>

        <nav class="dock dock-sm" aria-label="Navigazione principale">
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
        </nav>
    </div>
</template>
