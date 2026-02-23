'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, BookOpen, DollarSign, Filter, Search, Trash2, LayoutGrid, List, Download } from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { deleteBookFromLibrary, toggleBookPublicStatus, updateReadStatus, updateImportance, updateBookCondition } from '@/components/library-actions'
import { updateBookPricing } from '@/components/pricing-actions'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [library, setLibrary] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('list') // 'card' or 'list'
  const [selectedBook, setSelectedBook] = useState(null)
  const [editingPrices, setEditingPrices] = useState(false)
  const [retailValue, setRetailValue] = useState('')
  const [userSellPrice, setUserSellPrice] = useState('')
  const supabase = createClient()

  useEffect(() => {
    async function getData() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
          const { data, error } = await supabase
            .from('user_library')
            .select(`
                *,
                book:books (
                    isbn,
                    title,
                    author,
                    image_url,
                    genre,
                    publish_date,
                    description
                )
            `)
            .eq('user_id', user.id)
            .order('added_at', { ascending: false })
          
          if (data) setLibrary(data)
      }
      setLoading(false)
    }
    getData()
  }, [supabase])

  const handleDeleteBook = async (bookId) => {
    setLibrary(current => current.filter(i => i.book_id !== bookId))
    try {
            await deleteBookFromLibrary(bookId)
    } catch (err) {
        console.error(err)
        alert("Failed to delete book")
        window.location.reload()
    }
  }

  const handleOpenBookDetails = (item) => {
    setSelectedBook(item)
    setRetailValue(item.retail_value || '')
    setUserSellPrice(item.user_sell_price || '')
    setEditingPrices(false)
  }

  const handleSavePrices = async () => {
    try {
      await updateBookPricing(selectedBook.id, retailValue, userSellPrice)
      // Update local state
      setLibrary(current => current.map(item => 
        item.id === selectedBook.id 
          ? { ...item, retail_value: retailValue ? parseFloat(retailValue) : null, user_sell_price: userSellPrice ? parseFloat(userSellPrice) : null }
          : item
      ))
      setEditingPrices(false)
      setSelectedBook(null)
    } catch (error) {
      console.error(error)
      alert("Failed to update prices")
    }
  }
  
  const handleUpdateStatus = async (itemId, status) => {
    try {
      await updateReadStatus(itemId, status)
      setLibrary(current => current.map(item => 
        item.id === itemId ? { ...item, read_status: status } : item
      ))
      if (selectedBook && selectedBook.id === itemId) {
        setSelectedBook(prev => ({ ...prev, read_status: status }))
      }
    } catch (error) {
      console.error(error)
      alert("Failed to update status")
    }
  }

  const handleUpdateImportance = async (itemId, importance) => {
    try {
      await updateImportance(itemId, importance)
      setLibrary(current => current.map(item => 
        item.id === itemId ? { ...item, user_importance: importance } : item
      ))
      if (selectedBook && selectedBook.id === itemId) {
        setSelectedBook(prev => ({ ...prev, user_importance: importance }))
      }
    } catch (error) {
      console.error(error)
      alert("Failed to update rating")
    }
  }

  const handleUpdateCondition = async (itemId, condition) => {
    try {
      await updateBookCondition(itemId, condition)
      setLibrary(current => current.map(item => 
        item.id === itemId ? { ...item, condition: condition } : item
      ))
      if (selectedBook && selectedBook.id === itemId) {
        setSelectedBook(prev => ({ ...prev, condition: condition }))
      }
    } catch (error) {
      console.error(error)
      alert("Failed to update condition")
    }
  }

  const handleTogglePublic = async (itemId, isPublic) => {
    try {
      await toggleBookPublicStatus(itemId, isPublic)
      setLibrary(current => current.map(item => 
        item.id === itemId ? { ...item, is_public: isPublic } : item
      ))
      if (selectedBook && selectedBook.id === itemId) {
        setSelectedBook(prev => ({ ...prev, is_public: isPublic }))
      }
    } catch (error) {
      console.error(error)
      alert("Failed to update status")
    }
  }

  const totalValue = library.reduce((acc, item) => acc + (Number(item.retail_value) || 0), 0)
  
  const filteredLibrary = library.filter(item => 
    item.book?.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.book?.author.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDownloadCSV = () => {
    const headers = ["ISBN", "Title", "Author", "Publish Date", "Genre", "Read Status", "Retail Value", "My Sell Price", "Date Added"]
    
    const rows = filteredLibrary.map(item => [
      `"${item.book?.isbn || ''}"`,
      `"${item.book?.title.replace(/"/g, '""') || ''}"`,
      `"${item.book?.author.replace(/"/g, '""') || ''}"`,
      `"${item.book?.publish_date || ''}"`,
      `"${item.book?.genre || ''}"`,
      `"${item.read_status || ''}"`,
      item.retail_value || '0',
      item.user_sell_price || '0',
      `"${new Date(item.added_at).toLocaleString()}"`
    ])

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `bookworm_library_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Library</h1>
          <p className="text-muted-foreground">
            {user?.email}
          </p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownloadCSV} disabled={library.length === 0}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            <Link href="/scan">
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Book
                </Button>
            </Link>
        </div>
      </header>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Books
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{library.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Estimated Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                  type="search" 
                  placeholder="Search titles or authors..." 
                  className="pl-8" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
          <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex gap-1 border rounded-md p-1">
          <Button 
            variant={viewMode === 'card' ? 'default' : 'ghost'} 
            size="icon"
            onClick={() => setViewMode('card')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button 
            variant={viewMode === 'list' ? 'default' : 'ghost'} 
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {[1,2,3,4].map(i => (
                  <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
              ))}
          </div>
      ) : library.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed p-12 text-center animate-in fade-in-50">
            <h3 className="text-lg font-semibold">Your library is empty</h3>
            <p className="text-muted-foreground mb-4">Start scanning books to build your collection.</p>
            <Link href="/scan">
                <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" /> Scan First Book
                </Button>
            </Link>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {filteredLibrary.map((item) => (
                <div key={item.id} className="group relative space-y-2">
                    <div 
                      className="aspect-[2/3] overflow-hidden rounded-md border bg-muted shadow-sm transition-all hover:scale-105 hover:shadow-lg cursor-pointer"
                      onClick={() => handleOpenBookDetails(item)}
                    >
                        {item.book?.image_url ? (
                            <img 
                                src={item.book.image_url} 
                                alt={item.book.title}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                             <div className="flex h-full items-center justify-center bg-secondary text-secondary-foreground">
                                <BookOpen className="h-10 w-10" />
                            </div>
                        )}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 items-end">
                            <span className="bg-black/70 text-white text-xs px-2 py-1 rounded-full mb-1">
                                {item.read_status}
                            </span>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button 
                                        variant="destructive" 
                                        size="icon" 
                                        className="h-8 w-8 rounded-full shadow-md"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will remove "<strong>{item.book?.title}</strong>" from your library permanently.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction 
                                            onClick={() => handleDeleteBook(item.book_id)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                    <div onClick={() => handleOpenBookDetails(item)} className="cursor-pointer">
                        <h3 className="font-semibold leading-none truncate" title={item.book?.title}>{item.book?.title}</h3>
                        <p className="text-xs text-muted-foreground truncate">{item.book?.author}</p>
                    </div>
                </div>
            ))}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium">ISBN</th>
                <th className="text-left p-3 font-medium">Title</th>
                <th className="text-left p-3 font-medium">Author</th>
                <th className="text-left p-3 font-medium">Retail Value</th>
                 <th className="text-left p-3 font-medium">My Sell Price</th>
                <th className="text-left p-3 font-medium">Date Added</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLibrary.map((item) => (
                <tr key={item.id} className="border-t hover:bg-muted/50">
                  <td className="p-3 font-mono text-sm">{item.book?.isbn}</td>
                  <td 
                    className="p-3 font-medium cursor-pointer hover:text-primary"
                    onClick={() => handleOpenBookDetails(item)}
                  >
                    {item.book?.title}
                  </td>
                  <td className="p-3 text-sm">{item.book?.author}</td>
                  <td className="p-3 text-sm">
                    {item.retail_value ? `$${Number(item.retail_value).toFixed(2)}` : '-'}
                  </td>
                  <td className="p-3 text-sm">
                    {item.user_sell_price ? `$${Number(item.user_sell_price).toFixed(2)}` : '-'}
                  </td>
                  <td className="p-3 text-sm">
                    {new Date(item.added_at).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove "<strong>{item.book?.title}</strong>" from your library permanently.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteBook(item.book_id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Book Details Modal */}
      <Dialog open={!!selectedBook} onOpenChange={() => setSelectedBook(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedBook?.book?.title}</DialogTitle>
            <DialogDescription>
              by {selectedBook?.book?.author}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBook && (
            <div className="space-y-4">
              <div className="flex gap-4">
                {selectedBook.book?.image_url && (
                  <img 
                    src={selectedBook.book.image_url} 
                    alt={selectedBook.book.title}
                    className="w-32 h-48 object-cover rounded shadow-md"
                  />
                )}
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">ISBN</p>
                      <p className="font-mono text-sm">{selectedBook.book?.isbn}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Published</p>
                      <p className="text-sm">{selectedBook.book?.publish_date || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Genre</p>
                      <p className="text-sm">{selectedBook.book?.genre || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Added</p>
                      <p className="text-sm">{new Date(selectedBook.added_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex flex-col justify-end gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Rating</Label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              "h-6 w-6 cursor-pointer transition-colors",
                              star <= (selectedBook.user_importance || 3)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground hover:text-yellow-200"
                            )}
                            onClick={() => handleUpdateImportance(selectedBook.id, star)}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground">Condition</Label>
                      <Select 
                        value={selectedBook.condition || 'used'} 
                        onValueChange={(value) => handleUpdateCondition(selectedBook.id, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="used">Used</SelectItem>
                          <SelectItem value="worn">Worn</SelectItem>
                          <SelectItem value="damaged">Damaged</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground">Reading Status</Label>
                      <Select 
                        value={selectedBook.read_status || 'Not Read'} 
                        onValueChange={(value) => handleUpdateStatus(selectedBook.id, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Not Read">Not Read</SelectItem>
                          <SelectItem value="Reading">Reading</SelectItem>
                          <SelectItem value="Read">Read</SelectItem>
                          <SelectItem value="Did Not Finish">Did Not Finish</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center justify-between gap-3 bg-muted/50 p-3 rounded-lg border">
                        <Label className="text-sm font-semibold cursor-pointer" htmlFor="public-toggle">
                          Publicly Visible
                        </Label>
                        <Switch 
                            id="public-toggle"
                            checked={selectedBook.is_public} 
                            onCheckedChange={(checked) => handleTogglePublic(selectedBook.id, checked)}
                        />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                <p className="text-sm leading-relaxed">
                  {selectedBook.book?.description || 'No description available for this book.'}
                </p>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Pricing Information</h3>
                  {!editingPrices && (
                    <Button variant="outline" size="sm" onClick={() => setEditingPrices(true)}>
                      Edit Prices
                    </Button>
                  )}
                </div>
                
                {editingPrices ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Retail Value</label>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00"
                        value={retailValue}
                        onChange={(e) => setRetailValue(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">My Sell Price</label>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00"
                        value={userSellPrice}
                        onChange={(e) => setUserSellPrice(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSavePrices}>Save</Button>
                      <Button variant="outline" onClick={() => setEditingPrices(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Retail Value</p>
                      <p className="text-lg font-semibold">
                        {selectedBook.retail_value ? `$${Number(selectedBook.retail_value).toFixed(2)}` : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">My Sell Price</p>
                      <p className="text-lg font-semibold">
                        {selectedBook.user_sell_price ? `$${Number(selectedBook.user_sell_price).toFixed(2)}` : 'Not set'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
