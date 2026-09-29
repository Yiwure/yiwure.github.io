<script setup>
import { trip } from '@/composables/useTrip'

/** 页头：标题 / 副标题 / 价格说明（待办清单已拆为独立区块 TripTodo） */
</script>

<template>
  <div class="wrap">
    <header class="hero">
      <div class="kicker">{{ trip.site.kicker }}</div>
      <h1>{{ trip.site.title }}</h1>
      <p class="sub">{{ trip.site.sub }}</p>
      <span class="jpy-note">{{ trip.site.jpyNote }}</span>
    </header>
  </div>
</template>
