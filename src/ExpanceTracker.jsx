import { useCallback, useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

// Expense Tracker App - Single file React component
// Tailwind CSS only for styling. Default export at bottom.

const SAMPLE = [
  {
    id: "t1",
    description: "Salary",
    category: "Salary",
    amount: 4500,
    type: "income",
    date: new Date().toISOString().slice(0, 10),
  },
  {
    id: "t2",
    description: "Groceries",
    category: "Food",
    amount: 120.5,
    type: "expense",
    date: new Date().toISOString().slice(0, 10),
  },
  {
    id: "t3",
    description: "Electricity Bill",
    category: "Utilities",
    amount: 60,
    type: "expense",
    date: new Date().toISOString().slice(0, 10),
  },
];

const CATEGORIES = [
  "Food",
  "Transport",
  "Utilities",
  "Entertainment",
  "Health",
  "Shopping",
  "Salary",
  "Misc",
];

const COLORS = [
  "#60a5fa",
  "#34d399",
  "#f97316",
  "#f472b6",
  "#fca5a5",
  "#a78bfa",
  "#f59e0b",
  "#94a3b8",
];

const STORAGE_KEY = "expense_tracker_v1";

function currencyFormatter(value) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);
  } catch (e) {
    console.log(e);
    return "₹" + Number(value).toFixed(2);
  }
}

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID)
    return crypto.randomUUID();
  return "id_" + Date.now() + Math.random().toString(36).slice(2, 9);
}

