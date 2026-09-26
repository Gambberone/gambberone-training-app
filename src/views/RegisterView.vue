<template>
  <section class="card border border-base-300 bg-base-100 shadow-sm">
    <form class="card-body gap-5 p-6" @submit.prevent="submit">
      <div>
        <h2 class="text-xl font-bold text-base-content">{{ tr('ui.create_your_account') }}</h2>
        <p class="mt-1 text-sm text-base-content/65">{{ tr('ui.start_tracking_your_progress') }}</p>
      </div>

      <GttInputField id="register-email" :label="tr('ui.email')" compact v-model="email"
            type="email"
            autocomplete="email"
            :placeholder="tr('ui.name_email_com')"
            required>
        <template #prefix><Mail :size="18" class="text-base-content/55" /></template>
      </GttInputField>

      <GttInputField id="register-password" :label="tr('ui.password')" compact v-model="password"
            type="password"
            autocomplete="new-password"
            :placeholder="tr('ui.at_least_6_characters')"
            minlength="6"
            required>
        <template #prefix><LockKeyhole :size="18" class="text-base-content/55" /></template>
      </GttInputField>

      <GttInputField id="register-passwordConfirmation" :label="tr('ui.confirm_password')" compact v-model="passwordConfirmation"
            type="password"
            autocomplete="new-password"
            :placeholder="tr('ui.repeat_your_password')"
            minlength="6"
            required>
        <template #prefix><LockKeyhole :size="18" class="text-base-content/55" /></template>
      </GttInputField>

      <p v-if="errorMessage" class="rounded-box bg-error/10 p-3 text-sm text-error" role="alert">
        {{ errorMessage }}
      </p>

      <button class="btn btn-primary mt-1 w-full" type="submit" :disabled="isSubmitting">
        <span v-if="isSubmitting" class="loading loading-spinner loading-sm" />
        {{ tr('ui.create_account') }}
      </button>

      <p class="text-center text-sm text-base-content/65">
        {{ tr('ui.already_have_an_account') }}
        <RouterLink class="font-semibold text-primary hover:underline" to="/auth/login">
          {{ tr('ui.sign_in') }}
        </RouterLink>
      </p>
    </form>
  </section>
</template>

<script setup lang="ts">
import GttInputField from '@/components/generic/form/GttInputField.vue';
import { tr } from '@/localization';
import { LockKeyhole, Mail } from '@lucide/vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { authErrorMessage, useAuth } from '@/composables/useAuth';

const email = ref('');
const password = ref('');
const passwordConfirmation = ref('');
const isSubmitting = ref(false);
const errorMessage = ref('');
const router = useRouter();
const { register, sendVerificationEmail } = useAuth();

async function submit() {
  if (password.value !== passwordConfirmation.value) {
    errorMessage.value = tr('ui.passwords_do_not_match');
    return;
  }

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
