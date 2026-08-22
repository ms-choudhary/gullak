<!-- NewTransactions.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { showToast } from '@/utils/common'
import { describeError } from '@/utils/errors'
import { useTransactionStore } from '@/stores/transactions'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader } from 'lucide-vue-next'
import TransactionTable from '@/components/TransactionTable.vue'
import type { Transaction } from '@/types/transaction'

// Cash first: it matches what the backend falls back to for a source-less transaction.
const SOURCES = ['Cash', 'HDFC Credit Card', 'HDFC Debit Card', 'HDFC UPI', 'DCB Bank']

const amount = ref('')
const description = ref('')
const source = ref(SOURCES[0])
const transactionStore = useTransactionStore()
const unconfirmedTransactions = ref<Transaction[]>([])

onMounted(async () => {
  await fetchUnconfirmedTransactions()
})

const fetchUnconfirmedTransactions = async () => {
  try {
    unconfirmedTransactions.value = await transactionStore.fetchTransactions(false)
  } catch (error) {
    showToast('Error loading transactions.', describeError(error), true)
  }
}

const handleSubmit = async () => {
  try {
    const transactionData = {
      amount: parseFloat(amount.value),
      description: description.value,
      source: source.value
    }
    await transactionStore.createTransaction(transactionData)
    await fetchUnconfirmedTransactions()
    showToast('Transaction saved. Please confirm!', '', false)
    amount.value = ''
    description.value = ''
  } catch (error) {
    showToast('Error saving transaction.', describeError(error), true)
  }
}

const confirmTransactionHandler = async (transaction: Transaction) => {
  transaction.confirm = true
  try {
    await transactionStore.updateTransaction(transaction)
    await fetchUnconfirmedTransactions()
    showToast('Transaction confirmed!', '', false)
  } catch (error) {
    showToast('Error confirming transaction.', describeError(error), true)
  }
}

const deleteTransactionHandler = async (transaction: Transaction) => {
  try {
    await transactionStore.deleteTransaction(transaction.id)
    await fetchUnconfirmedTransactions()
    showToast('Transaction deleted!', '', false)
  } catch (error) {
    showToast('Error deleting transaction.', describeError(error), true)
  }
}
</script>

<template>
  <section class="new p-6">
    <div class="info mb-6">
      <h1 class="text-2xl font-bold">Add a new transaction</h1>
      <p class="text-gray-400">
        Enter the amount and description for your transaction.
      </p>
    </div>
    <div class="form">
      <form @submit.prevent="handleSubmit" class="flex flex-col items-center space-y-4">
        <Input
          class="w-full"
          type="number"
          step="0.01"
          placeholder="Amount (e.g., 400.50)"
          v-model="amount"
          required
        />
        <Textarea
          class="w-full textarea textarea-bordered"
          placeholder="Description (e.g., Groceries from supermarket)"
          v-model="description"
          minlength="3"
          maxlength="500"
          required
        />
        <div class="w-full">
          <label for="source" class="mb-1.5 block text-sm text-gray-400">Source</label>
          <!-- text-base on mobile keeps iOS Safari from zooming in on tap -->
          <Select v-model="source">
            <SelectTrigger id="source" class="w-full text-base sm:text-sm" aria-label="Transaction source">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Source</SelectLabel>
                <!-- Roomier rows on mobile give thumbs a usable tap target -->
                <SelectItem
                  v-for="option in SOURCES"
                  :key="option"
                  :value="option"
                  class="py-2.5 text-base sm:py-1.5 sm:text-sm"
                >
                  {{ option }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <Button :disabled="transactionStore.isLoading || !amount || !description">
          <Loader v-if="transactionStore.isLoading" class="mr-2 h-4 w-4 animate-spin" />
          Save transaction
        </Button>
      </form>
    </div>
  </section>
  <section class="unconfirmed p-6" v-if="unconfirmedTransactions.length > 0">
    <h2 class="text-xl font-semibold mb-4">Unconfirmed Transactions</h2>
    <TransactionTable
      :transactions="unconfirmedTransactions"
      :show-confirm-button="true"
      :on-confirm="confirmTransactionHandler"
      :on-delete="deleteTransactionHandler"
    />
  </section>
</template>
