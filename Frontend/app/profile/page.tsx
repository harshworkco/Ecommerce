"use client"

import { useAuth } from "@/context/AuthContext"
import { authApi, loyaltyApi } from "@/lib/api"
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import Link from "next/link"
import {
  User,
  Mail,
  Phone,
  Home,
  Save,
  LogOut,
  Award,
  Gift,
  Loader2,
  Sparkles,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatDate } from "@/lib/utils"
import type { LoyaltyProfile, LoyaltyTransaction, Reward } from "@/types"

const TIERS = [
  { name: "Bronze", min: 0 },
  { name: "Silver", min: 500 },
  { name: "Gold", min: 1500 },
  { name: "Platinum", min: 3000 },
]

function tierProgress(points: number) {
  const currentIndex = TIERS.reduce(
    (found, tier, index) => (points >= tier.min ? index : found),
    0
  )
  const current = TIERS[currentIndex]
  const next = TIERS[currentIndex + 1]
  if (!next) return { current: current.name, next: null as string | null, percent: 100, remaining: 0 }
  const span = next.min - current.min
  const percent = Math.min(100, Math.round(((points - current.min) / span) * 100))
  return { current: current.name, next: next.name, percent, remaining: next.min - points }
}

export default function ProfilePage() {
  const { user, updateUser, logout, isAuthenticated } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: "", phone: "", address: "" })
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<LoyaltyProfile | null>(null)
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [redeeming, setRedeeming] = useState<number | null>(null)
  const [rewardsLoading, setRewardsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      setForm({ name: user.name, phone: user.phone || "", address: user.address || "" })
    }
  }, [user])

  useEffect(() => {
    if (!isAuthenticated) return
    let active = true
    const loadLoyalty = async () => {
      try {
        const [profileRes, txRes, rewardsRes] = await Promise.all([
          loyaltyApi.getProfile(),
          loyaltyApi.getTransactions(),
          loyaltyApi.getRewards(),
        ])
        if (!active) return
        setProfile(profileRes)
        setTransactions(txRes.transactions || [])
        setRewards(rewardsRes.rewards || [])
      } catch {
        // loyalty data is optional; keep the profile usable
      } finally {
        if (active) setRewardsLoading(false)
      }
    }
    loadLoyalty()
    return () => {
      active = false
    }
  }, [isAuthenticated])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await authApi.updateProfile({
        name: form.name || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
      })
      if (res.user) {
        updateUser(res.user)
        toast.success("Profile updated")
        setEditing(false)
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const handleRedeem = async (reward: Reward) => {
    setRedeeming(reward.id)
    try {
      const res = await loyaltyApi.redeem({ reward_id: reward.id })
      toast.success(res.message || "Reward redeemed")
      const remaining = res.remaining_points
      setProfile((current) =>
        current ? { ...current, loyalty_points: remaining } : current
      )
      if (user) updateUser({ ...user, loyalty_points: remaining })
      const txRes = await loyaltyApi.getTransactions()
      setTransactions(txRes.transactions || [])
    } catch (error: any) {
      toast.error(error.message || "Failed to redeem reward")
    } finally {
      setRedeeming(null)
    }
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="py-12 text-center">
          <h2 className="mb-2 text-2xl font-bold">Please sign in to view your profile</h2>
          <Link href="/login">
            <Button>Sign in</Button>
          </Link>
        </div>
      </div>
    )
  }

  const points = profile?.loyalty_points ?? user.loyalty_points ?? 0
  const progress = tierProgress(points)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <nav className="mb-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-primary">Home</Link>
          <span>/</span>
          <span className="text-foreground">Profile</span>
        </nav>
        <h1 className="text-3xl font-extrabold sm:text-4xl">Your profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage your details, track loyalty points and redeem rewards.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-sky-500 text-xl font-bold text-white">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="truncate font-semibold">{user.name}</h2>
                <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                <p className="mt-0.5 text-xs capitalize text-muted-foreground">{user.role}</p>
              </div>
              <div className="ml-auto flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing((value) => !value)}>
                  <User size={15} /> {editing ? "Cancel" : "Edit"}
                </Button>
                <Button variant="destructive" size="sm" onClick={logout}>
                  <LogOut size={15} /> Sign out
                </Button>
              </div>
            </div>

            {editing && (
              <form onSubmit={handleSave} className="mt-6 space-y-4 border-t border-border pt-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full name</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone</label>
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+1 555 000 0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Address</label>
                    <Input
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="Street, city, ZIP"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? "Saving..." : "Save changes"}
                </Button>
              </form>
            )}

            <div className="mt-6 grid gap-3 border-t border-border pt-6 text-sm sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-muted-foreground" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-muted-foreground" />
                <span className="truncate">{user.phone || "No phone added"}</span>
              </div>
              <div className="flex items-center gap-3 sm:col-span-2">
                <Home size={18} className="text-muted-foreground" />
                <span className="truncate">{user.address || "No address added"}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Loyalty activity</h2>
                <p className="text-sm text-muted-foreground">Every point earned and redeemed.</p>
              </div>
              <Gift className="h-5 w-5 text-primary" />
            </div>
            {transactions.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-secondary/40 p-5 text-sm text-muted-foreground">
                No loyalty activity yet. Earn 1 point for every $10 you spend.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {transactions.slice(0, 8).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {tx.description || (tx.type === "redeem" ? "Reward redeemed" : "Points earned")}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</p>
                    </div>
                    <span
                      className={`shrink-0 text-sm font-bold ${
                        tx.points >= 0 ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {tx.points >= 0 ? "+" : ""}
                      {tx.points} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6 lg:col-span-5">
          <div className="relative overflow-hidden rounded-2xl bg-ink p-6 text-white shadow-lift">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/40 blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                  <Award className="h-3.5 w-3.5" /> {progress.current} member
                </span>
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <p className="mt-6 font-display text-4xl font-extrabold">{points.toLocaleString()}</p>
              <p className="text-sm text-white/60">loyalty points</p>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-sky-400 transition-all"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-white/60">
                {progress.next
                  ? `${progress.remaining.toLocaleString()} points to ${progress.next}`
                  : "You've reached the highest tier."}
              </p>
              <div className="mt-5 flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs text-white/70">
                <span>1 point per $10 spent</span>
                <Link href="/products" className="inline-flex items-center gap-1 font-semibold text-white hover:text-primary">
                  Shop <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Redeem rewards</h2>
                <p className="text-sm text-muted-foreground">Turn points into discounts.</p>
              </div>
              <Gift className="h-5 w-5 text-primary" />
            </div>
            {rewardsLoading ? (
              <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading rewards...
              </div>
            ) : rewards.length === 0 ? (
              <p className="text-sm text-muted-foreground">No rewards available right now.</p>
            ) : (
              <div className="space-y-3">
                {rewards.map((reward) => {
                  const canRedeem = points >= reward.points_required
                  const value = reward.discount_amount
                    ? `$${Number(reward.discount_amount).toFixed(2)} off`
                    : reward.discount_percent
                    ? `${reward.discount_percent}% off`
                    : "Discount"
                  return (
                    <div
                      key={reward.id}
                      className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{reward.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {value} · {reward.points_required.toLocaleString()} pts
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={canRedeem ? "default" : "outline"}
                        disabled={!canRedeem || redeeming === reward.id}
                        onClick={() => handleRedeem(reward)}
                      >
                        {redeeming === reward.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          "Redeem"
                        )}
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
