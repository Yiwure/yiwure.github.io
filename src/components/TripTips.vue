<script setup>
import { trip } from '@/composables/useTrip'
import { useEditMode } from '@/composables/useEditMode'
import EditableText from './EditableText.vue'

const { editing } = useEditMode()
</script>

<template>
  <section>
    <h2 class="sec-title"><span class="bar" />{{ trip.tips.title }}</h2>
    <ul class="tips-list">
      <li v-for="(tip, i) in trip.tips.items" :key="i">
        <EditableText v-model:value="trip.tips.items[i]" :editing="editing" />
      </li>
    </ul>
  </section>
</template>
