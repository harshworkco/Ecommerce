"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import { useAuth } from "@/context/AuthContext"
import { adminApi, categoryApi, productApi } from "@/lib/api"
import { formatPrice } from "@/lib/utils"
import { Plus, Trash2, Star, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import ProductImage from "@/components/ProductImage"
import type { Category, Product } from "@/types"

const emptyForm = {
  name: "",
  price: "",
  discount_price: "",
  stock: "",
  category_id: "",
  description: "",
  image_url: "",
}

export default function AdminProductsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        adminApi.getAllProducts(),
        categoryApi.getAll(),
      ])
      setProducts(prodRes.products || [])
      setCategories(catRes.categories || [])
    } catch (error: any) {
      toast.error(error.message || "Failed to load products")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading) return
    if (!user || user.role !== "admin") {
      setLoading(false)
      return
    }
    load()
  }, [authLoading, user])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.price) {
      toast.error("Name and price are required")
      return
    }
    setSaving(true)
    try {
      await productApi.create({
        name: form.name.trim(),
        price: parseFloat(form.price),
        discount_price: form.discount_price ? parseFloat(form.discount_price) : null,
        stock: form.stock ? parseInt(form.stock) : 0,
        category_id: form.category_id ? parseInt(form.category_id) : null,
        description: form.description || null,
        image_url: form.image_url || null,
        is_active: true,
      })
      toast.success("Product created")
      setForm(emptyForm)
      setShowForm(false)
      await load()
    } catch (error: any) {
      toast.error(error.message || "Failed to create product")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product?")) return
    setBusyId(id)
    try {
      await productApi.delete(id)
      setProducts((prev) => prev.filter((p) => p.id !== id))
      toast.success("Product deleted")
    } catch (error: any) {
      toast.error(error.message || "Failed to delete product")
    } finally {
      setBusyId(null)
    }
  }

  const toggleFeatured = async (product: Product) => {
    setBusyId(product.id)
    try {
      await productApi.update(product.id, { is_featured: !product.is_featured })
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_featured: !p.is_featured } : p))
      )
    } catch (error: any) {
      toast.error(error.message || "Failed to update product")
    } finally {
      setBusyId(null)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-10 text-sm text-muted-foreground shadow-soft">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        Loading products...
      </div>
    )
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-soft">
        <h2 className="text-2xl font-bold mb-2">Access denied</h2>
        <p className="text-muted-foreground mb-4">Admin access required.</p>
        <Link href="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manage Products</h1>
          <p className="text-muted-foreground">{products.length} products</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cancel" : "New product"}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>New Product</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
              <Input
                placeholder="Name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                step="0.01"
                placeholder="Price *"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Discount price"
                value={form.discount_price}
                onChange={(e) => setForm({ ...form, discount_price: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Stock"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
              />
              <Input
                placeholder="Image URL"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              />
              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="sm:col-span-2 min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <div className="sm:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Create product"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-3 text-sm font-medium text-muted-foreground">Product</th>
              <th className="pb-3 text-sm font-medium text-muted-foreground">Category</th>
              <th className="pb-3 text-sm font-medium text-muted-foreground">Price</th>
              <th className="pb-3 text-sm font-medium text-muted-foreground">Stock</th>
              <th className="pb-3 text-sm font-medium text-muted-foreground">Status</th>
              <th className="pb-3 text-sm font-medium text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-border">
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded bg-secondary flex-shrink-0">
                      <ProductImage src={product.image_url} alt={product.name} seed={product.id} />
                    </div>
                    <Link
                      href={`/products/${product.id}`}
                      className="font-medium hover:text-primary line-clamp-1"
                    >
                      {product.name}
                    </Link>
                  </div>
                </td>
                <td className="py-3 text-sm text-muted-foreground">
                  {product.category_name || "—"}
                </td>
                <td className="py-3 text-sm">{formatPrice(product.discount_price ?? product.price)}</td>
                <td className="py-3 text-sm">
                  <span className={product.stock <= 0 ? "text-destructive" : ""}>
                    {product.stock}
                  </span>
                </td>
                <td className="py-3">
                  <Badge variant={product.is_active ? "default" : "outline"}>
                    {product.is_active ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFeatured(product)}
                      disabled={busyId === product.id}
                      title={product.is_featured ? "Unfeature" : "Feature"}
                    >
                      <Star
                        size={16}
                        className={product.is_featured ? "fill-yellow-400 text-yellow-500" : ""}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                      disabled={busyId === product.id}
                      title="Delete"
                    >
                      <Trash2 size={16} className="text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted-foreground">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
