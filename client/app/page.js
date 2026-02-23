'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Html5Scanner from '@/components/scanner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Loader2, Search, BookOpen } from 'lucide-react'
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
const { addBookToLibrary, checkBookInLibrary } = require('@/components/library-actions')

export default function Home() {
  const router = useRouter()
  const [manualIsbn, setManualIsbn] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [bookData, setBookData] = useState(null)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [scannedIsbn, setScannedIsbn] = useState(null)
  const [isNotFoundOpen, setIsNotFoundOpen] = useState(false)
  const [isManualOpen, setIsManualOpen] = useState(false)
  const [retryIsbn, setRetryIsbn] = useState('')
  const [manualForm, setManualForm] = useState({
      title: '',
      author: '',
      isbn: '',
      description: '',
      publish_date: '',
      genre: ''
  })
  const [user, setUser] = useState(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [])

  const handleScanSuccess = useCallback((decodedText) => {
     fetchBookData(decodedText)
  }, [])

  const handleManualSearch = (e) => {
    e.preventDefault()
    if (manualIsbn) {
      fetchBookData(manualIsbn)
    }
  }

  const fetchBookData = async (rawIsbn) => {
    // Scrub non-digit characters (except X for ISBN-10) and trim
    let isbn = rawIsbn.trim().replace(/[^\dX]/gi, '')
    
    // Handle supplemental codes (e.g. scanners reading 13-digit + 5-digit extension)
    if (isbn.length >= 13 && (isbn.startsWith('978') || isbn.startsWith('979'))) {
      isbn = isbn.substring(0, 13)
    } else if (isbn.length >= 10) {
      isbn = isbn.substring(0, 10)
    }
    
    setIsLoading(true)
    setScannedIsbn(isbn)
    try {
      // 1. Check our database first
      const libraryItem = await checkBookInLibrary(isbn)
      if (libraryItem && libraryItem.book) {
          setBookData(libraryItem.book)
          setIsLoading(false)
          return
      }

      // 2. Fallback to Google
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}${apiKey ? `&key=${apiKey}` : ''}`)
      const data = await response.json()
      
      if (data.items && data.items.length > 0) {
        const item = data.items[0]
        const bookInfo = {
          ...item.volumeInfo,
          retailPrice: item.saleInfo?.retailPrice?.amount || item.saleInfo?.listPrice?.amount || null
        }
        setBookData(bookInfo)
      } else {
        console.warn("No book found for ISBN", isbn)
        setManualForm(prev => ({ ...prev, isbn: isbn }))
        setIsNotFoundOpen(true)
      }
    } catch (error) {
      console.error("Error fetching book:", error)
      alert("Failed to fetch book data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToLibrary = async () => {
    if (!user) {
        setShowAuthDialog(true)
        return
    }
    
    setIsLoading(true)
    try {
        await addBookToLibrary(bookData)
    } catch (error) {
        if (error.message?.includes('NEXT_REDIRECT')) return
        console.error(error)
        alert("Failed to add book")
        setIsLoading(false)
    }
  }

  const handleManualSubmit = async (e) => {
      e.preventDefault()
      if (!user) {
          setShowAuthDialog(true)
          return
      }

      setIsLoading(true)
      try {
          await addBookToLibrary({
              ...manualForm,
              isManual: true
          })
      } catch (error) {
          if (error.message?.includes('NEXT_REDIRECT')) return
          console.error(error)
          alert("Failed to add manual book")
          setIsLoading(false)
      }
  }

  const handleGoToLogin = () => {
    const nextUrl = scannedIsbn ? `/scan?isbn=${scannedIsbn}` : '/dashboard'
    const loginUrl = `/login?next=${encodeURIComponent(nextUrl)}`
    router.push(loginUrl)
  }

  const handleReset = () => {
    setBookData(null)
    setManualIsbn('')
    setScannedIsbn(null)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 bg-gradient-to-b from-background to-muted/20">


      <div className="flex flex-col items-center gap-8 text-center max-w-2xl">
        {!bookData ? (
          <>
            <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                    Track your library.
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground">
                    Scan books, track value, and connect with other readers.
                </p>
            </div>

            <div className="w-full max-w-md space-y-8 mt-8">
                <Card className="border-2 shadow-xl bg-card/50 backdrop-blur-sm">
                    <CardContent className="pt-6">
                            <div className="mb-4 text-sm font-medium text-muted-foreground">
                                Scan a book to get started
                            </div>
                            <Html5Scanner 
                                onScanSuccess={handleScanSuccess} 
                                onScanFailure={() => {}} 
                            />
                    </CardContent>
                </Card>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or enter ISBN manually</span>
                    </div>
                </div>

                <form onSubmit={handleManualSearch} className="flex gap-2">
                    <Input 
                        placeholder="Enter ISBN (e.g. 9780743273565)" 
                        value={manualIsbn}
                        onChange={(e) => setManualIsbn(e.target.value)}
                        className="h-12 text-lg"
                    />
                    <Button type="submit" size="icon" className="h-12 w-12" disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" /> : <Search className="w-5 h-5" />}
                    </Button>
                </form>
            </div>
          </>
        ) : (
          <Card className="w-full max-w-md animate-in slide-in-from-bottom-5 shadow-xl">
            <CardHeader>
                <CardTitle>Book Found!</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
                {(bookData.imageLinks?.thumbnail || bookData.image_url) && (
                    <div className="relative w-32 h-48">
                         <img 
                            src={bookData.imageLinks?.thumbnail?.replace('http:', 'https:') || bookData.image_url} 
                            alt={bookData.title}
                            className="object-cover w-full h-full rounded shadow-md"
                        />
                    </div>
                )}
                <div className="text-center space-y-2">
                    <h2 className="text-xl font-bold">{bookData.title}</h2>
                    <p className="text-muted-foreground">
                        {Array.isArray(bookData.authors) ? bookData.authors.join(', ') : (bookData.author || 'Unknown Author')}
                    </p>
                    <p className="text-sm text-gray-500">{bookData.publishedDate || bookData.publish_date}</p>
                    {(bookData.industryIdentifiers || bookData.isbn) && (
                        <p className="text-xs text-muted-foreground font-mono">
                            ISBN: {bookData.isbn || 
                                   bookData.industryIdentifiers?.find(i => i.type === 'ISBN_13')?.identifier || 
                                   bookData.industryIdentifiers?.find(i => i.type === 'ISBN_10')?.identifier || 
                                   'N/A'}
                        </p>
                    )}
                    {bookData.description && (
                        <p className="text-sm text-muted-foreground mt-3 px-4 line-clamp-3 leading-relaxed">
                            {bookData.description}
                        </p>
                    )}
                </div>
                
                <div className="flex flex-col gap-2 w-full mt-4">
                    <Button className="w-full" onClick={handleAddToLibrary}>
                        Add to Library
                    </Button>
                    <Button variant="outline" className="w-full" onClick={handleReset}>
                        Scan Another Book
                    </Button>
                </div>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign in to save this book</AlertDialogTitle>
            <AlertDialogDescription>
              Create an account or sign in to add books to your personal library and track your collection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleGoToLogin}>
              Go to Sign In
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Trouble Finding Book Modal */}
      <Dialog open={isNotFoundOpen} onOpenChange={setIsNotFoundOpen}>
          <DialogContent className="sm:max-w-md">
              <DialogHeader>
                  <DialogTitle>Trouble Finding Book</DialogTitle>
                  <DialogDescription>
                      We are having trouble finding the Book with ISBN <strong>{manualForm.isbn}</strong> in our database.
                  </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                  <div className="space-y-4">
                      <div className="grid gap-2">
                          <Label htmlFor="retry-isbn">Enter ISBN manually</Label>
                          <div className="flex gap-2">
                              <Input 
                                  id="retry-isbn"
                                  placeholder="Enter 10 or 13 digit ISBN"
                                  value={retryIsbn}
                                  onChange={(e) => setRetryIsbn(e.target.value)}
                              />
                              <Button 
                                  onClick={() => {
                                      setIsNotFoundOpen(false)
                                      fetchBookData(retryIsbn)
                                      setRetryIsbn('')
                                  }}
                                  disabled={!retryIsbn}
                              >
                                  Search
                              </Button>
                          </div>
                      </div>
                  </div>

                  <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">Or</span>
                      </div>
                  </div>

                  <Button 
                      variant="outline" 
                      className="w-full justify-center"
                      onClick={() => {
                          setIsNotFoundOpen(false)
                          setIsManualOpen(true)
                      }}
                  >
                      Enter book details manually
                  </Button>
              </div>
          </DialogContent>
      </Dialog>

      {/* Manual Entry Modal */}
      <Dialog open={isManualOpen} onOpenChange={setIsManualOpen}>
          <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                  <DialogTitle>Enter Book Details</DialogTitle>
                  <DialogDescription>
                      Add a book manually when it's not found in our database.
                  </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleManualSubmit} className="grid gap-4 py-4">
                  <div className="grid gap-2">
                      <Label htmlFor="title">Book Title *</Label>
                      <Input 
                          id="title" 
                          required
                          value={manualForm.title}
                          onChange={(e) => setManualForm({...manualForm, title: e.target.value})}
                      />
                  </div>
                  <div className="grid gap-2">
                      <Label htmlFor="author">Author</Label>
                      <Input 
                          id="author" 
                          value={manualForm.author}
                          onChange={(e) => setManualForm({...manualForm, author: e.target.value})}
                      />
                  </div>
                  <div className="grid gap-2">
                      <Label htmlFor="isbn_manual">ISBN</Label>
                      <Input 
                          id="isbn_manual" 
                          value={manualForm.isbn}
                          onChange={(e) => setManualForm({...manualForm, isbn: e.target.value})}
                      />
                  </div>
                  <div className="grid gap-2">
                      <Label htmlFor="genre">Genre</Label>
                      <Input 
                          id="genre" 
                          value={manualForm.genre}
                          onChange={(e) => setManualForm({...manualForm, genre: e.target.value})}
                      />
                  </div>
                  <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <textarea 
                          id="description" 
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          value={manualForm.description}
                          onChange={(e) => setManualForm({...manualForm, description: e.target.value})}
                      />
                  </div>
                  <DialogFooter>
                      <Button type="submit" disabled={isLoading}>
                          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Add to Library
                      </Button>
                  </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>
    </main>
  )
}
