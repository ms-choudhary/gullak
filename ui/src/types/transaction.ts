export interface Transaction {
  id: number
  created_at: string
  transaction_date: string
  currency: string
  amount: number
  category: string
  envelope: string
  description: string
  message_id: string
  confirm: boolean
  source: string
}

export interface CategoryTotal {
  category: string
  total_spent: number
}

export interface DailySpending {
  transaction_date: string
  total_spent: number
}

export interface NewTransactionInput {
  amount: number
  description: string
}

export interface DateRange {
  start: string
  end: string
}
