import { activeToast, showToast } from '@/composables/toast';
import { tr } from '@/localization';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

export function useAppUpdateNotice() {
  const availableBuildId = ref<string | null>(null);
  const dismissedBuildId = ref<string | null>(null);
  let checkInterval: ReturnType<typeof setInterval> | undefined;
  let isChecking = false;

  function showUpdateToast() {
    if (
      !availableBuildId.value ||
      availableBuildId.value === dismissedBuildId.value ||
      activeToast.value
    )
      return;

    showToast({
      title: tr('ui.new_version_available'),
      message: tr('ui.reload_the_page_to_get_the_latest_updates'),
      kind: 'update',
      duration: null,
      actions: [
        {
          label: tr('ui.later'),
          onClick: () => {
            dismissedBuildId.value = availableBuildId.value;
          },
        },
        {
          label: tr('ui.reload'),
          color: 'primary',
          onClick: () => {
            dismissedBuildId.value = availableBuildId.value;
            window.location.reload();
          },
        },
      ],
    });
  }

  async function checkForUpdate() {
    if (!import.meta.env.PROD || document.visibilityState === 'hidden' || isChecking) return;
    isChecking = true;
    try {
      const response = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) return;
      const version = (await response.json()) as { buildId?: unknown };
      if (typeof version.buildId === 'string') {
        availableBuildId.value = version.buildId === __APP_BUILD_ID__ ? null : version.buildId;
        showUpdateToast();
      }
    } catch {
      // The app remains usable while the device is offline.
    } finally {
      isChecking = false;
    }
  }

  function checkWhenVisible() {
    if (document.visibilityState === 'visible') void checkForUpdate();
  }

  watch(activeToast, (toast) => {
    if (!toast) showUpdateToast();
  });

  onMounted(() => {
    if (!import.meta.env.PROD) return;
    void checkForUpdate();
    checkInterval = window.setInterval(() => void checkForUpdate(), 120_000);
    document.addEventListener('visibilitychange', checkWhenVisible);
    window.addEventListener('focus', checkForUpdate);
  });

  onBeforeUnmount(() => {
    if (checkInterval) window.clearInterval(checkInterval);
    document.removeEventListener('visibilitychange', checkWhenVisible);
    window.removeEventListener('focus', checkForUpdate);
  });
}
