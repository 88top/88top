<template>
    <div class="progress">
        <div class="progress-value" :style="{
            width: `${value}%`,
            backgroundColor: backgroundColor,
        }">
            <span>{{ text }}</span>
        </div>
        <slot></slot>
    </div>
</template>
<script setup lang="ts">
import { computed, PropType } from 'vue';
const props = defineProps({
    value: {
        type: Number as PropType<number>,
        required: true
    },
    text: {
        type: String
    }
})
const backgroundColor = computed(() => {
    if (props.value < 60) return "#2fc867"; // Green
    if (props.value < 75) return "#fdd835"; // Yellow
    if (props.value < 90) return "#f97316"; // Orange
    return "#dc2626"; // Red
})
</script>
<style lang="scss" scoped>
.progress {
    width: 100%;
    display: block;
    position: relative;
    background-color: #eee;
    border-radius: 4px;
    height: 18px;
    line-height: 18px;
    overflow: hidden;

    .progress-value {
        transition: 0.5s;
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        height: 100%;
        text-align: center;
        color: #fff;
        vertical-align: middle;
        font-size: 12px;
    }
}
</style>