export default function ExpenseTrackerApp() {
  // load from localStorage or fallback to sample
  const [transactions, setTransactions] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.log(e);
    }
    return SAMPLE;
  });

  const [form, setForm] = useState(() => ({
    description: "",
    category: CATEGORIES[0],
    amount: "",
    type: "expense",
    date: new Date().toISOString().slice(0, 10),
  }));

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (e) {
      console.log(e);
      // ignore storage errors
    }
  }, [transactions]);

  // derived values
  const totals = useMemo(() => {
    let income = 0;
    let expenses = 0;
    for (const t of transactions) {
      const amt = Number(t.amount) || 0;
      if (t.type === "income") income += amt;
      else expenses += amt;
    }
    return {
      income: +income.toFixed(2),
      expenses: +expenses.toFixed(2),
      balance: +(income - expenses).toFixed(2),
    };
  }, [transactions]);

  // pie chart data (spending by category)
  const spendingByCategory = useMemo(() => {
    const map = new Map();
    for (const transaction of transactions) {
      if (transaction.type !== "expense") continue;
      const k = transaction.category || "Misc";
      map.set(k, (map.get(k) || 0) + Number(transaction.amount || 0));
    }
    const arr = Array.from(map.entries()).map(([name, value]) => ({
      name,
      value: +value.toFixed(2),
    }));
    // ensure stable ordering by value desc
    arr.sort((a, b) => b.value - a.value);
    return arr;
  }, [transactions]);

  const handleInput = useCallback((e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }, []);

  const addTransaction = useCallback(
    (e) => {
      e.preventDefault();
      const amount = Number(form.amount);
      if (!form.description.trim()) return alert("Please enter a description.");
      if (!Number.isFinite(amount) || amount <= 0)
        return alert("Amount must be a positive number.");
      const payload = {
        id: uid(),
        description: form.description.trim(),
        category: form.category || "Misc",
        amount: +amount.toFixed(2),
        type: form.type,
        date: form.date || new Date().toISOString().slice(0, 10),
      };
      setTransactions((t) => [payload, ...t]);
      setForm((s) => ({
        ...s,
        description: "",
        amount: "",
        date: new Date().toISOString().slice(0, 10),
      }));
    },
    [form]
  );

  const deleteTransaction = useCallback((id) => {
    if (!confirm("Delete this transaction?")) return;
    setTransactions((t) => t.filter((x) => x.id !== id));
  }, []);

  // small helpers
  const amountClass = (type) =>
    type === "income" ? "text-green-600" : "text-red-600";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-800">
              Expense Tracker
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Operational overview of income, expenses & cash position.
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Balance</p>
            <div
              aria-live="polite"
              className="mt-1 font-mono text-lg sm:text-xl"
            >
              <span
                className={`px-3 py-2 rounded-lg font-semibold ${
                  totals.balance >= 0
                    ? "bg-green-50 text-green-800"
                    : "bg-red-50 text-red-800"
                }`}
              >
                {currencyFormatter(totals.balance)}
              </span>
            </div>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Form + Summary */}
          <section className="lg:col-span-1 bg-white shadow-sm rounded-2xl p-4 sm:p-6">
            <h2 className="text-lg font-medium text-slate-800">
              New Transaction
            </h2>
            <form
              onSubmit={addTransaction}
              className="mt-4 space-y-3"
              aria-label="Add transaction form"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Description
                </label>
                <input
                  name="description"
                  value={form.description}
                  onChange={handleInput}
                  className="mt-1 block w-full rounded-md border border-slate-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                  placeholder="e.g. Apple"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Category
                  </label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleInput}
                    className="mt-1 block w-full rounded-md border border-slate-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Type
                  </label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleInput}
                    className="mt-1 block w-full rounded-md border border-slate-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Amount
                  </label>
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.amount}
                    onChange={handleInput}
                    className="mt-1 block w-full rounded-md border border-slate-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                    placeholder="0.00"
                    required
                    aria-label="Transaction amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Date
                  </label>
                  <input
                    name="date"
                    type="date"
                    value={form.date}
                    onChange={handleInput}
                    className="mt-1 block w-full rounded-md border border-slate-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
                >
                  Add Transaction
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      description: "",
                      category: CATEGORIES[0],
                      amount: "",
                      type: "expense",
                      date: new Date().toISOString().slice(0, 10),
                    })
                  }
                  className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-300"
                >
                  Reset
                </button>
              </div>
            </form>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-slate-700">
                Quick Summary
              </h3>
              <dl className="mt-3 grid grid-cols-3 gap-3">
                <div className="col-span-1 bg-slate-50 rounded-lg p-3 text-center">
                  <dt className="text-xs text-slate-500">Income</dt>
                  <dd className="mt-1 font-medium text-sm text-green-700">
                    {currencyFormatter(totals.income)}
                  </dd>
                </div>
                <div className="col-span-1 bg-slate-50 rounded-lg p-3 text-center">
                  <dt className="text-xs text-slate-500">Expenses</dt>
                  <dd className="mt-1 font-medium text-sm text-red-700">
                    {currencyFormatter(totals.expenses)}
                  </dd>
                </div>
                <div className="col-span-1 bg-slate-50 rounded-lg p-3 text-center">
                  <dt className="text-xs text-slate-500">Balance</dt>
                  <dd className="mt-1 font-medium text-sm">
                    {currencyFormatter(totals.balance)}
                  </dd>
                </div>
              </dl>
            </div>
          </section>
          {/* Middle: Charts */}
          <section className="lg:col-span-2 grid grid-cols-1 gap-6">
            <div className="bg-white shadow-sm rounded-2xl p-4 sm:p-6">
              <h2 className="text-lg font-medium text-slate-800">
                Spending by Category
              </h2>
              <div className="mt-4 h-80 lg:h-[20rem]">
                {spendingByCategory.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-slate-500">
                    No expense data to visualize.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        dataKey="value"
                        data={spendingByCategory}
                        nameKey="name"
                        outerRadius={120}
                        innerRadius={50}
                        paddingAngle={1}
                        label
                      >
                        {spendingByCategory.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => currencyFormatter(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </section>
          {/* Right: Transaction List */}
          <section className="lg:col-span-3 col-span-1 bg-white shadow-sm rounded-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-slate-800">
                Transactions
              </h2>
              <div className="text-sm text-slate-500">
                {transactions.length} items
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm table-auto" role="table">
                <thead className="text-slate-600 border-b">
                  <tr>
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Description</th>
                    <th className="text-left py-2">Category</th>
                    <th className="text-right py-2">Amount</th>
                    <th className="py-2"> </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b last:border-b-0">
                      <td className="py-3 align-top">
                        {new Date(t.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 align-top">{t.description}</td>
                      <td className="py-3 align-top">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                          {t.category}
                        </span>
                      </td>
                      <td
                        className={`py-3 text-right align-top ${amountClass(
                          t.type
                        )}`}
                      >
                        {t.type === "expense" ? "-" : "+"}
                        {currencyFormatter(t.amount)}
                      </td>
                      <td className="py-3 text-right align-top">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => deleteTransaction(t.id)}
                            aria-label={`Delete ${t.description}`}
                            className="inline-flex items-center rounded-md px-2 py-1 text-xs border border-transparent bg-red-50 text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-6 text-center text-sm text-slate-500"
                      >
                        No transactions recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
              <div>
                <button
                  onClick={() => {
                    if (
                      !confirm("Clear all transactions? This cannot be undone.")
                    )
                      return;
                    setTransactions([]);
                  }}
                  className="inline-flex items-center rounded-md px-3 py-2 text-xs border border-slate-200 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-300"
                >
                  Clear All
                </button>
              </div>
            </div>
          </section>
        </main>

        <footer className="mt-8 text-center text-xs text-slate-400">
          Expance Tracker App
        </footer>
      </div>
    </div>
  );
}
