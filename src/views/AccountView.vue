<template>
  <section class="mx-auto w-full max-w-6xl">
    <header class="mb-7">
      <p class="mb-1 text-sm font-semibold text-primary">{{ t('account.preferences') }}</p>
      <h1 class="text-3xl font-bold tracking-tight text-base-content">{{ t('account.title') }}</h1>
      <p class="mt-2 text-base-content/65">{{ t('account.intro') }}</p>
    </header>

    <div class="grid items-start gap-4 lg:grid-cols-2">
      <div class="min-w-0 space-y-4">
        <details class="card border border-base-300 bg-base-100 shadow-sm" open>
          <summary
            class="account-card-summary flex cursor-pointer items-center justify-between gap-4 rounded-2xl p-5 font-bold outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
          >
            <span>{{ t('account.profile') }}</span>
            <ChevronDown
              class="account-card-chevron size-5 shrink-0 text-base-content/50 transition-transform"
              aria-hidden="true"
            />
          </summary>
          <form class="card-body gap-4 px-5 pb-5 pt-0" @submit.prevent="saveName">
            <div>
              <p class="mt-1 text-sm text-base-content/65">{{ t('account.profileDescription') }}</p>
            </div>
            <AccountPhoto />
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
            <div>
              <p class="text-sm font-semibold">{{ t('ui.email') }}</p>
              <p class="mt-1 break-all text-sm text-base-content/65">{{ currentUser?.email }}</p>
            </div>
            <GttButton color="primary"
              class="self-end"
              type="submit"
              :disabled="
                isSavingName ||
                !displayName.trim() ||
                displayName.trim() === (currentUser?.displayName ?? '')
              "
            >
              <span v-if="isSavingName" class="loading loading-spinner loading-sm" />
              {{ t('account.saveName') }}
            </GttButton>
            <div class="divider my-0" />
            <GttButton mode="outline" color="error"
              class="w-full"
              type="button"
              :disabled="isDeletingAccount || isChangingPassword"
              @click="logout"
            >
              {{ t('account.logout') }}
            </GttButton>
          </form>
        </details>
      </div>
      <div class="min-w-0 space-y-4">
        <details class="card border border-base-300 bg-base-100 shadow-sm">
          <summary
            class="account-card-summary flex cursor-pointer items-center justify-between gap-4 rounded-2xl p-5 font-bold outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
          >
            <span>{{ t('account.personalization') }}</span>
            <ChevronDown
              class="account-card-chevron size-5 shrink-0 text-base-content/50 transition-transform"
              aria-hidden="true"
            />
          </summary>
          <div class="card-body gap-4 px-5 pb-5 pt-0">
            <div>
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
              @update:model-value="(value) => value && changeLanguage(value)"
            />
            <div class="divider my-0" />
            <GttToggleField
              id="account-sounds"
              v-model="timerSounds"
              :label="t('account.sounds')"
              :hint="t('account.soundsDescription')"
            />
            <div class="divider my-0" />
            <GttToggleField
              id="account-vibration"
              v-model="timerVibration"
              :label="t('account.vibration')"
              :hint="t('account.vibrationDescription')"
            />
            <div class="divider my-0" />
            <GttToggleField
              id="account-screen"
              v-model="keepScreenAwake"
              :label="t('account.screen')"
              :hint="t('account.screenDescription')"
            />
          </div>
        </details>
        <details class="card border border-base-300 bg-base-100 shadow-sm">
          <summary
            class="account-card-summary flex cursor-pointer items-center justify-between gap-4 rounded-2xl p-5 font-bold outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
          >
            <span>{{ t('tour.help') }}</span>
            <ChevronDown
              class="account-card-chevron size-5 shrink-0 text-base-content/50 transition-transform"
              aria-hidden="true"
            />
          </summary>
          <div class="card-body gap-3 px-5 pb-5 pt-0">
            <p class="text-sm text-base-content/65">{{ t('tour.replayDescription') }}</p>
            <GttButton mode="outline"
              class="self-start"
              type="button"
              :disabled="isTourRunning || !!activeWorkoutSessionRef"
              @click="startTour"
            >
              {{ t('tour.replay') }}
            </GttButton>
            <p v-if="activeWorkoutSessionRef" class="text-sm text-base-content/60">
              {{ t('tour.workoutActive') }}
            </p>
            <p v-if="tourError" class="text-sm text-error" role="alert">{{ t('tour.error') }}</p>
          </div>
        </details>
        <details class="card border border-base-300 bg-base-100 shadow-sm">
          <summary
            class="account-card-summary flex cursor-pointer items-center justify-between gap-4 rounded-2xl p-5 font-bold outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
          >
            <span>{{ t('account.changePassword') }}</span>
            <ChevronDown
              class="account-card-chevron size-5 shrink-0 text-base-content/50 transition-transform"
              aria-hidden="true"
            />
          </summary>
          <form class="card-body gap-4 px-5 pb-5 pt-0" @submit.prevent="savePassword">
            <GttInputField
              id="account-current-password"
              v-model="currentPassword"
              :label="t('account.currentPassword')"
              type="password"
              autocomplete="current-password"
              :disabled="isChangingPassword || isDeletingAccount"
              required
              compact
            />
            <GttInputField
              id="account-new-password"
              v-model="newPassword"
              :label="t('account.newPassword')"
              type="password"
              autocomplete="new-password"
              minlength="6"
              :disabled="isChangingPassword || isDeletingAccount"
              required
              compact
            />
            <GttInputField
              id="account-confirm-password"
              v-model="confirmPassword"
              :label="t('ui.confirm_password')"
              type="password"
              autocomplete="new-password"
              minlength="6"
              :disabled="isChangingPassword || isDeletingAccount"
              required
              compact
            />
            <p v-if="passwordError" class="text-sm text-error" role="alert">{{ passwordError }}</p>
            <GttButton color="primary"
              class="self-end"
              type="submit"
              :disabled="isChangingPassword || isDeletingAccount"
            >
              <span v-if="isChangingPassword" class="loading loading-spinner loading-sm" />
              {{ t('account.changePassword') }}
            </GttButton>
          </form>
        </details>
        <details class="card border border-error/30 bg-base-100 shadow-sm">
          <summary
            class="account-card-summary flex cursor-pointer items-center justify-between gap-4 rounded-2xl p-5 font-bold outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
          >
            <span class="text-error">{{ t('account.deleteAccount') }}</span>
            <ChevronDown
              class="account-card-chevron size-5 shrink-0 text-base-content/50 transition-transform"
              aria-hidden="true"
            />
          </summary>
          <div class="card-body gap-4 px-5 pb-5 pt-0">
            <p class="text-sm text-base-content/65">{{ t('account.deleteDescription') }}</p>
            <GttButton mode="outline" color="error"
              v-if="!showDeleteConfirmation"
              class="self-start"
              type="button"
              :disabled="isChangingPassword"
              @click="showDeleteConfirmation = true"
            >
              {{ t('account.deleteAccount') }}
            </GttButton>
            <form v-else class="flex flex-col gap-4" @submit.prevent="confirmDeleteAccount">
              <GttInputField
                id="account-delete-password"
                v-model="deletePassword"
                :label="t('account.currentPassword')"
                type="password"
                autocomplete="current-password"
                :disabled="isDeletingAccount"
                required
                compact
              />
              <GttCheckboxField
                id="account-delete-confirmed"
                v-model="deleteConfirmed"
                :label="t('account.deleteConfirmation')"
                :disabled="isDeletingAccount"
                required
              />
              <p v-if="deleteError" class="text-sm text-error" role="alert">{{ deleteError }}</p>
              <div class="flex flex-wrap justify-end gap-2">
                <GttButton mode="ghost"
                  
                  type="button"
                  :disabled="isDeletingAccount"
                  @click="cancelDelete"
                >
                  {{ t('account.cancel') }}
                </GttButton>
                <GttButton color="error"
                  
                  type="submit"
                  :disabled="
                    isDeletingAccount || !deleteConfirmed || !deletePassword || isChangingPassword
                  "
                >
                  <span v-if="isDeletingAccount" class="loading loading-spinner loading-sm" />
                  {{ t('account.deletePermanently') }}
                </GttButton>
              </div>
            </form>
          </div>
        </details>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import AccountPhoto from '@/components/account/AccountPhoto.vue';
