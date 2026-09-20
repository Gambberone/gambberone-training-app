<template>
  <section class="card border border-base-300 bg-base-100 shadow-sm">
    <form class="card-body gap-5 p-6" @submit.prevent>
      <div>
        <h2 class="text-xl font-bold text-base-content">Crea il tuo account</h2>
        <p class="mt-1 text-sm text-base-content/65">Inizia a tenere traccia dei tuoi progressi.</p>
      </div>

      <label class="form-control w-full gap-2">
        <span class="label-text font-semibold text-base-content">Email</span>
        <div class="input w-full">
          <Mail :size="18" class="text-base-content/55" />
          <input
            v-model="email"
            type="email"
            autocomplete="email"
            placeholder="nome@email.com"
            required
          />
        </div>
      </label>

      <label class="form-control w-full gap-2">
        <span class="label-text font-semibold text-base-content">Password</span>
        <div class="input w-full">
          <LockKeyhole :size="18" class="text-base-content/55" />
          <input
            v-model="password"
            type="password"
            autocomplete="new-password"
            placeholder="Almeno 6 caratteri"
            minlength="6"
            required
          />
        </div>
      </label>

      <label class="form-control w-full gap-2">
        <span class="label-text font-semibold text-base-content">Conferma password</span>
        <div class="input w-full">
          <LockKeyhole :size="18" class="text-base-content/55" />
          <input
            v-model="passwordConfirmation"
            type="password"
            autocomplete="new-password"
            placeholder="Ripeti la password"
            minlength="6"
            required
          />
        </div>
      </label>

      <button class="btn btn-primary mt-1 w-full" type="submit">Crea account</button>

      <p class="text-center text-sm text-base-content/65">
        Hai già un account?
        <RouterLink class="font-semibold text-primary hover:underline" to="/auth/login">
          Accedi
        </RouterLink>
      </p>
    </form>
  </section>
</template>

<script setup lang="ts">
import { LockKeyhole, Mail } from '@lucide/vue';
import { ref } from 'vue';

const email = ref('');
const password = ref('');
const passwordConfirmation = ref('');
</script>
