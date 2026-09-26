<template>
  <section class="mt-6 border-t border-base-300/50 pt-4" aria-labelledby="trend-heading">
    <h3 id="trend-heading" class="text-sm font-semibold">{{ t('home.trend.title') }}</h3>
    <p class="mt-1 text-xs text-base-content/60">{{ t('home.trend.period') }}</p>
    <div class="relative mt-3 h-40 min-w-0">
      <Line v-if="colors" :data="chartData" :options="chartOptions" role="img" :aria-label="chartDescription" />
    </div>
    <p v-if="!hasActivity" class="mt-2 text-xs text-base-content/60">{{ t('home.trend.empty') }}</p>
    <p v-else class="mt-2 text-xs text-base-content/60">{{ t('home.trend.currentWeek') }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler, type ChartOptions, type ScriptableContext } from 'chart.js';
import { workoutSessionsRef } from '@/stores/workoutCreator';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);
const { t, locale } = useI18n();
const colors = ref<{ primary: string; text: string; background: string }>();
const reducedMotion = ref(false);
let themeObserver: MutationObserver | undefined;
let motionQuery: MediaQueryList | undefined;
const updateMotion = () => { reducedMotion.value = motionQuery?.matches ?? false; };
function updateColors() {
  // Resolve theme colors to RGB: canvas cannot resolve CSS variables itself.
  const probe = document.createElement('span');
  document.body.appendChild(probe);
  const resolve = (token: string) => {
    probe.style.color = `var(${token})`;
    const color = getComputedStyle(probe).color;
    return color;
  };
  colors.value = { primary: resolve('--color-primary'), text: resolve('--color-base-content'), background: resolve('--color-base-100') };
  probe.remove();
}
onMounted(() => {
  updateColors();
  themeObserver = new MutationObserver(updateColors);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  updateMotion();
  motionQuery.addEventListener('change', updateMotion);
});
onUnmounted(() => {
  themeObserver?.disconnect();
  motionQuery?.removeEventListener('change', updateMotion);
});
const weeks = computed(() => {
  const today = new Date();
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  return Array.from({ length: 8 }, (_, index) => {
    const start = new Date(monday);
    start.setDate(start.getDate() - (7 - index) * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const count = workoutSessionsRef.value.filter((session) => {
      const completed = Date.parse(session.completedAt ?? '');
      return completed >= start.getTime() && completed < end.getTime() && completed <= today.getTime();
    }).length;
    return { label: new Intl.DateTimeFormat(locale.value, { day: 'numeric', month: 'short' }).format(start), count };
  });
});
const hasActivity = computed(() => weeks.value.some((week) => week.count > 0));
const chartDescription = computed(() => `${t('home.trend.title')}. ${weeks.value.map((week) => `${week.label}: ${t('home.trend.count', week.count)}`).join('; ')}`);
const chartData = computed(() => ({
  labels: weeks.value.map((week) => week.label),
  datasets: [{
    label: t('home.completedWorkouts'),
    data: weeks.value.map((week) => week.count),
    borderColor: colors.value?.primary,
    backgroundColor: (context: ScriptableContext<'line'>) => {
      const { ctx, chartArea } = context.chart;
      if (!chartArea || !colors.value) return 'transparent';
      const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
      const color = colors.value.primary;
      gradient.addColorStop(0, `color-mix(in srgb, ${color} 18%, transparent)`);
      gradient.addColorStop(1, `color-mix(in srgb, ${color} 2%, transparent)`);
      return gradient;
    },
    borderWidth: 2,
    pointRadius: 3,
    pointHoverRadius: 5,
    pointBackgroundColor: colors.value?.background,
    pointBorderColor: colors.value?.primary,
    pointBorderWidth: 2,
    tension: 0.35,
    cubicInterpolationMode: 'monotone' as const,
    fill: true,
  }],
}));
const chartOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: reducedMotion.value ? false : { duration: 250 },
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (context) => t('home.trend.count', context.parsed.y ?? 0) } },
  },
  scales: {
    x: { grid: { display: false }, border: { display: false }, ticks: { color: colors.value?.text, maxTicksLimit: 4, maxRotation: 0, font: { size: 10 } } },
    y: { beginAtZero: true, suggestedMax: 3, border: { display: false }, grid: { display: false }, ticks: { precision: 0, maxTicksLimit: 4, color: colors.value?.text, font: { size: 10 } } },
  },
}));
</script>
