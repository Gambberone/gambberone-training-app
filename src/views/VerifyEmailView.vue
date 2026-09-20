<template>
  <section class="card border border-base-300 bg-base-100 shadow-sm">
    <div class="card-body items-center gap-5 p-6 text-center">
      <div class="grid size-16 place-items-center rounded-full bg-primary/15 text-primary">
        <MailCheck :size="32" />
      </div>

      <div>
        <h2 class="text-xl font-bold text-base-content">Verifica la tua email</h2>
        <p class="mt-2 text-sm leading-6 text-base-content/65">
          Abbiamo inviato un link di verifica
          <template v-if="currentUser?.email"> a <strong class="text-base-content">{{ currentUser.email }}</strong></template>.
          Aprilo per confermare il tuo account.
        </p>
      </div>

      <p v-if="message" class="w-full rounded-box bg-success/10 p-3 text-sm text-success" role="status">
        {{ message }}
      </p>
      <p v-if="errorMessage" class="w-full rounded-box bg-error/10 p-3 text-sm text-error" role="alert">
        {{ errorMessage }}
      </p>

      <button class="btn btn-primary w-full" type="button" :disabled="isChecking" @click="checkVerification">
        <span v-if="isChecking" class="loading loading-spinner loading-sm" />
        Ho verificato la mia email
      </button>
      <button class="btn btn-ghost btn-sm" type="button" :disabled="isResending" @click="resendVerification">
        <span v-if="isResending" class="loading loading-spinner loading-xs" />
        Reinvia email di verifica
      </button>
      <button class="btn btn-ghost btn-sm" type="button" @click="logout">Esci dall'account</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { applyActionCode } from 'firebase/auth';
import { MailCheck } from '@lucide/vue';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { auth } from '@/firebase';
import { authErrorMessage, useAuth } from '@/composables/useAuth';

const { currentUser, sendVerificationEmail, signOut } = useAuth();
const router = useRouter();
const isChecking = ref(false);
const isResending = ref(false);
const message = ref('');
const errorMessage = ref('');

onMounted(async () => {
  const actionCode = new URLSearchParams(window.location.search).get('oobCode');
  const mode = new URLSearchParams(window.location.search).get('mode');

  if (mode !== 'verifyEmail' || !actionCode) return;

  isChecking.value = true;
  try {
    await applyActionCode(auth, actionCode);
    await checkVerification();
  } catch (error) {
    errorMessage.value = authErrorMessage(error);
  } finally {
    isChecking.value = false;
  }
});

async function checkVerification() {
  if (!currentUser.value) {
    errorMessage.value = 'Accedi per controllare lo stato della verifica.';
    return;
  }

  isChecking.value = true;
  errorMessage.value = '';
  try {
    await currentUser.value.reload();
    if (currentUser.value.emailVerified) {
      await router.replace({ name: 'home' });
    } else {
      message.value = 'Email non ancora verificata. Apri il link ricevuto e riprova.';
    }
  } catch (error) {
    errorMessage.value = authErrorMessage(error);
  } finally {
    isChecking.value = false;
  }
}

async function resendVerification() {
  if (!currentUser.value) {
    errorMessage.value = 'Accedi per richiedere una nuova email.';
    return;
  }

  isResending.value = true;
  errorMessage.value = '';
  try {
    await sendVerificationEmail();
    message.value = 'Abbiamo inviato una nuova email di verifica.';
  } catch (error) {
    errorMessage.value = authErrorMessage(error);
  } finally {
    isResending.value = false;
  }
}

async function logout() {
  await signOut();
  await router.replace({ name: 'login' });
}
</script>
