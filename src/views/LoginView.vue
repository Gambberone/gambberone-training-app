<template>
  <section class="auth-panel">
    <form class="auth-form" :aria-busy="isSubmitting" @submit.prevent="submit">
      <div class="auth-form-header">
        <h1>{{ tr('ui.welcome_back') }}</h1>
        <p class="mt-1 text-sm text-base-content/65">
          {{ tr('ui.sign_in_to_continue_your_journey') }}
        </p>
      </div>

      <GttInputField
        id="login-email"
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

      <div class="auth-password-row">
        <GttInputField
          id="login-password"
          :label="tr('ui.password')"
          compact
          v-model="password"
          :type="isPasswordVisible ? 'text' : 'password'"
          autocomplete="current-password"
          :placeholder="tr('ui.your_password')"
          required
        >
          <template #prefix><LockKeyhole :size="18" class="text-base-content/55" /></template>
          <template #suffix>
            <GttButton mode="ghost" size="xs" shape="square" class="auth-password-toggle"
              type="button"
              :aria-label="tr(isPasswordVisible ? 'ui.hide_password' : 'ui.show_password')"
              @click="isPasswordVisible = !isPasswordVisible"
            >
              <EyeOff v-if="isPasswordVisible" :size="18" />
              <Eye v-else :size="18" />
            </GttButton>
          </template>
        </GttInputField>
        <RouterLink class="auth-link" to="/auth/forgot-password">{{ tr('ui.forgot_password') }}</RouterLink>
      </div>

      <p v-if="errorMessage" class="auth-notice auth-notice--error" role="alert">
        {{ errorMessage }}
      </p>

      <GttButton color="primary" class="auth-submit" type="submit" :disabled="isSubmitting">
        <span v-if="isSubmitting" class="loading loading-spinner loading-sm" />
        {{ tr(isSubmitting ? 'authDesign.signingIn' : 'ui.sign_in') }}
      </GttButton>

      <p class="auth-switch">
        {{ tr('ui.don_t_have_an_account_yet') }}
        <RouterLink class="auth-link" to="/auth/register">
          {{ tr('ui.sign_up') }}
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
const isPasswordVisible = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref('');
const router = useRouter();
const { signIn } = useAuth();

async function submit() {
  isSubmitting.value = true;
  errorMessage.value = '';

  try {
    await signIn(email.value, password.value);
    await router.replace({ name: 'home' });
  } catch (error) {
    errorMessage.value = authErrorMessage(error);
  } finally {
    isSubmitting.value = false;
  }
}
</script>