import GttCheckboxField from '@/components/generic/form/GttCheckboxField.vue';
import GttInputField from '@/components/generic/form/GttInputField.vue';
import GttSelectField from '@/components/generic/form/GttSelectField.vue';
import GttToggleField from '@/components/generic/form/GttToggleField.vue';
import { showToast } from '@/composables/toast';
import { useAppTour } from '@/composables/useAppTour';
import { authErrorMessage, useAuth } from '@/composables/useAuth';
import { useLanguage } from '@/composables/useLanguage';
import { useTheme } from '@/composables/useTheme';
import { useWorkoutPreferences } from '@/composables/useWorkoutPreferences';
import { activeWorkoutSessionRef } from '@/stores/workoutCreator';
import { ChevronDown } from '@lucide/vue';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
const { t, locale } = useI18n();

const { startTour, isTourRunning, tourError } = useAppTour();
const { themePreference } = useTheme();
const themeOptions = computed(() => [
  { id: 'auto', label: t('account.auto') },
  { id: 'light', label: t('account.light') },
  { id: 'dark', label: t('account.dark') },
]);
const languageOptions = [
  { id: 'it', label: 'Italiano' },
  { id: 'en', label: 'English' },
];
function setTheme(value?: string) {
  if (value === 'auto' || value === 'light' || value === 'dark') themePreference.value = value;
}
const { isLanguageReady, isSavingLanguage, languageError, changeLanguage } = useLanguage();
const { timerSounds, timerVibration, keepScreenAwake } = useWorkoutPreferences();
const { changePassword, deleteAccount, currentUser, signOut, updateDisplayName } = useAuth();
const router = useRouter();
const displayName = ref(currentUser.value?.displayName ?? '');
const isSavingName = ref(false);
const nameError = ref('');

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

