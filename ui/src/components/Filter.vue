<script setup lang="ts">
import { useFilter } from "reka-ui"
import { computed, ref, watch } from "vue"
import { Combobox, ComboboxAnchor, ComboboxEmpty, ComboboxGroup, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox"
import { TagsInput, TagsInputInput, TagsInputItem, TagsInputItemDelete, TagsInputItemText } from "@/components/ui/tags-input"

const emit = defineEmits<{
  'update:selectedEnvelopes': [envelopes: string[]]
}>()

const props = defineProps<{
  envelopes: string[]
}>()

const envelopesData = computed(() => 
  props.envelopes.map((envelope: string) => ({
    value: envelope,
    label: envelope
  }))
)

const modelValue = ref<string[]>([])
const open = ref(false)
const searchTerm = ref("")

watch(modelValue, (newValue) => {
  emit('update:selectedEnvelopes', newValue)
}, { deep: true })

watch(() => props.envelopes, (newEnvelopes) => {
  if (newEnvelopes && newEnvelopes.length > 0) {
    modelValue.value = [...newEnvelopes]
  }
}, { immediate: true })

const { contains } = useFilter({ sensitivity: "base" })

const filteredEnvelopes = computed(() => {
  const options = envelopesData.value.filter(i => !modelValue.value.includes(i.label))
  return searchTerm.value ? options.filter(option => contains(option.label, searchTerm.value)) : options
})
</script>

<template>
  <Combobox v-model="modelValue" v-model:open="open" :ignore-filter="true" class="px-2 gap-10">
    <ComboboxAnchor as-child>
      <TagsInput v-model="modelValue" class="px-2 gap-2 w-80">
        <div class="flex gap-2 flex-wrap items-center">
          <TagsInputItem v-for="item in modelValue" :key="item" :value="item">
            <TagsInputItemText />
            <TagsInputItemDelete />
          </TagsInputItem>
        </div>

        <ComboboxInput v-model="searchTerm" as-child>
          <TagsInputInput placeholder="Envelope..." class="min-w-[200px] w-full p-0 border-none focus-visible:ring-0 h-auto" @keydown.enter.prevent />
        </ComboboxInput>
      </TagsInput>

      <ComboboxList class="w-[--reka-popper-anchor-width]">
        <ComboboxEmpty />
        <ComboboxGroup>
          <ComboboxItem
            v-for="envelope in filteredEnvelopes" :key="envelope.value" :value="envelope.label"
            @select.prevent="(ev) => {

              if (typeof ev.detail.value === 'string') {
                searchTerm = ''
                modelValue.push(ev.detail.value)
              }

              if (filteredEnvelopes.length === 0) {
                open = false
              }
            }"
          >
            {{ envelope.label }}
          </ComboboxItem>
        </ComboboxGroup>
      </ComboboxList>
    </ComboboxAnchor>
  </Combobox>
</template>
