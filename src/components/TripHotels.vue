<script setup>
import { trip } from '@/composables/useTrip'
import { useEditMode } from '@/composables/useEditMode'
import EditableText from './EditableText.vue'

const { editing } = useEditMode()
</script>

<template>
  <section id="hotels">
    <h2 class="sec-title"><span class="bar" />{{ trip.hotels.title }}</h2>
    <div v-for="(area, i) in trip.hotels.areas" :key="i" class="hotel">
      <div class="area"><EditableText v-model:value="area.area" :editing="editing" /></div>
      <div class="reason"><EditableText v-model:value="area.reason" :editing="editing" /></div>
      <div v-for="(opt, j) in area.options" :key="j" class="opt">
        <span class="tier">{{ opt.tier }}</span>
        <EditableText v-model:value="opt.name" :editing="editing" /> ·
        <span class="pr"><EditableText v-model:value="opt.priceRange" :editing="editing" /></span>
        <div v-if="opt.note" class="nt"><EditableText v-model:value="opt.note" :editing="editing" /></div>
      </div>
    </div>
  </section>
</template>
