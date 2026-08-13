<template>
    <Popover>
        <PopoverTrigger as-child>
            <Button variant="outline"
                :class="cn('w-full sm:w-[280px] justify-start text-left font-normal', !range.start && 'text-muted-foreground')">
                <CalendarIcon class="mr-2 h-4 w-4 shrink-0" />
                <template v-if="range.start && range.end">
                    {{ range.start.toString() }} - {{ range.end.toString() }}
                </template>
                <template v-else>
                    Pick a date
                </template>
            </Button>
        </PopoverTrigger>
        <PopoverContent class="w-auto max-w-[calc(100vw-2rem)] overflow-x-auto p-0">
            <RangeCalendar v-model="range" :number-of-months="isDesktop ? 2 : 1" />
        </PopoverContent>
    </Popover>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { parseDate, type DateValue } from '@internationalized/date';
import { useMediaQuery } from '@vueuse/core';
import { CalendarIcon } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RangeCalendar } from '@/components/ui/range-calendar';
import { cn } from '@/utils/utils';
import type { DateRange } from '@/types/transaction';

interface CalendarRange {
    start: DateValue | undefined;
    end: DateValue | undefined;
}

const props = defineProps<{
    modelValue: DateRange;
}>();

const emits = defineEmits<{
    'update:dateRange': [range: DateRange];
}>();

const isDesktop = useMediaQuery('(min-width: 640px)');

const range = ref<CalendarRange>({
    start: parseDate(props.modelValue.start),
    end: parseDate(props.modelValue.end)
});

// The range can also be set programmatically by the parent (selecting an envelope
// expands it), so mirror incoming changes back into the calendar.
watch(() => props.modelValue, (newValue) => {
    if (!newValue?.start || !newValue?.end) {
        return;
    }
    if (newValue.start === range.value.start?.toString() && newValue.end === range.value.end?.toString()) {
        return;
    }
    range.value = { start: parseDate(newValue.start), end: parseDate(newValue.end) };
}, { deep: true });

watch(range, (newValue) => {
    if (newValue?.start && newValue?.end) {
        emits('update:dateRange', {
            start: newValue.start.toString(),
            end: newValue.end.toString()
        });
    }
}, { deep: true });
</script>
