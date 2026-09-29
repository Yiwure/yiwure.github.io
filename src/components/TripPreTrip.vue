<script setup>
import { trip } from '@/composables/useTrip'
import { useEditMode } from '@/composables/useEditMode'
import EditableText from './EditableText.vue'

const { editing } = useEditMode()
</script>

<template>
  <section id="pretrip">
    <h2 class="sec-title"><span class="bar" />{{ trip.preTrip.title }}</h2>
    <div class="pt-grid">
      <div v-for="(item, i) in trip.preTrip.items" :key="i" class="pt-item">
        <b>{{ item.icon }} <EditableText v-model:value="item.label" :editing="editing" /></b>
        <div v-if="item.apps" class="pt-apps">
          <i v-for="(app, j) in item.apps" :key="j">
            <EditableText v-model:value="item.apps[j]" :editing="editing" />
          </i>
        </div>
        <EditableText v-else v-model:value="item.text" :editing="editing" />
      </div>
    </div>
  </section>
</template>
