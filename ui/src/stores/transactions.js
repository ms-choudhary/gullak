import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

const TRANSACTIONS_BASE_URL = '/api/transactions'
const CATEGORIES_BASE_URL = '/api/categories'
const ENVELOPES_BASE_URL = '/api/envelopes'
const REPORTS_BASE_URL = '/api/reports'

export const useTransactionStore = defineStore('transaction', () => {
  const isLoading = ref(false)

  async function fetchTransactions(confirmed = true, startDate = null, endDate = null, envelopes = null) {
    isLoading.value = true
    try {
      const params = { confirm: confirmed }
      if (startDate && startDate.trim() !== '') {
        params.start_date = startDate
      }
      if (endDate && endDate.trim() !== '') {
        params.end_date = endDate
      }
      if (envelopes && envelopes.length > 0) {
        params.envelopes = envelopes.join(',')
      }
      const response = await axios.get(TRANSACTIONS_BASE_URL, { params })
      return response.data.data
    } finally {
      isLoading.value = false
    }
  }

  async function fetchCategories() {
    isLoading.value = true
    try {
      const response = await axios.get(CATEGORIES_BASE_URL)
      return response.data.data
    } finally {
      isLoading.value = false
    }
  }

  async function fetchEnvelopes(startDate = null, endDate = null) {
    isLoading.value = true
    try {
      const response = await axios.get(ENVELOPES_BASE_URL, {
        params: { 
          start_date: startDate, 
          end_date: endDate,
        },
      })
      return response.data.data
    } finally {
      isLoading.value = false
    }
  }

  // TODO: this needs to change
  async function createTransaction(line) {
    isLoading.value = true
    try {
      await axios.post(TRANSACTIONS_BASE_URL, { line, confirm: false })
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteTransaction(transactionId) {
    isLoading.value = true
    try {
      await axios.delete(`${TRANSACTIONS_BASE_URL}/${transactionId}`)
    } finally {
      isLoading.value = false
    }
  }

  async function updateTransaction(transaction) {
    isLoading.value = true
    try {
      await axios.put(`${TRANSACTIONS_BASE_URL}/${transaction.id}`, transaction)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchTopExpenseCategories(startDate, endDate, envelopes = null) {
    isLoading.value = true;
    try {
      const response = await axios.get(`${REPORTS_BASE_URL}/top-expense-categories`, {
        params: {
          start_date: startDate,
          end_date: endDate,
          envelopes: envelopes && envelopes.length > 0 ? envelopes.join(',') : '',
        },
      });
      return response.data.data;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchDailySpending(startDate, endDate, envelopes = null) {
    isLoading.value = true;
    try {
      const response = await axios.get(`${REPORTS_BASE_URL}/daily-spending`, {
        params: { 
          start_date: startDate, 
          end_date: endDate,
          envelopes: envelopes && envelopes.length > 0 ? envelopes.join(',') : '',
        },
      });
      return response.data.data;
    } finally {
      isLoading.value = false;
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
