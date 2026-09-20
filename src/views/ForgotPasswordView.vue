<template>
  <section class="card border border-base-300 bg-base-100 shadow-sm">
    <form class="card-body gap-5 p-6" @submit.prevent="submit">
      <div>
        <h2 class="text-xl font-bold text-base-content">Reimposta password</h2>
        <p class="mt-1 text-sm leading-6 text-base-content/65">
          Inserisci la tua email: riceverai un link sicuro per scegliere una nuova password.
        </p>
      </div>

      <label class="form-control w-full gap-2">
        <span class="label-text font-semibold text-base-content">Email</span>
        <div class="input w-full">
          <Mail :size="18" class="text-base-content/55" />
          <input v-model="email" type="email" autocomplete="email" placeholder="nome@email.com" required />
        </div>
      </label>

      <p v-if="message" class="rounded-box bg-success/10 p-3 text-sm text-success" role="status">
        {{ message }}
      </p>
      <p v-if="errorMessage" class="rounded-box bg-error/10 p-3 text-sm text-error" role="alert">
        {{ errorMessage }}
      </p>

      <button class="btn btn-primary w-full" type="submit" :disabled="isSubmitting">
        <span v-if="isSubmitting" class="loading loading-spinner loading-sm" />
        Invia link di recupero
      </button>

      <RouterLink class="btn btn-ghost btn-sm" to="/auth/login">Torna al login</RouterLink>
    </form>
  </section>
</template>

<script setup lang="ts">
import { Mail } from '@lucide/vue';
import { ref } from 'vue';
import { authErrorMessage, useAuth } from '../composables/useAuth';

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
    message.value = 'Se esiste un account per questa email, riceverai a breve il link di recupero.';
  } catch (error) {
    errorMessage.value = authErrorMessage(error);
  } finally {
    isSubmitting.value = false;
  }
}
</script>
