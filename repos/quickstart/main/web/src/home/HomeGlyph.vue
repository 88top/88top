<template><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path v-for="(d,i) in (paths[name] || paths.grid)" :key="i" :d="d" /></svg></template>
<script setup lang="ts">
defineProps<{name:string}>()
const paths:Record<string,string[]>={
  activity:['M2 12h4l3-8 5 16 3-8h5'],
  devices:['M3 3h13v10H3z M7 17h5 M9 13v4 M17 8h4v12h-7v-4 M17 17h1'],
  network:['M9 3h6v5H9z M3 16h6v5H3z M15 16h6v5h-6z M12 8v4 M6 16v-4h12v4'],
  disk:['M5 3h14v18H5z M8 7h8 M8 11h8 M16 17h.01'],
  layers:['m12 3 10 5-10 5L2 8z M2 12l10 5 10-5 M2 16l10 5 10-5'],
  chip:['M6 6h12v12H6z M9 9h6v6H9z M9 2v4 M15 2v4 M9 18v4 M15 18v4 M2 9h4 M2 15h4 M18 9h4 M18 15h4'],
  grid:['M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z'],
  arrow:['M5 12h14 M14 7l5 5-5 5'],
  tune:['M4 7h16 M4 17h16 M8 4v6 M16 14v6'],
  shield:['m12 2 8 3v6c0 5-5 9-8 11-3-2-8-6-8-11V5z M8 11l3 3 5-6'],
  globe:['M2 12h20 M12 2c6 6 6 14 0 20-6-6-6-14 0-20 M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20'],
  terminal:['m5 7 5 5-5 5 M13 17h6'],
  download:['M12 3v12 M7 10l5 5 5-5 M3 16v5h18v-5'],
  folder:['M3 6h7l2 3h9v11H3z'],
  check:['m5 12 4 4L19 6'],
  clock:['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18','M12 7v5l3 2'],
  power:['M12 3v9','M6.5 5.5a9 9 0 1 0 11 0'],
}
</script>
