<template>
  <section class="account-page mx-auto w-full max-w-6xl space-y-6 pb-8">
    <header class="mb-7">
      <h1 class="text-3xl font-bold tracking-tight text-base-content">
        {{ t(currentUser ? "account.title" : "localMode.settings") }}
      </h1>
      <p class="mt-2 text-sm text-base-content/65">{{ t(currentUser ? "account.intro" : "localMode.description") }}</p>
    </header>

    <GttModal
      v-model="showSurprise"
      :title="t('account.surprise')"
      content-class="max-w-4xl"
    >
      <iframe
        v-if="showSurprise"
        class="aspect-video w-full rounded-xl border-0"
        src="https://www.youtube.com/embed/9J62hGda9BQ?autoplay=1&playsinline=1"
        :title="t('account.surprise')"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        referrerpolicy="strict-origin-when-cross-origin"
        allowfullscreen
      />
    </GttModal>

    <div v-if="!currentUser" class="rounded-box border border-base-300 p-5">
      <h2 class="font-bold">{{ t("localMode.title") }}</h2>
      <p class="mt-2 text-sm text-base-content/65">{{ t("localMode.description") }}</p>
      <p class="mt-2 text-sm text-base-content/65">{{ t("localMode.connectHint") }}</p>
      <RouterLink class="btn btn-primary mt-4" to="/auth/login" :class="{ 'btn-disabled': activeWorkoutSessionRef }">{{ t("localMode.connect") }}</RouterLink>
    </div>
    <div
      class="grid items-start gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
    >
      <div v-if="currentUser" class="min-w-0 space-y-4">
        <details class="card border border-base-300/50 bg-base-100" open>
          <summary
            class="account-card-summary flex cursor-pointer items-center justify-between gap-4 rounded-2xl p-5 font-bold outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
          >
            <span class="flex min-w-0 items-center gap-3"
              ><UserRound
                :size="19"
                class="shrink-0 text-base-content/55"
                aria-hidden="true"
              />{{ t("account.profile") }}</span
            >
            <ChevronDown
              class="account-card-chevron size-5 shrink-0 text-base-content/50 transition-transform"
              aria-hidden="true"
            />
          </summary>
          <form
            class="card-body gap-4 px-5 pb-5 pt-0"
            @submit.prevent="saveName"
          >
            <div>
              <p class="mt-1 text-sm text-base-content/65">
                {{ t("account.profileDescription") }}
              </p>
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
              <p class="text-sm font-semibold">{{ t("ui.email") }}</p>
              <p class="mt-1 break-all text-sm text-base-content/65">
                {{ currentUser?.email }}
              </p>
            </div>
            <GttButton
              color="primary"
              class="self-end"
              type="submit"
              :disabled="
                isSavingName ||
                !displayName.trim() ||
                displayName.trim() === (currentUser?.displayName ?? '')
              "
            >
              <span
                v-if="isSavingName"
                class="loading loading-spinner loading-sm"
              />
              {{ t("account.saveName") }}
            </GttButton>
            <div class="border-t border-base-300/50 pt-5">
              <h3 class="mb-4 text-sm font-bold">{{ t("account.privacy") }}</h3>
              <div class="mb-5">
                <GttToggleField
                  id="account-online"
                  :model-value="presenceEnabled"
                  :label="t('account.shareOnline')"
                  :hint="t('account.shareOnlineHint')"
                  :disabled="!presenceReady || presenceSaving"
                  @update:model-value="setPresenceEnabled"
                />
                <p
                  v-if="presenceError"
                  class="mt-2 text-sm text-error"
                  role="alert"
                >
                  {{ t("account.presenceError") }}
                </p>
              </div>
              <GttToggleField
                id="account-share-email"
                :model-value="friendEmail.enabled.value"
                :label="t('account.shareEmail')"
                :hint="t('account.shareEmailHint')"
                :disabled="
                  !friendEmail.ready.value ||
                  friendEmail.saving.value ||
                  !currentUser?.email
                "
                @update:model-value="friendEmail.setEnabled"
              />
              <p
                v-if="friendEmail.error.value"
                class="text-sm text-error"
                role="alert"
              >
                {{ t("account.shareEmailError") }}
              </p>
            </div>
          </form>
        </details>
      </div>
      <div v-if="currentUser" class="min-w-0 space-y-4">
        <details class="card border border-base-300/50 bg-base-100" open>
          <summary
            class="account-card-summary flex cursor-pointer items-center justify-between gap-4 rounded-2xl p-5 font-bold outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
          >
            <span class="flex min-w-0 items-center gap-3"
              ><SlidersHorizontal
                :size="19"
                class="shrink-0 text-base-content/55"
                aria-hidden="true"
              />{{ t("account.personalization") }}</span
            >
            <ChevronDown
              class="account-card-chevron size-5 shrink-0 text-base-content/50 transition-transform"
              aria-hidden="true"
            />
          </summary>
          <div class="card-body gap-4 px-5 pb-5 pt-0">
            <div>
              <p class="mt-1 text-sm text-base-content/65">
                {{ t("account.personalizationDescription") }}
              </p>
            </div>
            <h3 class="text-sm font-bold">{{ t("account.appearance") }}</h3>
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
            <div class="border-t border-base-300/50 pt-4">
              <h3 class="text-sm font-bold">{{ t("account.playback") }}</h3>
            </div>
            <GttToggleField
              id="account-sounds"
              v-model="timerSounds"
              :label="t('account.sounds')"
              :hint="t('account.soundsDescription')"
            />
            <div class="border-t border-base-300/50" />
            <GttToggleField
              id="account-vibration"
              v-model="timerVibration"
              :label="t('account.vibration')"
              :hint="t('account.vibrationDescription')"
            />
            <div class="border-t border-base-300/50" />
            <GttToggleField
              id="account-screen"
              v-model="keepScreenAwake"
              :label="t('account.screen')"
              :hint="t('account.screenDescription')"
            />
          </div>
        </details>
        <h2 v-if="currentUser" class="px-1 pt-3 text-sm font-bold text-base-content/65">
          {{ t("account.security") }}
        </h2>
        <details v-if="currentUser" class="card border border-base-300/50 bg-base-100">
          <summary
            class="account-card-summary flex cursor-pointer items-center justify-between gap-4 rounded-2xl p-5 font-bold outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
          >
            <span class="flex min-w-0 items-center gap-3"
              ><LockKeyhole
                :size="19"
                class="shrink-0 text-base-content/55"
                aria-hidden="true"
              />{{ t("account.changePassword") }}</span
            >
            <ChevronDown
              class="account-card-chevron size-5 shrink-0 text-base-content/50 transition-transform"
              aria-hidden="true"
            />
          </summary>
          <form
            class="card-body gap-4 px-5 pb-5 pt-0"
            @submit.prevent="savePassword"
          >
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
            <p v-if="passwordError" class="text-sm text-error" role="alert">
              {{ passwordError }}
            </p>
            <GttButton
              color="primary"
              class="self-end"
              type="submit"
              :disabled="isChangingPassword || isDeletingAccount"
            >
              <span
                v-if="isChangingPassword"
                class="loading loading-spinner loading-sm"
              />
              {{ t("account.changePassword") }}
            </GttButton>
          </form>
        </details>
        <details v-if="currentUser" class="card border border-base-300/50 bg-base-100">
          <summary
            class="account-card-summary flex cursor-pointer items-center justify-between gap-4 rounded-2xl p-5 font-bold outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
          >
            <span class="text-error">{{ t("account.deleteAccount") }}</span>
            <ChevronDown
              class="account-card-chevron size-5 shrink-0 text-base-content/50 transition-transform"
              aria-hidden="true"
            />
          </summary>
          <div class="card-body gap-4 px-5 pb-5 pt-0">
            <p class="text-sm text-base-content/65">
              {{ t("account.deleteDescription") }}
            </p>
            <GttButton
              mode="outline"
              color="error"
              v-if="!showDeleteConfirmation"
              class="self-start"
              type="button"
              :disabled="isChangingPassword"
              @click="showDeleteConfirmation = true"
            >
              {{ t("account.deleteAccount") }}
            </GttButton>
            <form
              v-else
              class="flex flex-col gap-4"
              @submit.prevent="confirmDeleteAccount"
            >
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
              <p v-if="deleteError" class="text-sm text-error" role="alert">
                {{ deleteError }}
              </p>
              <div class="flex flex-wrap justify-end gap-2">
                <GttButton
                  mode="ghost"
                  type="button"
                  :disabled="isDeletingAccount"
                  @click="cancelDelete"
                >
                  {{ t("account.cancel") }}
                </GttButton>
                <GttButton
                  color="error"
                  type="submit"
                  :disabled="
                    isDeletingAccount ||
                    !deleteConfirmed ||
                    !deletePassword ||
                    isChangingPassword
                  "
                >
                  <span
                    v-if="isDeletingAccount"
                    class="loading loading-spinner loading-sm"
                  />
                  {{ t("account.deletePermanently") }}
                </GttButton>
              </div>
            </form>
          </div>
        </details>
        <details class="card border border-base-300/50 bg-base-100">
          <summary
            class="account-card-summary flex cursor-pointer items-center justify-between gap-4 rounded-2xl p-5 font-bold outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
          >
            <span class="flex min-w-0 items-center gap-3"
              ><CircleHelp
                :size="19"
                class="shrink-0 text-base-content/55"
                aria-hidden="true"
              />{{ t("tour.help") }}</span
            >
            <ChevronDown
              class="account-card-chevron size-5 shrink-0 text-base-content/50 transition-transform"
              aria-hidden="true"
            />
          </summary>
          <div class="card-body gap-3 px-5 pb-5 pt-0">
            <p class="text-sm text-base-content/65">
              {{ t("tour.replayDescription") }}
            </p>
            <GttButton
              mode="outline"
              class="self-start"
              type="button"
              :disabled="isTourRunning || !!activeWorkoutSessionRef"
              @click="startTour"
            >
              {{ t("tour.replay") }}
            </GttButton>
            <p
              v-if="activeWorkoutSessionRef"
              class="text-sm text-base-content/60"
            >
              {{ t("tour.workoutActive") }}
            </p>
            <p v-if="tourError" class="text-sm text-error" role="alert">
              {{ t("tour.error") }}
            </p>
            <GttButton
              mode="ghost"
              class="self-start"
              type="button"
              @click="showSurprise = true"
              ><Gift :size="18" aria-hidden="true" />{{
                t("account.surprise")
              }}</GttButton
            >
          </div>
        </details>
      </div>
    </div>
    <footer v-if="currentUser"
      class="flex items-center justify-end border-t border-base-300/50 pt-4"
    >
      <GttButton
        mode="ghost"
        type="button"
        :disabled="isDeletingAccount || isChangingPassword"
        @click="logout"
        ><LogOut :size="18" aria-hidden="true" />{{
          t("account.logout")
        }}</GttButton
      >
    </footer>
  </section>
