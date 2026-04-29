<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from 'vue';
import { DateFormatter, parseDate } from '@internationalized/date';
import TransactionActions from '@/components/Actions.vue';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableHead,
  TableCell,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar as CalendarIcon } from 'lucide-vue-next';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/utils/utils';
import { getBadgeColor } from '@/utils/common';
import { useTransactionStore } from '@/stores/transactions';

// const categories = ['food', 'transport', 'entertainment', 'shopping', 'bills', 'stay', 'groceries', 'gift', 'misc'];

const addingNewCategory = ref(false);
const addingNewEnvelope = ref(false);
const categories = ref<Array<string>>([])
const envelopes = ref<Array<string>>([])
const transactionStore = useTransactionStore();

const props = defineProps({
  transactions: {
    type: Array,
    required: true
  },
  showConfirmButton: Boolean,
  onConfirm: Function,
  onSave: Function,
  onDelete: Function,
});

const emit = defineEmits(['edit']);
const localEditingTransaction = ref(null);
const dateFormatter = new DateFormatter('en-US', { dateStyle: 'long' });

// Correctly parse ISO string to CalendarDate
const parseIsoToDate = (isoString) => {
  console.log("Parsing ISO string:", isoString);
  const dateOnlyString = isoString.split('T')[0]; // Take only the date part before the 'T'
  return parseDate(dateOnlyString);
};


watch(() => props.transactions, (newTransactions) => {
  if (localEditingTransaction.value) {
    const updatedTransaction = newTransactions.find(t => t.id === localEditingTransaction.value.id);
    if (updatedTransaction) {
      localEditingTransaction.value = {
        ...updatedTransaction,
        transaction_date: parseIsoToDate(updatedTransaction.transaction_date)
      };
    } else {
			addingNewCategory.value = null;
			addingNewEnvelope.value = null;
      localEditingTransaction.value = null;
    }
  }
}, { deep: true });

const editTransaction = async (transaction) => {
  categories.value = await transactionStore.fetchCategories();
  envelopes.value = await transactionStore.fetchEnvelopes();

  localEditingTransaction.value = {
    ...transaction,
    transaction_date: parseIsoToDate(transaction.transaction_date)
  };
  emit('edit', transaction);
};

const cancelEdit = () => {
	addingNewCategory.value = null;
	addingNewEnvelope.value = null;
  localEditingTransaction.value = null;
};

const confirmTransaction = (transaction) => {
  const transactionToConfirm = localEditingTransaction.value || transaction;
  const isoDate = new Date(transactionToConfirm.transaction_date);
  const formattedDate = isoDate.toISOString().split('T')[0]; // Splits the ISO string by 'T' and takes the first part (date)
  transactionToConfirm.transaction_date = formattedDate;
  props.onConfirm(transactionToConfirm);

	addingNewCategory.value = null;
	addingNewEnvelope.value = null;
  localEditingTransaction.value = null;
};

const deleteTransaction = (transaction) => {
  console.log("deleteTransaction:", transaction);
  props.onDelete(transaction);
};

const saveTransaction = () => {
  if (!localEditingTransaction.value) return;
  localEditingTransaction.value.transaction_date = localEditingTransaction.value.transaction_date.toString();
  props.onSave(localEditingTransaction.value);
	
	addingNewCategory.value = null;
	addingNewEnvelope.value = null;
  localEditingTransaction.value = null;
};
</script>


