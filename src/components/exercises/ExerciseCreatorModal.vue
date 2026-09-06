<template>
    <GttModal v-model="isOpen" title="Crea esercizio" :actions="[{id: 'create', label: 'Crea', color: 'primary'}]"
        @action="handleCreate">
        <GttSelectField v-model="selectedMuscleGroup" id="exercise_muscle_group" label="Macrogruppo"
            :options="muscleGroups" placeholder="Seleziona un macrogruppo" value-key="name" />
        <GttInputField v-model="exerciseName" label="Nome esercizio" id="exercise_name"
            placeholder="Es. Curl con manubri" />
    </GttModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import GttInputField from '../generic/form/GttInputField.vue';
import GttSelectField from '../generic/form/GttSelectField.vue';
import GttModal from '../generic/GttModal.vue';
import { muscleGroups, type Exercise } from '../../domain/exercises.ts';
import { exercisesRef } from '../../stores/exercises';

const isOpen = defineModel<boolean>({ default: false })
const exerciseName = ref('');

const selectedMuscleGroup = ref<string | undefined>(undefined);

function handleCreate(actionId: string) {
    if (actionId !== 'create' || !exerciseName.value.trim() || !selectedMuscleGroup.value) {
        return
    }

    const exercise: Exercise = {
        id: crypto.randomUUID(),
        name: exerciseName.value.trim(),
        muscleGroupId: selectedMuscleGroup.value,
    }

    exercisesRef.value.push(exercise)

    exerciseName.value = ''
    selectedMuscleGroup.value = undefined
    isOpen.value = false
}

</script>