</template>

<script setup lang="ts">
import {
  presenceEnabled,
  presenceReady,
  presenceSaving,
  presenceError,
  setPresenceEnabled,
} from "@/services/presence";
import AccountPhoto from "@/components/account/AccountPhoto.vue";
import GttModal from "@/components/generic/GttModal.vue";
import GttCheckboxField from "@/components/generic/form/GttCheckboxField.vue";
import GttInputField from "@/components/generic/form/GttInputField.vue";
import GttSelectField from "@/components/generic/form/GttSelectField.vue";
import GttToggleField from "@/components/generic/form/GttToggleField.vue";
import { showToast } from "@/composables/toast";
import { useAppTour } from "@/composables/useAppTour";
import { authErrorMessage, useAuth } from "@/composables/useAuth";
import { useFriendEmail } from "@/composables/useFriendEmail";
import { useLanguage } from "@/composables/useLanguage";
import { useTheme } from "@/composables/useTheme";
import { useWorkoutPreferences } from "@/composables/useWorkoutPreferences";
import { activeWorkoutSessionRef } from "@/stores/workoutCreator";
import {
  ChevronDown,
  CircleHelp,
  Gift,
  LockKeyhole,
  LogOut,
  SlidersHorizontal,
  UserRound,
} from "@lucide/vue";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
const { t, locale } = useI18n();
const showSurprise = ref(false);

