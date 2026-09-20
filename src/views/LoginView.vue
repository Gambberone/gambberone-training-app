<template>
  <section class="card border border-base-300 bg-base-100 shadow-sm">
    <form class="card-body gap-5 p-6" @submit.prevent>
      <div>
        <h2 class="text-xl font-bold text-base-content">Bentornato</h2>
        <p class="mt-1 text-sm text-base-content/65">Accedi per riprendere il tuo percorso.</p>
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
            :type="isPasswordVisible ? 'text' : 'password'"
            autocomplete="current-password"
            placeholder="La tua password"
            required
          />
          <button
            class="btn btn-ghost btn-xs btn-square"
            type="button"
            :aria-label="isPasswordVisible ? 'Nascondi password' : 'Mostra password'"
            @click="isPasswordVisible = !isPasswordVisible"
          >
            <EyeOff v-if="isPasswordVisible" :size="18" />
            <Eye v-else :size="18" />
          </button>
        </div>
      </label>

      <button class="btn btn-primary w-full" type="submit">Accedi</button>

      <button class="btn btn-ghost btn-sm -mt-2" type="button" disabled>
        Password dimenticata?
      </button>

      <p class="text-center text-sm text-base-content/65">
        Non hai ancora un account?
        <RouterLink class="font-semibold text-primary hover:underline" to="/auth/register">
          Registrati
        </RouterLink>
      </p>
    </form>
  </section>
</template>

<script setup lang="ts">
import { Eye, EyeOff, LockKeyhole, Mail } from '@lucide/vue';
import { ref } from 'vue';

const email = ref('');
const password = ref('');
const isPasswordVisible = ref(false);
</script>
