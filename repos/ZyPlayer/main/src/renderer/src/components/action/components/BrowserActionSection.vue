<template>
  <div class="browser-action-section">
    <webview-view
      :src="props.config.url"
      :headers="props.config.header"
      :style="{
        height: props.config.browserHeight ? `${props.config.browserHeight}px` : '300px',
        width: props.config.browserWidth ? `${props.config.browserWidth}px` : '100%',
      }"
      class="browser-view"
    />
    <t-button block @click="handleOpenInBrowser">{{ $t('component.action.fullview') }}</t-button>
  </div>
</template>
<script setup lang="ts">
defineOptions({
  name: 'BrowserActionSection',
});

const props = defineProps({
  config: {
    type: Object as PropType<ICmsActionBrowser>,
    default: () => ({}),
  },
});

import { IPC_CHANNEL } from '@shared/config/ipcChannel';
import type { ICmsActionBrowser } from '@shared/types/cms';
import type { PropType } from 'vue';
import { toRaw } from 'vue';

import WebviewView from '@/components/webview/index.vue';

const handleOpenInBrowser = () => {
  window.electron.ipcRenderer.invoke(IPC_CHANNEL.WINDOW_BROWSER, props.config.url, toRaw(props.config.header));
};

defineExpose({
  reset: () => {},
  submit: () => {},
});
</script>
<style lang="less" scoped>
.browser-action-section {
  display: flex;
  flex-direction: column;
  gap: var(--td-size-4);

  .browser-view {
    border-radius: var(--td-radius-medium);
    overflow: hidden;
  }
}
</style>