const { startTour, isTourRunning, tourError } = useAppTour();
const { themePreference } = useTheme();
const themeOptions = computed(() => [
  { id: "auto", label: t("account.auto") },
  { id: "light", label: t("account.light") },
  { id: "dark", label: t("account.dark") },
]);
const languageOptions = [
  { id: "it", label: "Italiano" },
  { id: "en", label: "English" },
];
function setTheme(value?: string) {
  if (value === "auto" || value === "light" || value === "dark")
    themePreference.value = value;
}
const { isLanguageReady, isSavingLanguage, languageError, changeLanguage } =
  useLanguage();
const { timerSounds, timerVibration, keepScreenAwake } =
  useWorkoutPreferences();
const {
  changePassword,
  deleteAccount,
  currentUser,
  signOut,
  updateDisplayName,
} = useAuth();
const router = useRouter();
const friendEmail = useFriendEmail();
const displayName = ref(currentUser.value?.displayName ?? "");
const isSavingName = ref(false);
const nameError = ref("");

watch(currentUser, (user) => {
  displayName.value = user?.displayName ?? "";
});

async function saveName() {
  const name = displayName.value.trim();
  if (!name || isSavingName.value) return;

  isSavingName.value = true;
  nameError.value = "";
  try {
    await updateDisplayName(name);
    displayName.value = name;
    showToast({ title: t("account.nameSaved") });
  } catch {
    nameError.value = t("account.nameError");
  } finally {
    isSavingName.value = false;
  }
}

