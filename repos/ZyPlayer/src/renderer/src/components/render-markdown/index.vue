<template>
  <t-chat-markdown :content="mdContent" :options="mdOptions" />
</template>
<script lang="ts" setup>
defineOptions({
  name: 'RenderMarkdown',
});

const props = defineProps({
  text: {
    type: String,
    default: '',
  },
});

import { THEME } from '@shared/config/theme';
import { ref, watch } from 'vue';

import { useSettingStore } from '@/store';

const storeSetting = useSettingStore();

const mdContent = ref(props.text);
const mdOptions = ref({
  themeSettings: {
    codeBlockTheme: storeSetting.displayTheme === THEME.LIGHT ? THEME.LIGHT : THEME.DARK,
  },
});

watch(
  () => props.text,
  (val) => (mdContent.value = val),
);
watch(
  () => storeSetting.displayTheme,
  () =>
    (mdOptions.value.themeSettings.codeBlockTheme =
      storeSetting.displayTheme === THEME.LIGHT ? THEME.LIGHT : THEME.DARK),
);
</script>
<style lang="css" scoped></style>
