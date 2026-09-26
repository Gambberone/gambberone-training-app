<template>
  <section class="mx-auto max-w-2xl">
    <header class="mb-7">
      <p class="mb-1 text-sm font-semibold text-primary">{{ t('account.preferences') }}</p>
      <h1 class="text-3xl font-bold tracking-tight text-base-content">{{ t('account.title') }}</h1>
      <p class="mt-2 text-base-content/65">{{ t('account.intro') }}</p>
    </header>

    <article class="card border border-base-300 bg-base-100 shadow-sm">
      <form class="card-body gap-4 p-5" @submit.prevent="saveName">
        <div>
          <h2 class="font-bold text-base-content">{{ t('account.profile') }}</h2>
          <p class="mt-1 text-sm text-base-content/65">{{ t('account.profileDescription') }}</p>
        </div>
        <div class="flex items-center gap-4">
          <div
            class="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/15 text-primary"
          >
            <img
              v-if="profilePhoto"
              :src="profilePhoto"
              :alt="t('account.photo')"
              class="h-full w-full object-cover"
            />
            <UserRound v-else class="size-8" aria-hidden="true" />
          </div>
          <div class="flex flex-wrap gap-2">
            <label class="btn btn-outline btn-sm" :class="{ 'btn-disabled': isSavingPhoto }">
              <span v-if="isSavingPhoto" class="loading loading-spinner loading-xs" />
              {{ profilePhoto ? t('account.changePhoto') : t('account.uploadPhoto') }}
              <input
                class="sr-only"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                :disabled="isSavingPhoto"
                :aria-label="t('account.choosePhoto')"
                @change="savePhoto"
              />
            </label>
            <button
              v-if="profilePhoto"
              class="btn btn-ghost btn-sm"
              type="button"
              :disabled="isSavingPhoto"
              @click="removePhoto"
            >
              {{ t('account.removePhoto') }}
            </button>
          </div>
        </div>
        <p class="text-xs text-base-content/60">{{ t('account.photoHint') }}</p>
        <p v-if="photoError" class="text-sm text-error" role="alert">{{ photoError }}</p>
        <GttInputField
          id="account-display-name"
          v-model="displayName"
          :label="t('account.displayName')"
          :error="nameError"
          :placeholder="t('account.namePlaceholder')"
          autocomplete="nickname"
          maxlength="60"
          required
          compact
        />
        <button
          class="btn btn-primary self-end"
          type="submit"
          :disabled="
            isSavingName ||
            !displayName.trim() ||
            displayName.trim() === (currentUser?.displayName ?? '')
          "
        >
          <span v-if="isSavingName" class="loading loading-spinner loading-sm" />
          {{ t('account.saveName') }}
        </button>
      </form>
    </article>

    <article class="card mt-4 border border-base-300 bg-base-100 shadow-sm">
      <div class="card-body gap-3 p-5">
        <h2 class="font-bold">{{ t('tour.help') }}</h2>
        <p class="text-sm text-base-content/65">{{ t('tour.replayDescription') }}</p>
        <button
          class="btn btn-outline self-start"
          type="button"
          :disabled="isTourRunning || !!activeWorkoutSessionRef"
          @click="startTour"
        >
          {{ t('tour.replay') }}
        </button>
        <p v-if="activeWorkoutSessionRef" class="text-sm text-base-content/60">
          {{ t('tour.workoutActive') }}
        </p>
        <p v-if="tourError" class="text-sm text-error" role="alert">{{ t('tour.error') }}</p>
      </div>
    </article>

    <article class="card mt-4 border border-base-300 bg-base-100 shadow-sm">
      <div class="card-body gap-4 p-5">
        <div>
          <h2 class="font-bold text-base-content">{{ t('account.personalization') }}</h2>
          <p class="mt-1 text-sm text-base-content/65">
            {{ t('account.personalizationDescription') }}
          </p>
        </div>
        <GttSelectField
          id="account-theme"
          :model-value="themePreference"
          :label="t('account.theme')"
          :options="themeOptions"
          compact
          @update:model-value="setTheme"
        />
        <GttSelectField
          id="account-language"
          :model-value="locale"
          :label="t('account.language')"
          :options="languageOptions"
          :disabled="!isLanguageReady || isSavingLanguage"
          :error="languageError ? t('account.languageError') : undefined"
          compact
          @update:model-value="value => value && changeLanguage(value)"
        />
        <div class="divider my-0" />
        <label class="flex cursor-pointer items-center justify-between gap-4">
          <span>
            <span class="block font-semibold text-base-content">{{ t('account.sounds') }}</span>
            <span class="mt-1 block text-sm text-base-content/65">{{
              t('account.soundsDescription')
            }}</span>
          </span>
          <input v-model="timerSounds" type="checkbox" class="toggle toggle-primary shrink-0" />
        </label>
        <div class="divider my-0" />
        <label class="flex cursor-pointer items-center justify-between gap-4">
          <span>
            <span class="block font-semibold text-base-content">{{ t('account.vibration') }}</span>
            <span class="mt-1 block text-sm text-base-content/65">{{
              t('account.vibrationDescription')
            }}</span>
          </span>
          <input v-model="timerVibration" type="checkbox" class="toggle toggle-primary shrink-0" />
        </label>
        <div class="divider my-0" />
        <label class="flex cursor-pointer items-center justify-between gap-4">
          <span>
            <span class="block font-semibold text-base-content">{{ t('account.screen') }}</span>
            <span class="mt-1 block text-sm text-base-content/65">{{
              t('account.screenDescription')
            }}</span>
          </span>
          <input v-model="keepScreenAwake" type="checkbox" class="toggle toggle-primary shrink-0" />
        </label>
      </div>
    </article>

    <article class="card mt-4 border border-base-300 bg-base-100 shadow-sm">
      <div class="card-body gap-4 p-5">
        <div>
          <h2 class="font-bold text-base-content">{{ t('account.session') }}</h2>
          <p class="mt-1 text-sm text-base-content/65">{{ currentUser?.email }}</p>
        </div>
        <button class="btn btn-outline btn-error w-full" type="button" @click="logout">
          {{ t('account.logout') }}
        </button>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import GttInputField from '@/components/generic/form/GttInputField.vue';
