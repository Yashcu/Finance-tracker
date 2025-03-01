"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import type { Expense } from "./expense-tracker"

interface ExpenseFormProps {
  onSubmit: (expense: Expense) => void
  expense: Expense | null
  categories: string[]
  onCancel: () => void
}

export function ExpenseForm({ onSubmit, expense, categories, onCancel }: ExpenseFormProps) {
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")
  const [date, setDate] = useState<Date>(new Date())
  const [newCategory, setNewCategory] = useState("")
  const [openCalendar, setOpenCalendar] = useState(false)
  const [openCategory, setOpenCategory] = useState(false)

  useEffect(() => {
    if (expense) {
      setDescription(expense.description)
      setAmount(expense.amount.toString())
      setCategory(expense.category)
      setDate(expense.date)
    }
  }, [expense])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const expenseData: Expense = {
      id: expense?.id || "",
      description,
      amount: Number.parseFloat(amount),
      category: category || newCategory,
      date,
    }

    onSubmit(expenseData)

    if (!expense) {
      setDescription("")
      setAmount("")
      setCategory("")
      setNewCategory("")
      setDate(new Date())
    }
  }

  const allCategories = [...categories]
  if (newCategory && !categories.includes(newCategory)) {
    allCategories.push(newCategory)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
      <h2 className="text-xl font-semibold mb-4">{expense ? "Edit Expense" : "Add New Expense"}</h2>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What did you spend on?"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Popover open={openCategory} onOpenChange={setOpenCategory}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={openCategory} className="w-full justify-between">
              {category ? category : "Select category..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search category..." />
              <CommandList>
                <CommandEmpty>
                  <div className="p-2">
                    <p className="text-sm">No category found.</p>
                    <div className="mt-2 flex items-center space-x-2">
                      <Input
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="Add new category"
                        className="h-8"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          if (newCategory) {
                            setCategory(newCategory)
                            setOpenCategory(false)
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </CommandEmpty>
                <CommandGroup>
                  {allCategories.map((cat) => (
                    <CommandItem
                      key={cat}
                      value={cat}
                      onSelect={() => {
                        setCategory(cat)
                        setOpenCategory(false)
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", category === cat ? "opacity-100" : "opacity-0")} />
                      {cat}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Popover open={openCalendar} onOpenChange={setOpenCalendar}>
          <PopoverTrigger asChild>
            <Button id="date" variant={"outline"} className="w-full justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(date) => {
                if (date) {
                  setDate(date)
                  setOpenCalendar(false)
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        {expense && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit">{expense ? "Update" : "Add"} Expense</Button>
      </div>
    </form>
  )
}

