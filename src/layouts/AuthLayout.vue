<template>
  <main class="flex min-h-dvh items-center bg-base-200 px-4 py-8">
    <div class="mx-auto w-full max-w-md">
      <header class="mb-8 text-center">
        <div
          class="mx-auto grid size-14 place-items-center rounded-2xl bg-primary text-xl font-black text-primary-content shadow-sm"
        >
          GT
        </div>
        <h1 class="mt-4 text-2xl font-bold tracking-tight text-base-content">
          Gambberone Training
        </h1>
        <p class="mt-1 text-sm text-base-content/65">Il tuo allenamento, sempre con te.</p>
      </header>

      <router-view />
    </div>
  </main>
</template>
