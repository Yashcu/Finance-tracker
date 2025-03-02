"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/Navbar";
import { api } from "@/lib/api-helpers";
import dynamic from "next/dynamic";
import { trackPageLoad } from "@/lib/performance-metrics";

// Type definition for ExpenseForm props
interface ExpenseFormProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

// Lazy load ExpenseForm component
const ExpenseForm = dynamic<ExpenseFormProps>(
  () => import('@/components/expense-form'),
  {
    loading: () => <div className="p-4 text-center">Loading form...</div>,
    ssr: false
  }
);

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

interface ExpenseResponse {
  data: Expense[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  }
}

interface ExpenseFormData {
  amount: number;
  category: string;
  description: string;
  date: string;
}

// Loading placeholder
const LoadingExpenses = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-4 w-3/4 rounded bg-gray-200"></div>
    <div className="h-4 w-1/2 rounded bg-gray-200"></div>
    <div className="h-4 w-5/6 rounded bg-gray-200"></div>
  </div>
);

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [expenseData, setExpenseData] = useState<ExpenseResponse | null>(null);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    category: "",
    startDate: "",
    endDate: ""
  });

  // Track page load
  useEffect(() => {
    trackPageLoad('/dashboard');
  }, []);

  // Build the query string based on filters and pagination
  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    params.append('page', currentPage.toString());
    params.append('limit', '10'); // Show 10 expenses per page
    
    if (filters.category) {
      params.append('category', filters.category);
    }
    
    if (filters.startDate) {
      params.append('startDate', filters.startDate);
    }
    
    if (filters.endDate) {
      params.append('endDate', filters.endDate);
    }
    
    return params.toString();
  }, [currentPage, filters]);

  // Optimized fetch with debounce
  const fetchExpenses = useCallback(async () => {
    if (status !== "authenticated") return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const queryString = buildQueryString();
      const response = await fetch(`/api/expenses?${queryString}`);
      
      if (!response.ok) throw new Error("Failed to fetch expenses");
      
      const data = await response.json();
      setExpenseData(data);
    } catch (error) {
      setError("Failed to load expenses");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [status, buildQueryString]);

  // Authentication and initial data loading
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchExpenses();
    }
  }, [status, router, fetchExpenses]);

  // Handle adding expense with optimistic UI update
  const handleAddExpense = async (formData: ExpenseFormData) => {
    setError(null);

    try {
      // Optimistic UI update - add temporary expense
      const tempId = `temp-${Date.now()}`;
      const tempExpense = { ...formData, id: tempId };
      
      if (expenseData && expenseData.data) {
        setExpenseData({
          ...expenseData,
          data: [tempExpense, ...expenseData.data],
          pagination: expenseData.pagination
        });
      }

      // Make the API call
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to add expense");
      }

      setIsAddingExpense(false);
      // Fetch the updated list to get the real ID and ensure data consistency
      fetchExpenses();
    } catch (error) {
      setError("Failed to add expense");
      // Revert the optimistic update by re-fetching
      fetchExpenses();
    }
  };

  // Apply filters
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Memoized total to prevent recalculation on each render
  const totalExpenses = useMemo(() => {
    if (!expenseData?.data) return 0;
    return expenseData.data.reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenseData?.data]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-lg">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Summary Card */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <div className="mt-4">
              <p className="text-lg text-gray-600">
                Total Expenses:{" "}
                <span className="font-bold text-indigo-600">
                  ${totalExpenses.toFixed(2)}
                </span>
              </p>
            </div>
          </div>

          {/* Expense Form */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            {!isAddingExpense ? (
              <button
                onClick={() => setIsAddingExpense(true)}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Add Expense
              </button>
            ) : (
              <Suspense fallback={<div>Loading form...</div>}>
                <ExpenseForm 
                  onSubmit={handleAddExpense} 
                  onCancel={() => setIsAddingExpense(false)} 
                />
              </Suspense>
            )}
          </div>

          {/* Filters */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">All Categories</option>
                  <option value="Food">Food</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="mt-4">
              <button 
                onClick={() => fetchExpenses()}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Apply Filters
              </button>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="text-xl font-semibold text-gray-900">Expenses</h2>
            {isLoading ? (
              <LoadingExpenses />
            ) : error ? (
              <p className="text-red-600">{error}</p>
            ) : !expenseData || expenseData.data.length === 0 ? (
              <p>No expenses found.</p>
            ) : (
              <>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {expenseData.data.map((expense) => (
                        <tr key={expense.id}>
                          <td className="whitespace-nowrap px-6 py-4">
                            {new Date(expense.date).toLocaleDateString()}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">{expense.category}</td>
                          <td className="px-6 py-4">{expense.description}</td>
                          <td className="whitespace-nowrap px-6 py-4">
                            ${expense.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                {expenseData.pagination && expenseData.pagination.pages > 1 && (
                  <div className="mt-6 flex justify-center">
                    <nav className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="rounded-md border border-gray-300 px-3 py-1 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-700">
                        Page {currentPage} of {expenseData.pagination.pages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, expenseData.pagination.pages))}
                        disabled={currentPage === expenseData.pagination.pages}
                        className="rounded-md border border-gray-300 px-3 py-1 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 