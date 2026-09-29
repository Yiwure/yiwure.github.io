<script setup>
import { trip } from '@/composables/useTrip'
import { useEditMode } from '@/composables/useEditMode'
import EditableText from './EditableText.vue'

const { editing } = useEditMode()
</script>

<template>
  <section id="flights">
    <h2 class="sec-title"><span class="bar" />航班</h2>
    <div class="flights-grid">
      <div v-for="(flight, i) in trip.flights.booked" :key="i" class="flight">
        <span class="code"><EditableText v-model:value="flight.code" :editing="editing" /></span>
        <span class="badge-booked">✓ 已预订</span>
        <div class="meta">
          <EditableText v-model:value="flight.label" :editing="editing" /><br>
          <EditableText v-model:value="flight.time" :editing="editing" />
        </div>
      </div>
    </div>
  </section>
</template>
