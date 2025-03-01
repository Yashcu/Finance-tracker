"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon, Check, ChevronsUpDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import type { ExpenseFilter } from "./expense-tracker"

interface ExpenseFiltersProps {
  filters: ExpenseFilter
  setFilters: (filters: ExpenseFilter) => void
  categories: string[]
}

export function ExpenseFilters({ filters, setFilters, categories }: ExpenseFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [openStartDate, setOpenStartDate] = useState(false)
  const [openEndDate, setOpenEndDate] = useState(false)
  const [openCategory, setOpenCategory] = useState(false)

  const resetFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      category: null,
      minAmount: null,
      maxAmount: null,
    })
  }

  const hasActiveFilters =
    filters.startDate !== null ||
    filters.endDate !== null ||
    filters.category !== null ||
    filters.minAmount !== null ||
    filters.maxAmount !== null

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Filters</h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={resetFilters} className="h-8 gap-1">
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8">
              {isOpen ? "Hide Filters" : "Show Filters"}
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>

      <CollapsibleContent className="mt-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Date Range</Label>
            <div className="flex items-center gap-2">
              <Popover open={openStartDate} onOpenChange={setOpenStartDate}>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.startDate ? format(filters.startDate, "PPP") : <span>Start date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.startDate || undefined}
                    onSelect={(date) => {
                      setFilters({ ...filters, startDate: date })
                      setOpenStartDate(false)
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <span>to</span>

              <Popover open={openEndDate} onOpenChange={setOpenEndDate}>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.endDate ? format(filters.endDate, "PPP") : <span>End date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.endDate || undefined}
                    onSelect={(date) => {
                      setFilters({ ...filters, endDate: date })
                      setOpenEndDate(false)
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Popover open={openCategory} onOpenChange={setOpenCategory}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCategory}
                  className="w-full justify-between"
                >
                  {filters.category || "All categories"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search category..." />
                  <CommandList>
                    <CommandEmpty>No category found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          setFilters({ ...filters, category: null })
                          setOpenCategory(false)
                        }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", !filters.category ? "opacity-100" : "opacity-0")} />
                        All categories
                      </CommandItem>
                      {categories.map((category) => (
                        <CommandItem
                          key={category}
                          onSelect={() => {
                            setFilters({ ...filters, category })
                            setOpenCategory(false)
                          }}
                        >
                          <Check
                            className={cn("mr-2 h-4 w-4", filters.category === category ? "opacity-100" : "opacity-0")}
                          />
                          {category}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="minAmount">Min Amount</Label>
            <Input
              id="minAmount"
              type="number"
              step="0.01"
              min="0"
              value={filters.minAmount || ""}
              onChange={(e) => {
                const value = e.target.value ? Number.parseFloat(e.target.value) : null
                setFilters({ ...filters, minAmount: value })
              }}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxAmount">Max Amount</Label>
            <Input
              id="maxAmount"
              type="number"
              step="0.01"
              min="0"
              value={filters.maxAmount || ""}
              onChange={(e) => {
                const value = e.target.value ? Number.parseFloat(e.target.value) : null
                setFilters({ ...filters, maxAmount: value })
              }}
              placeholder="0.00"
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

