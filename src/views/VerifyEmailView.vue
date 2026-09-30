<template>
  <section class="card border border-base-300 bg-base-100 shadow-sm">
    <div class="card-body items-center gap-5 p-6 text-center">
      <div class="grid size-16 place-items-center rounded-full bg-primary/15 text-primary">
        <MailCheck :size="32" />
      </div>

      <div>
        <h2 class="text-xl font-bold text-base-content">{{ tr('ui.verify_your_email') }}</h2>
        <p class="mt-2 text-sm leading-6 text-base-content/65">
          {{ tr('messages.verifySent', { email: currentUser?.email ?? '' }) }}
        </p>
      </div>

      <p
        v-if="message"
        class="w-full rounded-box bg-success/10 p-3 text-sm text-success"
        role="status"
      >
        {{ message }}
      </p>
      <p
        v-if="errorMessage"
        class="w-full rounded-box bg-error/10 p-3 text-sm text-error"
        role="alert"
      >
        {{ errorMessage }}
      </p>

      <GttButton color="primary"
        class="w-full"
        type="button"
        :disabled="isChecking"
        @click="checkVerification"
      >
        <span v-if="isChecking" class="loading loading-spinner loading-sm" />
        {{ tr('ui.i_have_verified_my_email') }}
      </GttButton>
      <GttButton mode="ghost" size="sm"
        
        type="button"
        :disabled="isResending"
        @click="resendVerification"
      >
        <span v-if="isResending" class="loading loading-spinner loading-xs" />
        {{ tr('ui.resend_verification_email') }}
      </GttButton>
      <GttButton mode="ghost" size="sm"  type="button" @click="logout">
        {{ tr('ui.sign_out') }}
      </GttButton>
    </div>
  </section>
</template>

<script setup lang="ts">
import { authErrorMessage, useAuth } from '@/composables/useAuth';
import { auth } from '@/firebase';
import { tr } from '@/localization';
import { MailCheck } from '@lucide/vue';
import { applyActionCode } from 'firebase/auth';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

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
    errorMessage.value = tr('ui.sign_in_to_check_your_verification_status');
    return;
  }

  isChecking.value = true;
  errorMessage.value = '';
  try {
    await currentUser.value.reload();
    if (currentUser.value.emailVerified) {
      await router.replace({ name: 'home' });
    } else {
      message.value = tr('messages.notVerified');
    }
  } catch (error) {
    errorMessage.value = authErrorMessage(error);
  } finally {
    isChecking.value = false;
  }
}

async function resendVerification() {
  if (!currentUser.value) {
    errorMessage.value = tr('ui.sign_in_to_request_another_email');
    return;
  }

  isResending.value = true;
  errorMessage.value = '';
  try {
    await sendVerificationEmail();
    message.value = tr('messages.verificationResent');
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
