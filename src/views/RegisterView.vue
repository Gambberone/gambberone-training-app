<template>
  <section class="auth-panel">
    <form class="auth-form" :aria-busy="isSubmitting" @submit.prevent="submit">
      <div class="auth-form-header">
        <h1>{{ tr('ui.create_your_account') }}</h1>
        <p class="mt-1 text-sm text-base-content/65">{{ tr('ui.start_tracking_your_progress') }}</p>
      </div>

      <GttInputField
        id="register-email"
        :label="tr('ui.email')"
        compact
        v-model="email"
        type="email"
        autocomplete="email"
        :placeholder="tr('ui.name_email_com')"
        required
      >
        <template #prefix><Mail :size="18" class="text-base-content/55" /></template>
      </GttInputField>

      <GttInputField
        id="register-password"
        :label="tr('ui.password')"
        compact
        v-model="password"
        :type="isPasswordVisible ? 'text' : 'password'"
        autocomplete="new-password"
        :placeholder="tr('ui.your_password')"
        :hint="tr('ui.at_least_6_characters')"
        minlength="6"
        required
      >
        <template #prefix><LockKeyhole :size="18" class="text-base-content/55" /></template>
        <template #suffix>
          <GttButton mode="ghost" size="xs" shape="square" class="auth-password-toggle"
            type="button" :aria-label="tr(isPasswordVisible ? 'ui.hide_password' : 'ui.show_password')"
            @click="isPasswordVisible = !isPasswordVisible">
            <EyeOff v-if="isPasswordVisible" :size="18" /><Eye v-else :size="18" />
          </GttButton>
        </template>
      </GttInputField>

      <GttInputField
        id="register-passwordConfirmation"
        :error="confirmationError"
        @input="confirmationError = ''"
        :label="tr('ui.confirm_password')"
        compact
        v-model="passwordConfirmation"
        :type="isPasswordVisible ? 'text' : 'password'"
        autocomplete="new-password"
        :placeholder="tr('ui.repeat_your_password')"
        minlength="6"
        required
      >
        <template #prefix><LockKeyhole :size="18" class="text-base-content/55" /></template>
      </GttInputField>

      <p v-if="errorMessage" class="auth-notice auth-notice--error" role="alert">
        {{ errorMessage }}
      </p>

      <GttButton color="primary" class="auth-submit" type="submit" :disabled="isSubmitting">
        <span v-if="isSubmitting" class="loading loading-spinner loading-sm" />
        {{ tr(isSubmitting ? 'authDesign.creatingAccount' : 'ui.create_account') }}
      </GttButton>

      <p class="auth-switch">
        {{ tr('ui.already_have_an_account') }}
        <RouterLink class="auth-link" to="/auth/login">
          {{ tr('ui.sign_in') }}
        </RouterLink>
      </p>
    </form>
  </section>
</template>

<script setup lang="ts">
import GttInputField from '@/components/generic/form/GttInputField.vue';
import { authErrorMessage, useAuth } from '@/composables/useAuth';
import { tr } from '@/localization';
import { Eye, EyeOff, LockKeyhole, Mail } from '@lucide/vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const passwordConfirmation = ref('');
const isPasswordVisible = ref(false);
const confirmationError = ref('');
const isSubmitting = ref(false);
const errorMessage = ref('');
const router = useRouter();
const { register, sendVerificationEmail } = useAuth();

async function submit() {
  if (password.value !== passwordConfirmation.value) {
    confirmationError.value = tr('ui.passwords_do_not_match');
    return;
  }

  confirmationError.value = '';
  isSubmitting.value = true;
  errorMessage.value = '';

  try {
    const credential = await register(email.value, password.value);
    await sendVerificationEmail(credential.user);
    await router.replace({ name: 'verify-email' });
  } catch (error) {
    errorMessage.value = authErrorMessage(error);
  } finally {
    isSubmitting.value = false;
  }
}
</script>