const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const passwordError = ref('');
const isChangingPassword = ref(false);
const showDeleteConfirmation = ref(false);
const deletePassword = ref('');
const deleteConfirmed = ref(false);
const deleteError = ref('');
const isDeletingAccount = ref(false);

async function savePassword() {
  if (isChangingPassword.value || isDeletingAccount.value) return;
  passwordError.value = '';
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = t('ui.passwords_do_not_match');
    return;
  }
  if (newPassword.value.length < 6) {
    passwordError.value = t('ui.password_must_contain_at_least_6_characters');
    return;
  }
  isChangingPassword.value = true;
  try {
    await changePassword(currentPassword.value, newPassword.value);
    currentPassword.value = newPassword.value = confirmPassword.value = '';
    showToast({ title: t('account.passwordSaved') });
  } catch (error) {
    passwordError.value = authErrorMessage(error);
  } finally {
    isChangingPassword.value = false;
  }
}

function cancelDelete() {
  showDeleteConfirmation.value = false;
  deletePassword.value = '';
  deleteConfirmed.value = false;
  deleteError.value = '';
}

async function confirmDeleteAccount() {
  if (
    !deleteConfirmed.value ||
    !deletePassword.value ||
    isDeletingAccount.value ||
    isChangingPassword.value
  )
    return;
  isDeletingAccount.value = true;
  deleteError.value = '';
  try {
    await deleteAccount(deletePassword.value);
    await router.replace({ name: 'login' });
  } catch (error) {
    deleteError.value = authErrorMessage(error);
  } finally {
    deletePassword.value = '';
    isDeletingAccount.value = false;
  }
}

async function logout() {
  await signOut();
  await router.replace({ name: 'login' });
}
</script>

<style scoped>
.account-card-summary {
  list-style: none;
}

.account-card-summary::-webkit-details-marker {
  display: none;
}

details[open] > .account-card-summary .account-card-chevron {
  transform: rotate(180deg);
}
</style>
