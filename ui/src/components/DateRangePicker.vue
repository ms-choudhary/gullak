<template>
    <Popover v-model:open="isOpen">
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
        <PopoverContent class="w-auto max-w-[calc(100vw-2rem)] p-0" :collision-padding="16">
            <!-- Two columns on mobile so every preset stays reachable; a single scrolling
                 row hid the later presets off the edge of narrow screens. -->
            <div class="grid grid-cols-2 gap-1 border-b p-2 sm:flex sm:flex-wrap">
                <Button v-for="(preset, index) in presets" :key="preset.label" size="sm"
                    :variant="activePreset === preset.label ? 'secondary' : 'ghost'"
                    :class="cn('w-full whitespace-nowrap sm:w-auto sm:shrink-0',
                        isLastOnOwnRow(index) && 'col-span-2 sm:col-span-1')"
                    @click="applyPreset(preset)">
                    {{ preset.label }}
                </Button>
            </div>
            <RangeCalendar v-model="range" :number-of-months="isDesktop ? 2 : 1" />
        </PopoverContent>
    </Popover>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
    endOfMonth,
    endOfYear,
    getLocalTimeZone,
    parseDate,
    startOfMonth,
    startOfYear,
    today,
    type DateValue
} from '@internationalized/date';
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

interface Preset {
    label: string;
    range: () => { start: DateValue; end: DateValue };
}

const props = defineProps<{
    modelValue: DateRange;
}>();

const emits = defineEmits<{
    'update:dateRange': [range: DateRange];
}>();

const isDesktop = useMediaQuery('(min-width: 640px)');
const isOpen = ref(false);

const presets: Preset[] = [
    {
        label: 'This month',
        range: () => {
            const now = today(getLocalTimeZone());
            return { start: startOfMonth(now), end: now };
        }
    },
    {
        label: 'Last month',
        range: () => {
            const lastMonth = today(getLocalTimeZone()).subtract({ months: 1 });
            return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
        }
    },
    {
        label: 'Last 3 months',
        range: () => {
            const now = today(getLocalTimeZone());
            return { start: startOfMonth(now.subtract({ months: 2 })), end: now };
        }
    },
    {
        label: 'This year',
        range: () => {
            const now = today(getLocalTimeZone());
            return { start: startOfYear(now), end: now };
        }
    },
    {
        label: 'Last year',
        range: () => {
            const lastYear = today(getLocalTimeZone()).subtract({ years: 1 });
            return { start: startOfYear(lastYear), end: endOfYear(lastYear) };
        }
    }
];

const range = ref<CalendarRange>({
    start: parseDate(props.modelValue.start),
    end: parseDate(props.modelValue.end)
});

const activePreset = computed(() => {
    const match = presets.find((preset) => {
        const { start, end } = preset.range();
        return range.value.start?.toString() === start.toString()
            && range.value.end?.toString() === end.toString();
    });
    return match ? match.label : null;
});

// With an odd number of presets the last one would sit alone in the left column,
// so let it span the full width instead.
const isLastOnOwnRow = (index: number) => index === presets.length - 1 && presets.length % 2 === 1;

const applyPreset = (preset: Preset) => {
    range.value = preset.range();
    isOpen.value = false;
};

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
