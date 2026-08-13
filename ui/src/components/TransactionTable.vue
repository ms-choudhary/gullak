<script setup lang="ts">
import { ref, computed, watch, defineProps, defineEmits } from 'vue';
import { DateFormatter, parseDate } from '@internationalized/date';
import TransactionActions from '@/components/Actions.vue';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableFooter,
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
import { Calendar as CalendarIcon, ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-vue-next';
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

// sorting by amount: null (original order) -> 'asc' -> 'desc' -> null
const amountSort = ref<'asc' | 'desc' | null>(null);

const toggleAmountSort = () => {
  amountSort.value = amountSort.value === null ? 'desc' : amountSort.value === 'desc' ? 'asc' : null;
};

const sortedTransactions = computed(() => {
  if (!amountSort.value) return props.transactions;
  const direction = amountSort.value === 'asc' ? 1 : -1;
  return [...props.transactions].sort((a, b) => (Number(a.amount) - Number(b.amount)) * direction);
});

// Totals cover exactly the rows rendered, so whatever the caller filtered out is
// already excluded. Amounts are summed per currency rather than pooled blindly.
const totals = computed(() => {
  const byCurrency = new Map<string, number>();
  for (const transaction of props.transactions) {
    const currency = transaction.currency ?? '';
    byCurrency.set(currency, (byCurrency.get(currency) ?? 0) + Number(transaction.amount));
  }
  return [...byCurrency.entries()].map(([currency, total]) => ({ currency, total }));
});

// Date + Amount are rendered separately; the rest of the header gets spanned.
const remainingColumns = computed(() => (props.showConfirmButton ? 5 : 4));

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
        <TableHead>
          <button type="button" class="flex items-center gap-1 font-medium hover:text-foreground"
            :aria-label="`Sort by amount, currently ${amountSort ?? 'unsorted'}`" @click="toggleAmountSort">
            Amount
            <ArrowUp v-if="amountSort === 'asc'" class="h-4 w-4" />
            <ArrowDown v-else-if="amountSort === 'desc'" class="h-4 w-4" />
            <ArrowUpDown v-else class="h-4 w-4 opacity-50" />
          </button>
        </TableHead>
        <TableHead>Category</TableHead>
        <TableHead>Envelope</TableHead>
        <TableHead>Description</TableHead>
        <TableHead>Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow v-for="transaction in sortedTransactions" :key="transaction.id">
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
    <TableFooter v-if="totals.length">
      <TableRow class="font-bold">
        <TableCell>Total</TableCell>
        <TableCell>
          <div v-for="{ currency, total } in totals" :key="currency" class="whitespace-nowrap">
            {{ currency }}{{ total.toFixed(2) }}
          </div>
        </TableCell>
        <TableCell :colspan="remainingColumns" class="text-muted-foreground">
          {{ transactions.length }} {{ transactions.length === 1 ? 'transaction' : 'transactions' }}
        </TableCell>
      </TableRow>
    </TableFooter>
  </Table>
</template>
