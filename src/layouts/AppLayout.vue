<template>
  <div
    class="app-layout flex h-dvh flex-col overflow-hidden"
    :class="{ 'app-layout--nav-expanded': isNavExpanded }"
  >
    <div class="app-content flex min-h-0 min-w-0 flex-1 flex-col">
      <SharedWorkoutPanel v-if="currentUser?.emailVerified" />
      <div
        v-if="activeWorkout && !isWorkoutPlayerOpenRef"
        class="shrink-0 px-4 pt-4"
      >
        <div
          class="aura aura-lg mx-auto block w-full max-w-2xl bg-primary/10 text-primary"
          :class="{ 'aura-dual': !workoutPlayerStatusRef?.paused }"
        >
          <div
            class="flex w-full items-center gap-1 rounded-box bg-base-100 pr-2 text-base-content shadow-sm"
          >
            <GttButton
              unstyled
              class="flex min-w-0 flex-1 items-center justify-between gap-2 py-2 pl-3 text-left"
              type="button"
              :aria-label="tr('ui.reopen_current_workout')"
              @click="openWorkoutPlayer"
            >
              <span class="flex min-w-0 items-center gap-2">
                <span
                  class="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-content"
                >
                  <Dumbbell class="size-4" aria-hidden="true" />
                </span>
                <span class="min-w-0">
                  <span class="block truncate text-sm font-semibold">{{
                    activeWorkout.name
                  }}</span>
                  <span
                    v-if="workoutPlayerStatusRef"
                    class="block truncate text-xs font-semibold"
                    :class="workoutPlayerStatusRef.stepColorClass"
                  >
                    {{ workoutPlayerStatusRef.step }}
                  </span>
                </span>
              </span>
              <span
                v-if="workoutPlayerStatusRef"
                class="shrink-0 font-mono text-2xl font-bold tabular-nums"
                :class="workoutPlayerStatusRef.stepColorClass"
              >
                {{ workoutPlayerStatusRef.counter }}
              </span>
            </GttButton>
            <GttButton
              shape="square"
              mode="ghost"
              size="sm"
              class="shrink-0 text-primary"
              type="button"
              :aria-label="
                workoutPlayerStatusRef?.paused
                  ? tr('ui.resume_workout')
                  : tr('ui.pause_workout')
              "
              :title="
                workoutPlayerStatusRef?.paused
                  ? tr('ui.resume')
                  : tr('ui.pause')
              "
              :disabled="!sharedCanControl"
              @click="toggleWorkoutPlayerPause"
            >
              <Play
                v-if="workoutPlayerStatusRef?.paused"
                class="size-5"
                aria-hidden="true"
              />
              <Pause v-else class="size-5" aria-hidden="true" />
            </GttButton>
            <GttButton
              shape="square"
              mode="ghost"
              size="sm"
              class="shrink-0 text-error"
              type="button"
              :aria-label="tr('ui.stop_workout')"
              :title="tr('ui.stop_workout')"
              @click="
                isSharedPlayback
                  ? sharedAction(() => leaveSharedRoom())
                  : abandonWorkoutSession()
              "
            >
              <Square class="size-5" aria-hidden="true" />
            </GttButton>
          </div>
        </div>
      </div>
      <main
        class="min-h-0 flex-1 p-4"
        :class="
          ['workouts', 'calendar'].includes(String(route.name))
            ? 'overflow-hidden'
            : 'overflow-y-auto'
        "
      >
        <div
          class="pt-3"
          :class="
            ['workouts', 'calendar'].includes(String(route.name))
              ? 'h-full min-h-0'
              : 'min-h-full'
          "
        >
          <router-view />
        </div>
      </main>

      <div id="app-bottom-action" class="shrink-0 px-4 pb-4 empty:hidden" />
    </div>

    <nav
      class="dock dock-sm app-dock shrink-0"
      style="position: relative; bottom: auto"
      :aria-label="tr('ui.main_navigation')"
    >
      <router-link
        data-tour="nav-home"
        to="/"
        :aria-label="tr('ui.dashboard')"
        :title="tr('ui.dashboard')"
        :class="{ 'dock-active': route.name === 'home' }"
      >
        <House /><span class="app-nav-label">{{ tr("visual.home") }}</span>
      </router-link>

      <router-link
        data-tour="nav-calendar"
        to="/calendar"
        :aria-label="tr('ui.calendar')"
        :title="tr('ui.calendar')"
        :class="{ 'dock-active': route.name === 'calendar' }"
      >
        <CalendarDays /><span class="app-nav-label">{{
          tr("visual.calendar")
        }}</span>
      </router-link>

      <router-link
        data-tour="nav-workouts"
        to="/workouts"
        :aria-label="tr('ui.workout')"
        :title="tr('ui.workout')"
        :class="{ 'dock-active': route.name === 'workouts' }"
      >
        <Dumbbell /><span class="app-nav-label">{{
          tr("visual.workouts")
        }}</span>
      </router-link>

      <router-link
        v-if="currentUser?.emailVerified"
        to="/friends"
        :aria-label="
          pendingFriendsCount
            ? tr('friends.pendingIndicator', { count: pendingFriendsCount })
            : tr('friends.title')
        "
        :title="tr('friends.title')"
        :class="{ 'dock-active': route.name === 'friends' }"
      >
        <span class="indicator">
          <span
            v-if="pendingFriendsCount"
            class="indicator-item badge badge-primary badge-xs min-w-4 px-1 text-primary-content"
            aria-hidden="true"
            >{{ pendingFriendsCount > 9 ? "9+" : pendingFriendsCount }}</span
          >
          <UsersRound />
        </span>
        <span class="app-nav-label">{{ tr("visual.friends") }}</span>
      </router-link>

      <router-link
        data-tour="nav-history"
        to="/history"
        :aria-label="tr('ui.history')"
        :title="tr('ui.history')"
        :class="{ 'dock-active': route.name === 'history' }"
      >
        <RotateCcwClock /><span class="app-nav-label">{{
          tr("visual.history")
        }}</span>
      </router-link>

      <router-link
        to="/account"
        :aria-label="tr('ui.account')"
        :title="tr('ui.account')"
        class="app-nav-account"
        :class="{ 'dock-active': route.name === 'account' }"
      >
        <div
          class="grid size-7 place-items-center overflow-hidden rounded-full bg-primary/15 text-primary"
        >
          <img
            v-if="profilePhoto"
            :src="profilePhoto"
            alt="Foto del profilo"
            class="h-full w-full object-cover"
          />
          <UserRound v-else class="size-5" aria-hidden="true" />
        </div>
        <span class="app-nav-label">{{ tr("visual.account") }}</span>
      </router-link>
      <GttButton
        mode="ghost"
        shape="square"
        class="app-nav-expand"
        :aria-label="
          tr(isNavExpanded ? 'visual.navCollapse' : 'visual.navExpand')
        "
        :aria-expanded="isNavExpanded"
        @click="isNavExpanded = !isNavExpanded"
      >
        <PanelLeftClose v-if="isNavExpanded" :size="20" /><PanelLeftOpen
          v-else
          :size="20"
        />
      </GttButton>
    </nav>
    <GttModal
      v-model="showSessionReceipt"
      :title="tr('playerDesign.completed')"
    >
      <div v-if="sessionReceipt">
        <h3 class="text-xl font-bold wrap-break-word">
          {{ sessionReceipt.name }}
        </h3>
        <dl class="mt-5 grid grid-cols-2 gap-4 border-y border-base-300 py-4">
          <div>
            <dt class="text-sm text-base-content/65">
              {{ tr("playerDesign.sessionDuration") }}
            </dt>
            <dd class="mt-1 text-2xl font-bold tabular-nums">
              {{ sessionReceipt.duration }}
            </dd>
          </div>
          <div>
            <dt class="text-sm text-base-content/65">
              {{ tr("playerDesign.sequenceSteps") }}
            </dt>
            <dd class="mt-1 text-2xl font-bold tabular-nums">
              {{ sessionReceipt.steps }}
            </dd>
          </div>
        </dl>
        <p class="mt-4 text-sm text-base-content/65">
          {{ tr("playerDesign.saved") }}
        </p>
        <GttButton
          color="primary"
          class="mt-5 w-full"
          @click="showSessionReceipt = false"
          >{{ tr("playerDesign.done") }}</GttButton
        >
      </div>
    </GttModal>
  </div>
