<script setup lang="ts">
import { computed } from 'vue';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// A SelectItem value cannot be an empty string, so "all envelopes" rides on a
// sentinel and is translated back to null on the way out.
const ALL_ENVELOPES = '__all__';

const props = defineProps<{
  modelValue: string | null;
  envelopes: string[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
}>();

const selected = computed({
  get: () => props.modelValue ?? ALL_ENVELOPES,
  set: (value: string) => emit('update:modelValue', value === ALL_ENVELOPES ? null : value),
});
</script>

<template>
  <!-- text-base on mobile keeps iOS Safari from zooming in on focus -->
  <Select v-model="selected">
    <SelectTrigger class="w-full text-base sm:w-56 sm:text-sm" aria-label="Filter by envelope">
      <SelectValue placeholder="All envelopes" />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectLabel>Envelope</SelectLabel>
        <SelectItem :value="ALL_ENVELOPES">All envelopes</SelectItem>
        <SelectItem v-for="envelope in envelopes" :key="envelope" :value="envelope">
          {{ envelope }}
        </SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>
