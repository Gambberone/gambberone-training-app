<template>
  <section class="auth-panel">
    <form class="auth-form" :aria-busy="isSubmitting" @submit.prevent="submit">
      <div class="auth-form-header">
        <h1>{{ tr('ui.reset_password') }}</h1>
        <p class="mt-1 text-sm leading-6 text-base-content/65">
          {{ tr('ui.enter_your_email_to_receive_a_secure_link_to_choose_a_new_password') }}
        </p>
      </div>

      <GttInputField
        id="recovery-email"
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

      <p v-if="message" class="auth-notice auth-notice--success" role="status">
        {{ message }}
      </p>
      <p v-if="errorMessage" class="auth-notice auth-notice--error" role="alert">
        {{ errorMessage }}
      </p>

      <GttButton color="primary" class="auth-submit" type="submit" :disabled="isSubmitting">
        <span v-if="isSubmitting" class="loading loading-spinner loading-sm" />
        {{ tr(isSubmitting ? 'authDesign.sending' : 'ui.send_recovery_link') }}
      </GttButton>

      <RouterLink class="auth-link" to="/auth/login">{{
        tr('ui.back_to_sign_in')
      }}</RouterLink>
    </form>
  </section>
</template>

<script setup lang="ts">
import GttInputField from '@/components/generic/form/GttInputField.vue';
import { authErrorMessage, useAuth } from '@/composables/useAuth';
import { tr } from '@/localization';
import { Mail } from '@lucide/vue';
import { ref } from 'vue';

const email = ref('');
const isSubmitting = ref(false);
const message = ref('');
const errorMessage = ref('');
const { resetPassword } = useAuth();

async function submit() {
  isSubmitting.value = true;
  message.value = '';
  errorMessage.value = '';

  try {
    await resetPassword(email.value);
    message.value = tr('messages.recoveryEmail');
  } catch (error) {
    errorMessage.value = authErrorMessage(error);
  } finally {
    isSubmitting.value = false;
  }
}
</script>
