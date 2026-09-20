<template>
  <section class="mx-auto max-w-2xl">
    <header class="mb-7">
      <p class="mb-1 text-sm font-semibold text-primary">Preferenze</p>
      <h1 class="text-3xl font-bold tracking-tight text-base-content">Account</h1>
      <p class="mt-2 text-base-content/65">Personalizza l'aspetto dell'app.</p>
    </header>

    <article class="card border border-base-300 bg-base-100 shadow-sm">
      <div class="card-body flex-row items-center justify-between gap-4 p-5">
        <div>
          <h2 class="font-bold text-base-content">Modalità scura</h2>
          <p class="mt-1 text-sm text-base-content/65">Attiva un tema più riposante per gli occhi.</p>
        </div>
        <input
          v-model="isDark"
          type="checkbox"
          class="toggle toggle-primary"
          aria-label="Attiva la modalità scura"
        />
      </div>
    </article>

    <article class="card mt-4 border border-base-300 bg-base-100 shadow-sm">
      <div class="card-body gap-4 p-5">
        <div>
          <h2 class="font-bold text-base-content">Sessione</h2>
          <p class="mt-1 text-sm text-base-content/65">{{ currentUser?.email }}</p>
        </div>
        <button class="btn btn-outline btn-error w-full" type="button" @click="logout">
          Esci dall'account
        </button>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import { useTheme } from '@/composables/useTheme';

const { isDark } = useTheme();
const { currentUser, signOut } = useAuth();
const router = useRouter();

async function logout() {
  await signOut();
  await router.replace({ name: 'login' });
}
</script>
