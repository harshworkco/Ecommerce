"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { categoryApi } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ProductImage from "@/components/ProductImage"
import { Layers, Loader2, Pencil, Plus, Trash2, X } from "lucide-react"
import type { Category } from "@/types"

const blankForm = { name: "", description: "", image_url: "" }

export default function AdminCategoriesPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(blankForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await categoryApi.getAll()
      setCategories(res.categories || [])
    } catch (error: any) {
      toast.error(error.message || "Failed to load categories")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading) return
    if (user?.role !== "admin") {
      setLoading(false)
      return
    }
    load()
  }, [authLoading, user])

  const resetForm = () => {
    setForm(blankForm)
    setEditingId(null)
    setShowForm(false)
  }

  const startEdit = (category: Category) => {
    setForm({
      name: category.name,
      description: category.description || "",
      image_url: category.image_url || "",
    })
    setEditingId(category.id)
    setShowForm(true)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error("Category name is required")
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        await categoryApi.update(editingId, form)
        toast.success("Category updated")
      } else {
        await categoryApi.create(form)
        toast.success("Category created")
      }
      resetForm()
      load()
    } catch (error: any) {
      toast.error(error.message || "Failed to save category")
    } finally {
      setSaving(false)
    }
  }

  const deactivate = async (category: Category) => {
    if (!window.confirm(`Deactivate "${category.name}"? Products stay intact.`)) return
    setBusyId(category.id)
    try {
      await categoryApi.delete(category.id)
      setCategories((prev) => prev.filter((c) => c.id !== category.id))
      toast.success("Category deactivated")
    } catch (error: any) {
      toast.error(error.message || "Failed to deactivate category")
    } finally {
      setBusyId(null)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-10 text-sm text-muted-foreground shadow-soft">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading categories...
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
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground">{categories.length} active categories</p>
        </div>
        <Button
          onClick={() => {
            if (showForm) resetForm()
            else setShowForm(true)
          }}
        >
          {showForm ? <X className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
          {showForm ? "Cancel" : "New category"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit category" : "New category"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
              <Input
                placeholder="Name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                placeholder="Image URL (e.g. /images/categories/books.jpg)"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              />
              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input-field min-h-20 sm:col-span-2"
              />
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                  {editingId ? "Save changes" : "Create category"}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {categories.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-soft">
          <Layers className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-semibold">No categories yet</p>
          <p className="text-sm text-muted-foreground">Create one to start grouping products.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft"
            >
              <div className="relative h-28 bg-secondary">
                <ProductImage
                  src={category.image_url}
                  alt={category.name}
                  seed={category.id}
                />
              </div>
              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-base font-bold">{category.name}</h3>
                    <p className="text-xs text-muted-foreground">/{category.slug}</p>
                  </div>
                  <Badge variant="outline">{Number(category.product_count || 0)} items</Badge>
                </div>
                <p className="line-clamp-2 min-h-8 text-sm text-muted-foreground">
                  {category.description || "No description"}
                </p>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => startEdit(category)}>
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === category.id}
                    onClick={() => deactivate(category)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Deactivate
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