</template>

<script setup lang="ts">
import SharedWorkoutPanel from "@/components/workouts/SharedWorkoutPanel.vue";
import {
  sharedCanControl,
  sharedAction,
  isSharedPlayback,
  leaveSharedRoom,
} from "@/services/sharedWorkout";
import { useAuth } from "@/composables/useAuth";
import { tr } from "@/localization";
import { listenFriendships, listenSharedWorkouts } from "@/services/friends";
import {
  abandonWorkoutSession,
  activeWorkoutSessionRef,
  isWorkoutPlayerOpenRef,
  openWorkoutPlayer,
  toggleWorkoutPlayerPause,
  workoutPlayerStatusRef,
  workoutsRef,
  workoutSessionsRef,
} from "@/stores/workoutCreator";
import {
  CalendarDays,
  PanelLeftClose,
  PanelLeftOpen,
  Dumbbell,
  House,
  Pause,
  Play,
  RotateCcwClock,
  Square,
  UserRound,
  UsersRound,
} from "@lucide/vue";
import { computed, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const showSessionReceipt = ref(false);
const sessionReceipt = ref<{ name: string; duration: string; steps: number }>();
watch(activeWorkoutSessionRef, (current, previous) => {
  if (current || !previous) return;
  const completed = workoutSessionsRef.value.find(
    (session) => session.id === previous.id && session.completedAt,
  );
  if (!completed) return;
  const workout = previous.sharedWorkout ?? workoutsRef.value.find(
    (item) => item.id === completed.workoutId,
  );
  const seconds = Math.max(
    0,
    Math.round(
      (Date.parse(completed.completedAt!) - Date.parse(completed.startedAt)) /
        1000,
    ),
  );
  sessionReceipt.value = {
    name: completed.workoutName ?? workout?.name ?? tr("ui.deleted_workout"),
    duration: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`,
    steps:
      workout?.steps.filter((step) => step.type !== "SETPAUSE").length ??
      completed.completedStepIndexes.length,
  };
  showSessionReceipt.value = true;
});
const isNavExpanded = ref(false);
const { currentUser, profilePhoto } = useAuth();
const pendingRequestsCount = ref(0);
const sharedWorkoutsCount = ref(0);
const pendingFriendsCount = computed(
  () => pendingRequestsCount.value + sharedWorkoutsCount.value,
);
let stopFriendListeners: (() => void)[] = [];
watch(
  () => currentUser.value?.uid,
  (userId) => {
    stopFriendListeners.forEach((stop) => stop());
    stopFriendListeners = [];
    pendingRequestsCount.value = 0;
    sharedWorkoutsCount.value = 0;
    if (!userId) return;
    stopFriendListeners = [
      listenFriendships(
        (friends) => {
          pendingRequestsCount.value = friends.filter(
            (friend) =>
              friend.status === "pending" && friend.recipient === userId,
          ).length;
        },
        (error) => console.error("Unable to load friend requests", error),
      ),
      listenSharedWorkouts(
        (workouts) => {
          sharedWorkoutsCount.value = workouts.length;
        },
        (error) => console.error("Unable to load shared workouts", error),
      ),
    ];
  },
  { immediate: true },
);
onUnmounted(() => stopFriendListeners.forEach((stop) => stop()));
const activeWorkout = computed(
  () =>
    activeWorkoutSessionRef.value?.sharedWorkout ??
    workoutsRef.value.find(
      (workout) => workout.id === activeWorkoutSessionRef.value?.workoutId,
    ),
);
</script>
