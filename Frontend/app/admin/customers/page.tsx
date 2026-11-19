"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { adminApi } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { formatDate } from "@/lib/utils"
import { toast } from "react-hot-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Users } from "lucide-react"
import type { User } from "@/types"

export default function AdminCustomersPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [customers, setCustomers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")

  useEffect(() => {
    if (authLoading) return
    if (user?.role !== "admin") {
      setLoading(false)
      return
    }
    let active = true
    const load = async () => {
      try {
        const res = await adminApi.getAllUsers()
        if (active) setCustomers(res.users || [])
      } catch (error: any) {
        toast.error(error.message || "Failed to load customers")
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [authLoading, user])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return customers
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    )
  }, [customers, query])

  if (authLoading || loading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-10 text-sm text-muted-foreground shadow-soft">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading customers...
      </div>
    )
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-soft">
        <h2 className="mb-2 text-2xl font-bold">Access denied</h2>
        <p className="mb-4 text-muted-foreground">Admin access required.</p>
        <Link href="/">
          <Button>Go home</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">
            {customers.length} accounts, ranked by loyalty points.
          </p>
        </div>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or email..."
          className="sm:w-64"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-soft">
          <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-semibold">No customers found</p>
          <p className="text-sm text-muted-foreground">Try a different search.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Customer
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Role
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Loyalty points
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody>
              {[...filtered]
                .sort((a, b) => (b.loyalty_points || 0) - (a.loyalty_points || 0))
                .map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-border last:border-0 hover:bg-secondary/40"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {customer.name.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-xs text-muted-foreground">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge
                        variant="outline"
                        className={
                          customer.role === "admin"
                            ? "bg-violet-500/10 text-violet-700"
                            : "bg-slate-500/10 text-slate-700"
                        }
                      >
                        {customer.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-right font-semibold">
                      {Number(customer.loyalty_points || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {customer.created_at ? formatDate(customer.created_at) : "—"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