import GttSelectField from '@/components/generic/form/GttSelectField.vue';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
const { t, locale } = useI18n();
import { UserRound } from '@lucide/vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import { useAppTour } from '@/composables/useAppTour';
import { activeWorkoutSessionRef } from '@/stores/workoutCreator';
import { useLanguage } from '@/composables/useLanguage';
import { useTheme } from '@/composables/useTheme';
import { useWorkoutPreferences } from '@/composables/useWorkoutPreferences';
import { showToast } from '@/composables/toast';

const { startTour, isTourRunning, tourError } = useAppTour();
const { themePreference } = useTheme();
const themeOptions = computed(() => [
  { id: 'auto', label: t('account.auto') },
  { id: 'light', label: t('account.light') },
  { id: 'dark', label: t('account.dark') },
]);
const languageOptions = [{ id: 'it', label: 'Italiano' }, { id: 'en', label: 'English' }];
function setTheme(value?: string) {
  if (value === 'auto' || value === 'light' || value === 'dark') themePreference.value = value;
}
const { isLanguageReady, isSavingLanguage, languageError, changeLanguage } = useLanguage();
const { timerSounds, timerVibration, keepScreenAwake } = useWorkoutPreferences();
const {
  currentUser,
  profilePhoto,
  signOut,
  updateDisplayName,
  updateProfilePhoto,
  removeProfilePhoto,
} = useAuth();
const router = useRouter();
const displayName = ref(currentUser.value?.displayName ?? '');
const isSavingName = ref(false);
const nameError = ref('');
const photoError = ref('');
const isSavingPhoto = ref(false);

watch(currentUser, (user) => {
  displayName.value = user?.displayName ?? '';
});

async function saveName() {
  const name = displayName.value.trim();
  if (!name || isSavingName.value) return;

  isSavingName.value = true;
  nameError.value = '';
  try {
    await updateDisplayName(name);
    displayName.value = name;
    showToast({ title: t('account.nameSaved') });
  } catch {
    nameError.value = t('account.nameError');
  } finally {
    isSavingName.value = false;
  }
}

async function savePhoto(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file || isSavingPhoto.value) return;

  photoError.value = '';
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    photoError.value = t('account.photoFormat');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    photoError.value = t('account.photoSize');
    return;
  }

  isSavingPhoto.value = true;
  try {
    await updateProfilePhoto(file);
    showToast({ title: t('account.photoSaved') });
  } catch {
    photoError.value = t('account.photoError');
  } finally {
    isSavingPhoto.value = false;
  }
}

async function removePhoto() {
  if (isSavingPhoto.value) return;
  isSavingPhoto.value = true;
  photoError.value = '';
  try {
    await removeProfilePhoto();
    showToast({ title: t('account.photoRemoved') });
  } catch {
    photoError.value = t('account.removeError');
  } finally {
    isSavingPhoto.value = false;
  }
}

async function logout() {
  await signOut();
  await router.replace({ name: 'login' });
}
</script>
