<script setup lang="ts">
import { computed } from 'vue';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-vue-next';

// A SelectItem value cannot be an empty string, so "every source" and "no source
// recorded" ride on sentinels and get translated back before they leave this component.
const ALL_SOURCES = '__all__';
const NO_SOURCE = '__none__';

const props = defineProps<{
  search: string;
  source: string | null; // null = every source, '' = transactions with no source
  sources: string[];
}>();

const emit = defineEmits<{
  'update:search': [value: string];
  'update:source': [value: string | null];
}>();

const searchModel = computed({
  get: () => props.search,
  set: (value: string) => emit('update:search', value),
});

const sourceModel = computed({
  get: () => (props.source === null ? ALL_SOURCES : props.source === '' ? NO_SOURCE : props.source),
  set: (value: string) =>
    emit('update:source', value === ALL_SOURCES ? null : value === NO_SOURCE ? '' : value),
});
</script>

<template>
  <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
    <div class="relative w-full sm:max-w-xs">
      <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <!-- text-base on mobile keeps iOS Safari from zooming in on focus -->
      <Input v-model="searchModel" type="text" placeholder="Search description..." class="pl-9 pr-10 text-base sm:text-sm"
        aria-label="Search transactions by description" />
      <button v-if="search" type="button" aria-label="Clear search" @click="searchModel = ''"
        class="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground">
        <X class="h-4 w-4" />
      </button>
    </div>

    <Select v-model="sourceModel">
      <SelectTrigger class="w-full text-base sm:w-48 sm:text-sm" aria-label="Filter by source">
        <SelectValue placeholder="All sources" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Source</SelectLabel>
          <SelectItem :value="ALL_SOURCES">All sources</SelectItem>
          <SelectItem v-for="option in sources" :key="option || NO_SOURCE" :value="option || NO_SOURCE">
            {{ option || 'Unspecified' }}
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  </div>
</template>
