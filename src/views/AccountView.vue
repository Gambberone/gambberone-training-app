<template>
  <section class="mx-auto max-w-2xl">
    <header class="mb-7">
      <p class="mb-1 text-sm font-semibold text-primary">Preferenze</p>
      <h1 class="text-3xl font-bold tracking-tight text-base-content">Account</h1>
      <p class="mt-2 text-base-content/65">Gestisci il tuo profilo e l'aspetto dell'app.</p>
    </header>

    <article class="card border border-base-300 bg-base-100 shadow-sm">
      <form class="card-body gap-4 p-5" @submit.prevent="saveName">
        <div>
          <h2 class="font-bold text-base-content">Profilo</h2>
          <p class="mt-1 text-sm text-base-content/65">Scegli la foto e il nome da mostrare nell'app.</p>
        </div>
        <div class="flex items-center gap-4">
          <div class="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/15 text-primary">
            <img v-if="profilePhoto" :src="profilePhoto" alt="Foto del profilo" class="h-full w-full object-cover" />
            <UserRound v-else class="size-8" aria-hidden="true" />
          </div>
          <div class="flex flex-wrap gap-2">
            <label class="btn btn-outline btn-sm" :class="{ 'btn-disabled': isSavingPhoto }">
              <span v-if="isSavingPhoto" class="loading loading-spinner loading-xs" />
              {{ profilePhoto ? 'Cambia foto' : 'Carica foto' }}
              <input class="sr-only" type="file" accept="image/jpeg,image/png,image/webp"
                :disabled="isSavingPhoto" aria-label="Scegli una foto del profilo" @change="savePhoto" />
            </label>
            <button v-if="profilePhoto" class="btn btn-ghost btn-sm" type="button"
              :disabled="isSavingPhoto" @click="removePhoto">Rimuovi foto</button>
          </div>
        </div>
        <p class="text-xs text-base-content/60">JPG, PNG o WebP, massimo 5 MB.</p>
        <p v-if="photoError" class="text-sm text-error" role="alert">{{ photoError }}</p>
        <label class="form-control w-full gap-2">
          <span class="label-text font-semibold text-base-content">Nome visualizzato</span>
          <input v-model="displayName" class="input input-bordered w-full" type="text"
            autocomplete="nickname" maxlength="60" placeholder="Il tuo nome" required />
        </label>
        <p v-if="nameError" class="text-sm text-error" role="alert">{{ nameError }}</p>
        <button class="btn btn-primary self-end" type="submit"
          :disabled="isSavingName || !displayName.trim() || displayName.trim() === (currentUser?.displayName ?? '')">
          <span v-if="isSavingName" class="loading loading-spinner loading-sm" />
          Salva nome
        </button>
      </form>
    </article>

    <article class="card mt-4 border border-base-300 bg-base-100 shadow-sm">
      <div class="card-body gap-4 p-5">
        <div>
          <h2 class="font-bold text-base-content">Personalizzazione</h2>
          <p class="mt-1 text-sm text-base-content/65">Adatta l'app ai tuoi allenamenti.</p>
        </div>
        <label class="form-control w-full gap-2">
          <span class="label-text font-semibold text-base-content">Tema</span>
          <select v-model="themePreference" class="select select-bordered w-full">
            <option value="auto">Automatico (dispositivo)</option>
            <option value="light">Chiaro</option>
            <option value="dark">Scuro</option>
          </select>
        </label>
        <div class="divider my-0" />
        <label class="flex cursor-pointer items-center justify-between gap-4">
          <span>
            <span class="block font-semibold text-base-content">Suoni del timer</span>
            <span class="mt-1 block text-sm text-base-content/65">Segnali sonori quando mancano 3, 2 e 1 secondi o ripetizioni.</span>
          </span>
          <input v-model="timerSounds" type="checkbox" class="toggle toggle-primary shrink-0" />
        </label>
        <div class="divider my-0" />
        <label class="flex cursor-pointer items-center justify-between gap-4">
          <span>
            <span class="block font-semibold text-base-content">Vibrazione del timer</span>
            <span class="mt-1 block text-sm text-base-content/65">Vibra durante il conto alla rovescia e al cambio di step, se supportato.</span>
          </span>
          <input v-model="timerVibration" type="checkbox" class="toggle toggle-primary shrink-0" />
        </label>
        <div class="divider my-0" />
        <label class="flex cursor-pointer items-center justify-between gap-4">
          <span>
            <span class="block font-semibold text-base-content">Schermo sempre acceso</span>
            <span class="mt-1 block text-sm text-base-content/65">Evita lo spegnimento dello schermo durante il workout, se supportato.</span>
          </span>
          <input v-model="keepScreenAwake" type="checkbox" class="toggle toggle-primary shrink-0" />
        </label>
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
import { ref, watch } from 'vue';
import { UserRound } from '@lucide/vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import { useTheme } from '@/composables/useTheme';
import { useWorkoutPreferences } from '@/composables/useWorkoutPreferences';
import { showToast } from '@/composables/toast';

const { themePreference } = useTheme();
const { timerSounds, timerVibration, keepScreenAwake } = useWorkoutPreferences();
const { currentUser, profilePhoto, signOut, updateDisplayName, updateProfilePhoto, removeProfilePhoto } = useAuth();
const router = useRouter();
const displayName = ref(currentUser.value?.displayName ?? '');
const isSavingName = ref(false);
const nameError = ref('');
const photoError = ref('');
const isSavingPhoto = ref(false);

watch(currentUser, (user) => {
  displayName.value = user?.displayName ?? '';
});

async function saveName() {
  const name = displayName.value.trim();
  if (!name || isSavingName.value) return;

  isSavingName.value = true;
  nameError.value = '';
  try {
    await updateDisplayName(name);
    displayName.value = name;
    showToast({ title: 'Nome aggiornato' });
  } catch {
    nameError.value = 'Impossibile salvare il nome. Riprova.';
  } finally {
    isSavingName.value = false;
  }
}

async function savePhoto(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file || isSavingPhoto.value) return;

  photoError.value = '';
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    photoError.value = 'Scegli un file JPG, PNG o WebP.';
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    photoError.value = 'La foto non può superare 5 MB.';
    return;
  }

  isSavingPhoto.value = true;
  try {
    await updateProfilePhoto(file);
    showToast({ title: 'Foto aggiornata' });
  } catch {
    photoError.value = 'Impossibile salvare la foto. Riprova.';
  } finally {
    isSavingPhoto.value = false;
  }
}

async function removePhoto() {
  if (isSavingPhoto.value) return;
  isSavingPhoto.value = true;
  photoError.value = '';
  try {
    await removeProfilePhoto();
    showToast({ title: 'Foto rimossa' });
  } catch {
    photoError.value = 'Impossibile rimuovere la foto. Riprova.';
  } finally {
    isSavingPhoto.value = false;
  }
}

async function logout() {
  await signOut();
  await router.replace({ name: 'login' });
}
</script>