<template>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Date</TableHead>
        <TableHead>Amount</TableHead>
        <TableHead>Category</TableHead>
        <TableHead>Envelope</TableHead>
        <TableHead>Description</TableHead>
        <TableHead>Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow v-for="transaction in transactions" :key="transaction.id">
        <TableCell>
          <Popover v-if="localEditingTransaction && localEditingTransaction.id === transaction.id">
            <PopoverTrigger as-child>
              <Button variant="outline"
                :class="cn('w-[280px] justify-start text-left font-normal', !localEditingTransaction.transaction_date && 'text-muted-foreground')">
                <CalendarIcon class="mr-2 h-4 w-4" />
                {{ localEditingTransaction.transaction_date ?
                  dateFormatter.format(new Date(localEditingTransaction.transaction_date.toString())) : 'Pick a date' }}
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0">
              <Calendar v-model="localEditingTransaction.transaction_date" initial-focus />
            </PopoverContent>
          </Popover>
          <span v-else>{{ dateFormatter.format(new Date(transaction.transaction_date.toString())) }}</span>
        </TableCell>
        <TableCell>
          <Input type="number" step="0.01" class="w-3/4"
            v-if="localEditingTransaction && localEditingTransaction.id === transaction.id"
            v-model="localEditingTransaction.amount" />
          <span v-else>{{ transaction.currency }}{{ transaction.amount.toFixed(2) }}</span>
        </TableCell>
        <TableCell>
					<Input class="w-full" v-if="localEditingTransaction && localEditingTransaction.id === transaction.id && addingNewCategory"
					            v-model="localEditingTransaction.category" />
    			<Select 
    			  v-else-if="localEditingTransaction && localEditingTransaction.id === transaction.id"
    			  v-model="localEditingTransaction.category"
    			>
    			  <SelectTrigger class="w-full">
    			    <SelectValue placeholder="Select category" />
    			  </SelectTrigger>
    			  <SelectContent>
    			    <SelectGroup>
    			      <SelectLabel>Categories</SelectLabel>
    			      <SelectItem 
    			        v-for="category in categories" 
    			        :key="category" 
    			        :value="category"
    			      >
    			        {{ category }}
    			      </SelectItem>
          			<div class="p-2 border-t mt-2">
          			  <Button variant="ghost" size="sm" @click.stop="addingNewCategory = true">
          			    + Add new category
          			  </Button>
          			</div>
    			    </SelectGroup>
    			  </SelectContent>
    			</Select>
          <Badge :class="getBadgeColor(transaction.category)" v-else>{{ transaction.category }}</Badge>
        </TableCell>
        <TableCell>
					<Input class="w-full" v-if="localEditingTransaction && localEditingTransaction.id === transaction.id && addingNewEnvelope"
					            v-model="localEditingTransaction.envelope" />
    			<Select 
    			  v-else-if="localEditingTransaction && localEditingTransaction.id === transaction.id"
    			  v-model="localEditingTransaction.envelope"
    			>
    			  <SelectTrigger class="w-full">
    			    <SelectValue placeholder="Select envelope" />
    			  </SelectTrigger>
    			  <SelectContent>
    			    <SelectGroup>
    			      <SelectLabel>Envelopes</SelectLabel>
    			      <SelectItem 
    			        v-for="envelope in envelopes" 
    			        :key="envelope" 
    			        :value="envelope"
    			      >
    			        {{ envelope }}
    			      </SelectItem>
          			<div class="p-2 border-t mt-2">
          			  <Button variant="ghost" size="sm" @click.stop="addingNewEnvelope = true">
          			    + Add new envelope
          			  </Button>
          			</div>
    			    </SelectGroup>
    			  </SelectContent>
    			</Select>
          <Badge :class="getBadgeColor(transaction.envelope)" v-else>{{ transaction.envelope }}</Badge>
        </TableCell>
        <TableCell>
          <Input class="w-3/4" v-if="localEditingTransaction && localEditingTransaction.id === transaction.id"
            v-model="localEditingTransaction.description" />
          <span v-else>{{ transaction.description }}</span>
        </TableCell>
        <TableCell v-if="showConfirmButton">
          <Button variant="secondary" size="sm" @click="confirmTransaction(localEditingTransaction || transaction)">
            Confirm
          </Button>
        </TableCell>
        <TableCell>
          <TransactionActions :transaction="transaction"
            :is-editing="localEditingTransaction && localEditingTransaction.id === transaction.id"
            @edit="editTransaction" @delete="deleteTransaction" @cancel="cancelEdit" @save="saveTransaction" />
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
