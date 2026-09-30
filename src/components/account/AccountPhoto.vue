<template>
  <div class="flex items-center gap-4">
    <GttButton unstyled
      v-if="profilePhoto"
      type="button"
      class="size-16 shrink-0 overflow-hidden rounded-full ring-offset-base-100 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      :aria-label="t('account.viewPhoto')"
      @click="viewerOpen = true"
    >
      <img :src="profilePhoto" :alt="t('account.photo')" class="h-full w-full object-cover" />
    </GttButton>
    <div
      v-else
      class="grid size-16 shrink-0 place-items-center rounded-full bg-primary/15 text-primary"
    >
      <UserRound class="size-8" aria-hidden="true" />
    </div>
    <GttButton mode="outline" size="sm"
      v-if="!profilePhoto"
      
      type="button"
      :disabled="busy"
      @click="fileInput?.open()"
    >
      {{ t('account.uploadPhoto') }}
    </GttButton>
    <p v-else class="text-sm text-base-content/60">{{ t('account.viewPhotoHint') }}</p>
    <GttFileField
      ref="fileInput"
      accept="image/jpeg,image/png,image/webp"
      :label="t('account.choosePhoto')"
      :disabled="busy"
      @change="selectPhoto"
    />
  </div>
  <p v-if="!profilePhoto" class="text-xs text-base-content/60">{{ t('account.photoHint') }}</p>
  <p v-if="error && !viewerOpen && !cropOpen" class="text-sm text-error" role="alert">
    {{ error }}
  </p>

  <GttModal
    class="photo-viewer"
    v-model="viewerOpen"
    :title="t('account.photo')"
    full
    enable-full-screen
    :before-close="() => !busy"
  >
    <div class="flex min-h-full flex-col items-center justify-center gap-5">
      <img
        v-if="profilePhoto"
        :src="profilePhoto"
        :alt="t('account.photo')"
        class="max-h-[65dvh] w-full object-contain"
      />
      <p v-if="error" class="text-sm text-error" role="alert">{{ error }}</p>
      <div class="flex flex-wrap justify-center gap-3">
        <GttButton color="primary"  type="button" :disabled="busy" @click="fileInput?.open()">
          {{ t('account.changePhoto') }}
        </GttButton>
        <GttButton mode="outline" color="error"
          
          type="button"
          :disabled="busy"
          @click="removePhoto"
        >
          <span v-if="busy" class="loading loading-spinner loading-sm" />{{
            t('account.removePhoto')
          }}
        </GttButton>
      </div>
    </div>
  </GttModal>

  <GttModal
    v-model="cropOpen"
    :title="t('account.cropPhoto')"
    :before-close="() => !busy"
    @action="closeCrop"
  >
    <div class="flex flex-col gap-4">
      <p class="text-sm text-base-content/65">{{ t('account.cropHint') }}</p>
      <div
        class="relative mx-auto aspect-square w-full max-w-80 overflow-hidden rounded-lg bg-base-200"
      >
        <canvas ref="preview" width="512" height="512" class="h-full w-full" />
        <div
          class="pointer-events-none absolute inset-0 rounded-full border-2 border-white/80 shadow-[0_0_0_100px_rgba(0,0,0,0.3)]"
        />
      </div>
      <GttRangeField
        id="crop-zoom"
        v-model="zoom"
        :label="t('account.cropZoom')"
        :min="1"
        :max="3"
        :step="0.01"
        :disabled="busy"
      />
      <GttRangeField
        id="crop-horizontal"
        v-model="horizontal"
        :label="t('account.cropHorizontal')"
        :min="0"
        :max="100"
        :disabled="busy"
      />
      <GttRangeField
        id="crop-vertical"
        v-model="vertical"
        :label="t('account.cropVertical')"
        :min="0"
        :max="100"
        :disabled="busy"
      />
      <p v-if="error" class="text-sm text-error" role="alert">{{ error }}</p>
      <div class="flex justify-end gap-2">
        <GttButton mode="ghost"  type="button" :disabled="busy" @click="cropOpen = false">
          {{ t('account.cancel') }}
        </GttButton>
        <GttButton color="primary"
          
          type="button"
          :disabled="busy || !sourceImage"
          @click="saveCrop"
        >
          <span v-if="busy" class="loading loading-spinner loading-sm" />{{
            t('account.savePhoto')
          }}
        </GttButton>
      </div>
    </div>
  </GttModal>
