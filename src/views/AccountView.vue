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
          <div class="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/15 text-primary">
            <img v-if="profilePhoto" :src="profilePhoto" :alt="t('account.photo')" class="h-full w-full object-cover" />
            <UserRound v-else class="size-8" aria-hidden="true" />
          </div>
          <div class="flex flex-wrap gap-2">
            <label class="btn btn-outline btn-sm" :class="{ 'btn-disabled': isSavingPhoto }">
              <span v-if="isSavingPhoto" class="loading loading-spinner loading-xs" />
              {{ profilePhoto ? t('account.changePhoto') : t('account.uploadPhoto') }}
              <input class="sr-only" type="file" accept="image/jpeg,image/png,image/webp"
                :disabled="isSavingPhoto" :aria-label="t('account.choosePhoto')" @change="savePhoto" />
            </label>
            <button v-if="profilePhoto" class="btn btn-ghost btn-sm" type="button"
              :disabled="isSavingPhoto" @click="removePhoto">{{ t('account.removePhoto') }}</button>
          </div>
        </div>
        <p class="text-xs text-base-content/60">{{ t('account.photoHint') }}</p>
        <p v-if="photoError" class="text-sm text-error" role="alert">{{ photoError }}</p>
        <label class="form-control w-full gap-2">
          <span class="label-text font-semibold text-base-content">{{ t('account.displayName') }}</span>
          <input v-model="displayName" class="input input-bordered w-full" type="text"
            autocomplete="nickname" maxlength="60" :placeholder="t('account.namePlaceholder')" required />
        </label>
        <p v-if="nameError" class="text-sm text-error" role="alert">{{ nameError }}</p>
        <button class="btn btn-primary self-end" type="submit"
          :disabled="isSavingName || !displayName.trim() || displayName.trim() === (currentUser?.displayName ?? '')">
          <span v-if="isSavingName" class="loading loading-spinner loading-sm" />
          {{ t('account.saveName') }}
        </button>
      </form>
    </article>

    <article class="card mt-4 border border-base-300 bg-base-100 shadow-sm">
      <div class="card-body gap-4 p-5">
        <div>
          <h2 class="font-bold text-base-content">{{ t('account.personalization') }}</h2>
          <p class="mt-1 text-sm text-base-content/65">{{ t('account.personalizationDescription') }}</p>
        </div>
        <label class="form-control w-full gap-2">
          <span class="label-text font-semibold text-base-content">{{ t('account.theme') }}</span>
          <select v-model="themePreference" class="select select-bordered w-full">
            <option value="auto">{{ t('account.auto') }}</option>
            <option value="light">{{ t('account.light') }}</option>
            <option value="dark">{{ t('account.dark') }}</option>
          </select>
        </label>
        <label class="form-control w-full gap-2">
          <span class="label-text font-semibold text-base-content">{{ t('account.language') }}</span>
          <select :value="locale" class="select select-bordered w-full"
            :disabled="!isLanguageReady || isSavingLanguage"
            @change="changeLanguage(($event.target as HTMLSelectElement).value)">
            <option value="it">Italiano</option>
            <option value="en">English</option>
          </select>
          <span v-if="languageError" class="text-sm text-error" role="alert">{{ t('account.languageError') }}</span>
        </label>
        <div class="divider my-0" />
        <label class="flex cursor-pointer items-center justify-between gap-4">
          <span>
            <span class="block font-semibold text-base-content">{{ t('account.sounds') }}</span>
            <span class="mt-1 block text-sm text-base-content/65">{{ t('account.soundsDescription') }}</span>
          </span>
          <input v-model="timerSounds" type="checkbox" class="toggle toggle-primary shrink-0" />
        </label>
        <div class="divider my-0" />
        <label class="flex cursor-pointer items-center justify-between gap-4">
          <span>
            <span class="block font-semibold text-base-content">{{ t('account.vibration') }}</span>
            <span class="mt-1 block text-sm text-base-content/65">{{ t('account.vibrationDescription') }}</span>
          </span>
          <input v-model="timerVibration" type="checkbox" class="toggle toggle-primary shrink-0" />
        </label>
        <div class="divider my-0" />
        <label class="flex cursor-pointer items-center justify-between gap-4">
          <span>
            <span class="block font-semibold text-base-content">{{ t('account.screen') }}</span>
            <span class="mt-1 block text-sm text-base-content/65">{{ t('account.screenDescription') }}</span>
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
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
const { t, locale } = useI18n();
import { UserRound } from '@lucide/vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import { useLanguage } from '@/composables/useLanguage';
import { useTheme } from '@/composables/useTheme';
import { useWorkoutPreferences } from '@/composables/useWorkoutPreferences';
import { showToast } from '@/composables/toast';

const { themePreference } = useTheme();
const { isLanguageReady, isSavingLanguage, languageError, changeLanguage } = useLanguage();
const { timerSounds, timerVibration, keepScreenAwake } = useWorkoutPreferences();
const { currentUser, profilePhoto, signOut, updateDisplayName, updateProfilePhoto, removeProfilePhoto } = useAuth();
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
