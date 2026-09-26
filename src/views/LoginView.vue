<template>
  <section class="card border border-base-300 bg-base-100 shadow-sm">
    <form class="card-body gap-5 p-6" @submit.prevent="submit">
      <div>
        <h2 class="text-xl font-bold text-base-content">{{ tr('ui.welcome_back') }}</h2>
        <p class="mt-1 text-sm text-base-content/65">{{ tr('ui.sign_in_to_continue_your_journey') }}</p>
      </div>

      <GttInputField id="login-email" :label="tr('ui.email')" compact v-model="email"
            type="email"
            autocomplete="email"
            :placeholder="tr('ui.name_email_com')"
            required>
        <template #prefix><Mail :size="18" class="text-base-content/55" /></template>
      </GttInputField>

      <GttInputField id="login-password" :label="tr('ui.password')" compact v-model="password"
            :type="isPasswordVisible ? 'text' : 'password'"
            autocomplete="current-password"
            :placeholder="tr('ui.your_password')"
            required>
        <template #prefix><LockKeyhole :size="18" class="text-base-content/55" /></template>
        <template #suffix><button
            class="btn btn-ghost btn-xs btn-square"
            type="button"
            :aria-label="tr(isPasswordVisible ? 'ui.hide_password' : 'ui.show_password')"
            @click="isPasswordVisible = !isPasswordVisible"
          >
            <EyeOff v-if="isPasswordVisible" :size="18" />
            <Eye v-else :size="18" />
          </button></template>
      </GttInputField>

      <p v-if="errorMessage" class="rounded-box bg-error/10 p-3 text-sm text-error" role="alert">
        {{ errorMessage }}
      </p>

      <button class="btn btn-primary w-full" type="submit" :disabled="isSubmitting">
        <span v-if="isSubmitting" class="loading loading-spinner loading-sm" />
        {{ tr('ui.sign_in') }}
      </button>

      <RouterLink class="btn btn-ghost btn-sm -mt-2" to="/auth/forgot-password">
        {{ tr('ui.forgot_password') }}
      </RouterLink>

      <p class="text-center text-sm text-base-content/65">
        {{ tr('ui.don_t_have_an_account_yet') }}
        <RouterLink class="font-semibold text-primary hover:underline" to="/auth/register">
          {{ tr('ui.sign_up') }}
        </RouterLink>
      </p>
    </form>
  </section>
</template>

<script setup lang="ts">
import GttInputField from '@/components/generic/form/GttInputField.vue';
import { tr } from '@/localization';
import { Eye, EyeOff, LockKeyhole, Mail } from '@lucide/vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { authErrorMessage, useAuth } from '@/composables/useAuth';

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
