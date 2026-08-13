<script setup>
import { computed, ref, watch } from "vue";
import { CalendarRoot, useForwardPropsEmits } from "radix-vue";
import {
  DateFormatter,
  getLocalTimeZone,
  today,
} from "@internationalized/date";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarCell,
  CalendarCellTrigger,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHead,
  CalendarGridRow,
  CalendarHeadCell,
  CalendarHeader,
  CalendarHeading,
  CalendarNextButton,
  CalendarPrevButton,
} from ".";
import { cn } from "@/utils/utils";

const props = defineProps({
  modelValue: { type: null, required: false },
  multiple: { type: Boolean, required: false },
  defaultValue: { type: null, required: false },
  defaultPlaceholder: { type: null, required: false },
  placeholder: { type: null, required: false },
  pagedNavigation: { type: Boolean, required: false },
  preventDeselect: { type: Boolean, required: false },
  weekStartsOn: { type: Number, required: false },
  weekdayFormat: { type: String, required: false },
  calendarLabel: { type: String, required: false },
  fixedWeeks: { type: Boolean, required: false },
  maxValue: { type: null, required: false },
  minValue: { type: null, required: false },
  locale: { type: String, required: false },
  numberOfMonths: { type: Number, required: false },
  disabled: { type: Boolean, required: false },
  readonly: { type: Boolean, required: false },
  initialFocus: { type: Boolean, required: false },
  isDateDisabled: { type: Function, required: false },
  isDateUnavailable: { type: Function, required: false },
  dir: { type: String, required: false },
  asChild: { type: Boolean, required: false },
  as: { type: null, required: false },
  class: { type: null, required: false },
  // "label" keeps the plain "August 2026" caption; "dropdown" swaps it for month
  // and year selects so far-away dates don't need one click per month.
  captionLayout: { type: String, required: false, default: "label" },
  fromYear: { type: Number, required: false },
  toYear: { type: Number, required: false },
});

const emits = defineEmits(["update:modelValue", "update:placeholder"]);

const delegatedProps = computed(() => {
  const {
    class: _,
    captionLayout: __,
    fromYear: ___,
    toYear: ____,
    // The placeholder drives which month is on screen, and the dropdowns need to
    // write to it, so it is bound explicitly below rather than forwarded.
    placeholder: _____,
    ...delegated
  } = props;

  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);

const now = today(getLocalTimeZone());

const resolveInitialPlaceholder = () => {
  const selected = Array.isArray(props.modelValue)
    ? props.modelValue[0]
    : props.modelValue;

  return props.placeholder ?? props.defaultPlaceholder ?? selected ?? now;
};

const placeholder = ref(resolveInitialPlaceholder());

// A parent that controls the placeholder still wins. Deliberately not watching
// modelValue: the transaction table rebuilds its date object whenever the list
// refreshes, which would yank the view back mid-navigation.
watch(
  () => props.placeholder,
  (value) => {
    if (value) placeholder.value = value;
  },
);

const setPlaceholder = (value) => {
  placeholder.value = value;
  emits("update:placeholder", value);
};

const monthFormatter = computed(
  () => new DateFormatter(props.locale ?? "en-US", { month: "long" }),
);

const monthOptions = computed(() =>
  Array.from({ length: 12 }, (_, index) => ({
    value: index + 1,
    label: monthFormatter.value.format(new Date(2000, index, 1)),
  })),
);

// Newest first, since transactions are usually recent. The visible year is always
// included so editing an unusually old date never leaves the select blank.
const yearOptions = computed(() => {
  const start = Math.min(props.fromYear ?? now.year - 10, placeholder.value.year);
  const end = Math.max(props.toYear ?? now.year + 1, placeholder.value.year);

  return Array.from({ length: end - start + 1 }, (_, index) => end - index);
});

const onMonthSelect = (value) => {
  if (value) setPlaceholder(placeholder.value.set({ month: Number(value) }));
};

const onYearSelect = (value) => {
  if (value) setPlaceholder(placeholder.value.set({ year: Number(value) }));
};
</script>

<template>
  <CalendarRoot
    v-slot="{ grid, weekDays }"
    :class="cn('p-3', props.class)"
    v-bind="forwarded"
    :placeholder="placeholder"
    @update:placeholder="placeholder = $event"
  >
    <CalendarHeader>
      <CalendarPrevButton />

      <div v-if="props.captionLayout === 'dropdown'" class="flex items-center gap-1">
        <Select
          :model-value="String(placeholder.month)"
          @update:model-value="onMonthSelect"
        >
          <SelectTrigger
            class="h-7 w-auto gap-1 border-none px-2 text-sm font-medium focus:ring-0 focus:ring-offset-0"
            aria-label="Month"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent class="max-h-64">
            <SelectItem
              v-for="month in monthOptions"
              :key="month.value"
              :value="String(month.value)"
            >
              {{ month.label }}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          :model-value="String(placeholder.year)"
          @update:model-value="onYearSelect"
        >
          <SelectTrigger
            class="h-7 w-auto gap-1 border-none px-2 text-sm font-medium focus:ring-0 focus:ring-offset-0"
            aria-label="Year"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent class="max-h-64">
            <SelectItem
              v-for="year in yearOptions"
              :key="year"
              :value="String(year)"
            >
              {{ year }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <CalendarHeading v-else />

      <CalendarNextButton />
    </CalendarHeader>

    <div class="flex flex-col gap-y-4 mt-4 sm:flex-row sm:gap-x-4 sm:gap-y-0">
      <CalendarGrid v-for="month in grid" :key="month.value.toString()">
        <CalendarGridHead>
          <CalendarGridRow>
            <CalendarHeadCell v-for="day in weekDays" :key="day">
              {{ day }}
            </CalendarHeadCell>
          </CalendarGridRow>
        </CalendarGridHead>
        <CalendarGridBody>
          <CalendarGridRow
            v-for="(weekDates, index) in month.rows"
            :key="`weekDate-${index}`"
            class="mt-2 w-full"
          >
            <CalendarCell
              v-for="weekDate in weekDates"
              :key="weekDate.toString()"
              :date="weekDate"
            >
              <CalendarCellTrigger :day="weekDate" :month="month.value" />
            </CalendarCell>
          </CalendarGridRow>
        </CalendarGridBody>
      </CalendarGrid>
    </div>
  </CalendarRoot>
</template>
