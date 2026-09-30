<template>
  <section class="card border border-base-300 bg-base-100 shadow-sm">
    <form class="card-body gap-5 p-6" @submit.prevent="submit">
      <div>
        <h2 class="text-xl font-bold text-base-content">{{ tr('ui.reset_password') }}</h2>
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

      <p v-if="message" class="rounded-box bg-success/10 p-3 text-sm text-success" role="status">
        {{ message }}
      </p>
      <p v-if="errorMessage" class="rounded-box bg-error/10 p-3 text-sm text-error" role="alert">
        {{ errorMessage }}
      </p>

      <GttButton color="primary" class="w-full" type="submit" :disabled="isSubmitting">
        <span v-if="isSubmitting" class="loading loading-spinner loading-sm" />
        {{ tr('ui.send_recovery_link') }}
      </GttButton>

      <RouterLink class="btn btn-ghost btn-sm" to="/auth/login">{{
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