</template>

<script setup lang="ts">
import GttFileField from '@/components/generic/form/GttFileField.vue';
import GttRangeField from '@/components/generic/form/GttRangeField.vue';
import { showToast } from '@/composables/toast';
import { useAuth } from '@/composables/useAuth';
import { UserRound } from '@lucide/vue';
import { nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const { profilePhoto, updateProfilePhoto, removeProfilePhoto } = useAuth();
const fileInput = ref<InstanceType<typeof GttFileField>>();
const preview = ref<HTMLCanvasElement>();
const sourceImage = shallowRef<HTMLImageElement>();
const viewerOpen = ref(false);
const cropOpen = ref(false);
const busy = ref(false);
const error = ref('');
const zoom = ref(1);
const horizontal = ref(50);
const vertical = ref(50);
let sourceUrl: string | undefined;

function releaseSource() {
  if (sourceUrl) URL.revokeObjectURL(sourceUrl);
  sourceUrl = undefined;
  sourceImage.value = undefined;
}
onBeforeUnmount(releaseSource);
watch(cropOpen, (open) => {
  if (!open) releaseSource();
});

function drawCrop() {
  const image = sourceImage.value;
  const canvas = preview.value;
  const context = canvas?.getContext('2d');
  if (!image || !canvas || !context) return;
  const size = Math.min(image.naturalWidth, image.naturalHeight) / zoom.value;
  const x = ((image.naturalWidth - size) * horizontal.value) / 100;
  const y = ((image.naturalHeight - size) * vertical.value) / 100;
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, x, y, size, size, 0, 0, canvas.width, canvas.height);
}
watch([zoom, horizontal, vertical], drawCrop, { flush: 'post' });

async function selectPhoto(file: File) {
  if (busy.value) return;
  error.value = '';
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    error.value = t('account.photoFormat');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    error.value = t('account.photoSize');
    return;
  }
  busy.value = true;
  releaseSource();
  try {
    sourceUrl = URL.createObjectURL(file);
    const image = new Image();
    image.src = sourceUrl;
    await image.decode();
    sourceImage.value = image;
    zoom.value = 1;
    horizontal.value = vertical.value = 50;
    viewerOpen.value = false;
    cropOpen.value = true;
    await nextTick();
    drawCrop();
  } catch {
    releaseSource();
    error.value = t('account.photoError');
  } finally {
    busy.value = false;
  }
}

function closeCrop() {
  cropOpen.value = false;
}

async function saveCrop() {
  if (busy.value || !sourceImage.value || !preview.value) return;
  busy.value = true;
  error.value = '';
  try {
    drawCrop();
    const canvas = preview.value;
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (value) => (value ? resolve(value) : reject(new Error('Unable to crop photo'))),
        'image/jpeg',
        0.9,
      ),
    );
    await updateProfilePhoto(new File([blob], 'profile.jpg', { type: 'image/jpeg' }));
    cropOpen.value = false;
    showToast({ title: t('account.photoSaved') });
  } catch {
    error.value = t('account.photoError');
  } finally {
    busy.value = false;
  }
}

async function removePhoto() {
  if (busy.value) return;
  busy.value = true;
  error.value = '';
  try {
    await removeProfilePhoto();
    viewerOpen.value = false;
    showToast({ title: t('account.photoRemoved') });
  } catch {
    error.value = t('account.removeError');
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.photo-viewer :deep(.modal-box) {
  max-width: 95dvw;
}
</style>
