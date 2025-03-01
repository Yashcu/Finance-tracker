"use client"

import { useState } from "react"
import { ExpenseForm } from "./expense-form"
import { ExpenseList } from "./expense-list"
import { ExpenseSummary } from "./expense-summary"
import { ExpenseFilters } from "./expense-filters"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type Expense = {
  id: string
  description: string
  amount: number
  category: string
  date: Date
}

export type ExpenseFilter = {
  startDate: Date | null
  endDate: Date | null
  category: string | null
  minAmount: number | null
  maxAmount: number | null
}

export function ExpenseTracker() {
  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: "1",
      description: "Groceries",
      amount: 85.75,
      category: "Food",
      date: new Date("2024-02-25"),
    },
    {
      id: "2",
      description: "Electricity bill",
      amount: 120.5,
      category: "Utilities",
      date: new Date("2024-02-20"),
    },
    {
      id: "3",
      description: "Movie tickets",
      amount: 32.0,
      category: "Entertainment",
      date: new Date("2024-02-18"),
    },
    {
      id: "4",
      description: "Gas",
      amount: 45.25,
      category: "Transportation",
      date: new Date("2024-02-15"),
    },
    {
      id: "5",
      description: "Internet",
      amount: 79.99,
      category: "Utilities",
      date: new Date("2024-02-10"),
    },
  ])

  const [filters, setFilters] = useState<ExpenseFilter>({
    startDate: null,
    endDate: null,
    category: null,
    minAmount: null,
    maxAmount: null,
  })

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)

  const addExpense = (expense: Omit<Expense, "id">) => {
    const newExpense = {
      ...expense,
      id: Math.random().toString(36).substring(2, 9),
    }
    setExpenses([...expenses, newExpense])
  }

  const updateExpense = (updatedExpense: Expense) => {
    setExpenses(expenses.map((expense) => (expense.id === updatedExpense.id ? updatedExpense : expense)))
    setEditingExpense(null)
  }

  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter((expense) => expense.id !== id))
  }

  const filteredExpenses = expenses.filter((expense) => {
    if (filters.startDate && expense.date < filters.startDate) return false
    if (filters.endDate && expense.date > filters.endDate) return false
    if (filters.category && expense.category !== filters.category) return false
    if (filters.minAmount && expense.amount < filters.minAmount) return false
    if (filters.maxAmount && expense.amount > filters.maxAmount) return false
    return true
  })

  const categories = Array.from(new Set(expenses.map((expense) => expense.category)))

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Expense Tracker</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">Expenses</TabsTrigger>
              <TabsTrigger value="add">Add Expense</TabsTrigger>
            </TabsList>
            <TabsContent value="list" className="space-y-4">
              <ExpenseFilters filters={filters} setFilters={setFilters} categories={categories} />
              <ExpenseList expenses={filteredExpenses} onDelete={deleteExpense} onEdit={setEditingExpense} />
            </TabsContent>
            <TabsContent value="add">
              <ExpenseForm
                onSubmit={editingExpense ? updateExpense : addExpense}
                expense={editingExpense}
                categories={categories}
                onCancel={() => setEditingExpense(null)}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <ExpenseSummary expenses={filteredExpenses} />
        </div>
      </div>
    </div>
  )
}

