<template>
  <main class="auth-shell">
    <aside class="auth-story" aria-labelledby="auth-story-title">
      <div class="auth-brand">
        <span class="auth-brand-mark" aria-hidden="true"><Dumbbell :size="23" :stroke-width="2.5" /></span>
        <p>Gambberone<span>Training Tracker</span></p>
        <div class="auth-mobile-track" aria-hidden="true"><span></span><i></i></div>
      </div>

      <div class="auth-story-content">
        <h2 id="auth-story-title">{{ tr('authDesign.rhythm') }}<br /><span>{{ tr('authDesign.journey') }}</span></h2>
        <p class="auth-story-description">{{ tr('authDesign.description') }}</p>
        <div class="auth-track" aria-hidden="true">
          <div class="auth-track-lane auth-track-lane--outer"></div>
          <div class="auth-track-lane auth-track-lane--middle"></div>
          <div class="auth-track-lane auth-track-lane--inner"></div>
          <div class="auth-track-core"><Activity :size="38" :stroke-width="1.5" /></div>
          <span class="auth-track-dot"></span>
          <span class="auth-track-marker"></span>
        </div>
        <div class="auth-sequence" aria-hidden="true">
          <span><i></i>{{ tr('authDesign.train') }}</span>
          <span><i></i>{{ tr('authDesign.recover') }}</span>
          <span><i></i>{{ tr('authDesign.repeat') }}</span>
        </div>
      </div>

      <p class="auth-story-footer">{{ tr('ui.your_training_always_with_you') }}</p>
    </aside>

    <div class="auth-form-pane">
      <div class="auth-form-container"><router-view /></div>
      <footer class="auth-footer"><span class="auth-footer-line"></span>{{ tr('authDesign.footer') }}</footer>
    </div>
  </main>
</template>

<script setup lang="ts">
import { tr } from '@/localization';
import { Activity, Dumbbell } from '@lucide/vue';
import '@/styles/auth.css';
</script>