const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const passwordError = ref("");
const isChangingPassword = ref(false);
const showDeleteConfirmation = ref(false);
const deletePassword = ref("");
const deleteConfirmed = ref(false);
const deleteError = ref("");
const isDeletingAccount = ref(false);

async function savePassword() {
  if (isChangingPassword.value || isDeletingAccount.value) return;
  passwordError.value = "";
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = t("ui.passwords_do_not_match");
    return;
  }
  if (newPassword.value.length < 6) {
    passwordError.value = t("ui.password_must_contain_at_least_6_characters");
    return;
  }
  isChangingPassword.value = true;
  try {
    await changePassword(currentPassword.value, newPassword.value);
    currentPassword.value = newPassword.value = confirmPassword.value = "";
    showToast({ title: t("account.passwordSaved") });
  } catch (error) {
    passwordError.value = authErrorMessage(error);
  } finally {
    isChangingPassword.value = false;
  }
}

function cancelDelete() {
  showDeleteConfirmation.value = false;
  deletePassword.value = "";
  deleteConfirmed.value = false;
  deleteError.value = "";
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
  deleteError.value = "";
  try {
    await deleteAccount(deletePassword.value);
    await router.replace({ name: "home" });
  } catch (error) {
    deleteError.value = authErrorMessage(error);
  } finally {
    deletePassword.value = "";
    isDeletingAccount.value = false;
  }
}

async function logout() {
  await signOut();
  await router.replace({ name: "home" });
}
</script>

<style scoped>
/* Hallmark · macrostructure: profile / grouped preferences
 * existing training system · pre-emit critique: P4 H5 E4 S4 R5 V4 */
.account-page h1,
.account-page h2,
.account-page h3 {
  min-width: 0;
  overflow-wrap: anywhere;
}
.account-page :deep(.btn) {
  min-height: var(--size-ui-control);
  white-space: nowrap;
}
@media (prefers-reduced-motion: reduce) {
  .account-card-chevron {
    transition: none;
  }
}

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
