import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import type {
  CategoryTotal,
  DailySpending,
  NewTransactionInput,
  Transaction
} from '@/types/transaction'

const TRANSACTIONS_BASE_URL = '/api/transactions'
const CATEGORIES_BASE_URL = '/api/categories'
const ENVELOPES_BASE_URL = '/api/envelopes'
const REPORTS_BASE_URL = '/api/reports'

interface ApiResponse<T> {
  data: T
  message?: string
  error?: string
}

export const useTransactionStore = defineStore('transaction', () => {
  const isLoading = ref(false)

  async function fetchTransactions(
    confirmed = true,
    startDate: string | null = null,
    endDate: string | null = null,
    envelopes: string[] | null = null,
    category: string | null = null
  ): Promise<Transaction[]> {
    isLoading.value = true
    try {
      const params: Record<string, string | boolean> = { confirm: confirmed }
      if (startDate && startDate.trim() !== '') {
        params.start_date = startDate
      }
      if (endDate && endDate.trim() !== '') {
        params.end_date = endDate
      }
      if (envelopes && envelopes.length > 0) {
        params.envelopes = envelopes.join(',')
      }
      if (category && category.trim() !== '') {
        params.category = category
      }
      const response = await axios.get<ApiResponse<Transaction[]>>(TRANSACTIONS_BASE_URL, { params })
      return response.data.data
    } finally {
      isLoading.value = false
    }
  }

  async function fetchCategories(): Promise<string[]> {
    isLoading.value = true
    try {
      const response = await axios.get<ApiResponse<string[]>>(CATEGORIES_BASE_URL)
      return response.data.data
    } finally {
      isLoading.value = false
    }
  }

  async function fetchEnvelopes(
    startDate: string | null = null,
    endDate: string | null = null
  ): Promise<string[]> {
    isLoading.value = true
    try {
      const response = await axios.get<ApiResponse<string[]>>(ENVELOPES_BASE_URL, {
        params: {
          start_date: startDate,
          end_date: endDate
        }
      })
      return response.data.data
    } finally {
      isLoading.value = false
    }
  }

  async function createTransaction(transactionData: NewTransactionInput): Promise<void> {
    isLoading.value = true
    try {
      const payload = {
        amount: transactionData.amount,
        description: transactionData.description,
        confirm: false
      }
      await axios.post(TRANSACTIONS_BASE_URL, payload)
    } finally {
      isLoading.value = false
    }
  }

  async function deleteTransaction(transactionId: number): Promise<void> {
    isLoading.value = true
    try {
      await axios.delete(`${TRANSACTIONS_BASE_URL}/${transactionId}`)
    } finally {
      isLoading.value = false
    }
  }

  async function updateTransaction(transaction: Transaction): Promise<void> {
    isLoading.value = true
    try {
      await axios.put(`${TRANSACTIONS_BASE_URL}/${transaction.id}`, transaction)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchTopExpenseCategories(
    startDate: string,
    endDate: string,
    envelopes: string[] | null = null
  ): Promise<CategoryTotal[]> {
    isLoading.value = true
    try {
      const response = await axios.get<ApiResponse<CategoryTotal[]>>(
        `${REPORTS_BASE_URL}/top-expense-categories`,
        {
          params: {
            start_date: startDate,
            end_date: endDate,
            envelopes: envelopes && envelopes.length > 0 ? envelopes.join(',') : ''
          }
        }
      )
      return response.data.data
    } finally {
      isLoading.value = false
    }
  }

  async function fetchDailySpending(
    startDate: string,
    endDate: string,
    envelopes: string[] | null = null
  ): Promise<DailySpending[]> {
    isLoading.value = true
    try {
      const response = await axios.get<ApiResponse<DailySpending[]>>(
        `${REPORTS_BASE_URL}/daily-spending`,
        {
          params: {
            start_date: startDate,
            end_date: endDate,
            envelopes: envelopes && envelopes.length > 0 ? envelopes.join(',') : ''
          }
        }
      )
      return response.data.data
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    fetchTransactions,
    fetchCategories,
    fetchEnvelopes,
    createTransaction,
    deleteTransaction,
    updateTransaction,
    fetchTopExpenseCategories,
    fetchDailySpending
  }
})
