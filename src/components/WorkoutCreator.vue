<template>
  <main class="mx-auto h-fit max-w-2xl">
    <header>
      <p class="text-sm font-semibold tracking-widest text-primary uppercase">Workout tracker</p>
      <h1 class="mt-2 text-4xl font-bold tracking-tight">Crea allenamento</h1>
      <p class="mt-3 text-base-content/70">Scegli un macrogruppo: gli esercizi disponibili si aggiornano
        automaticamente.</p>
    </header>

    <section class="card bg-base-100 shadow-xl">
      <div class="card-body gap-6">
        <label class="form-control w-full">
          <span class="label-text mb-2 font-medium">Nome allenamento</span>
          <input v-model="workoutName" class="input input-bordered w-full" placeholder="Es. Upper body A" type="text" />
        </label>

        <label class="form-control w-full">
          <span class="label-text mb-2 font-medium">Macrogruppo muscolare</span>
          <select class="select select-bordered w-full" :value="selectedMuscleGroupId ?? ''"
            @change="selectMuscleGroup">
            <option disabled value="">Scegli un macrogruppo</option>
            <option v-for="group in muscleGroups" :key="group.id" :value="group.id">{{ group.name }}</option>
          </select>
        </label>

        <label class="form-control w-full">
          <span class="label-text mb-2 font-medium">Esercizio</span>
          <select class="select select-bordered w-full" :disabled="availableExercises.length === 0"
            :value="selectedExercise?.id ?? ''" @change="selectExercise">
            <option disabled value="">{{ selectedMuscleGroupId ? 'Scegli un esercizio' : 'Prima scegli un macrogruppo'
              }}
            </option>
            <option v-for="exercise in availableExercises" :key="exercise.id" :value="exercise.id">{{ exercise.name }}
            </option>
          </select>
        </label>

        <div class="card-actions justify-end pt-2">
          <button class="btn btn-ghost" type="button" @click="resetWorkout">Azzera</button>
          <button class="btn btn-primary" :disabled="!workoutName || !selectedExercise" type="button">Aggiungi
            esercizio</button>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import type { Subscription } from 'rxjs'
import { MultiNode, SingleNode } from 'wave-binder'
import { muscleGroups, type Exercise } from '../domain/exercises'
import { wb } from '../wavebinder'

const workoutName = ref('')
const selectedMuscleGroupId = ref<string | null>(null)
const selectedExercise = ref<Exercise | null>(null)
const availableExercises = ref<Exercise[]>([])

const muscleGroupNode = wb.getNodeByName('selectedMuscleGroupId') as SingleNode
const exerciseNode = wb.getNodeByNameAndType('availableExercises', 'MULTI') as MultiNode

const subscriptions: Subscription[] = [
  muscleGroupNode.subscribe((value) => {
    selectedMuscleGroupId.value = value
  }),
  exerciseNode.subscribe((value) => {
    selectedExercise.value = value as Exercise | null
    availableExercises.value = exerciseNode.choices as Exercise[]
  }),
]

function selectMuscleGroup(event: Event) {
  muscleGroupNode.next((event.target as HTMLSelectElement).value || null)
}

function selectExercise(event: Event) {
  const choiceIndex = (event.target as HTMLSelectElement).selectedIndex - 1
  exerciseNode.setSelection(choiceIndex)
}

function resetWorkout() {
  workoutName.value = ''
  muscleGroupNode.next(null)
}

onBeforeUnmount(() => subscriptions.forEach((subscription) => subscription.unsubscribe()))
</script>