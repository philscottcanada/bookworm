'use client'

import { useState, useCallback, useEffect } from 'react'
import Html5Scanner from '@/components/scanner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Search } from 'lucide-react'
import Image from 'next/image'

  const { addBookToLibrary, checkBookInLibrary } = require('@/components/library-actions')
  const { useRouter } = require('next/navigation')

  import { useSearchParams } from 'next/navigation'
  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
  } from "@/components/ui/dialog"
  import { Label } from "@/components/ui/label"

  export default function ScanPage() {
  const [scannedResult, setScannedResult] = useState(null)
  const [manualIsbn, setManualIsbn] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [bookData, setBookData] = useState(null)
  const [existingInLibrary, setExistingInLibrary] = useState(null)
  const [isPublic, setIsPublic] = useState(true)
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
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
      const isbnParam = searchParams.get('isbn')
      if (isbnParam && !bookData && !isLoading) {
          setScannedResult(isbnParam)
          fetchBookData(isbnParam)
      }
  }, [searchParams])

  const handleScanSuccess = useCallback((decodedText, decodedResult) => {
    // Prevent multiple calls
    if (isLoading || bookData) return
    setScannedResult(decodedText)
    fetchBookData(decodedText)
  }, [isLoading, bookData])

  const handleScanFailure = useCallback((error) => {
    // quiet failure
  }, [])

  const handleManualSearch = (e) => {
    e.preventDefault()
    if (manualIsbn) {
      setScannedResult(manualIsbn)
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
    setExistingInLibrary(null)
    try {
      // 1. Check our database first
      const libraryItem = await checkBookInLibrary(isbn)
      
      if (libraryItem && libraryItem.book) {
          // If book exists and is manual, or we already have it in library, use our data
          if (libraryItem.book.is_manual || libraryItem.user_id) {
              setBookData(libraryItem.book)
              if (libraryItem.user_id) {
                  setExistingInLibrary(libraryItem)
              }
              setIsLoading(false)
              return
          }
      }

      // 2. Fallback to Google Books API
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY
      const googleResponse = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}${apiKey ? `&key=${apiKey}` : ''}`)
      const data = await googleResponse.json()
      
      if (data.items && data.items.length > 0) {
        const item = data.items[0]
        const bookInfo = {
          ...item.volumeInfo,
          retailPrice: item.saleInfo?.retailPrice?.amount || item.saleInfo?.listPrice?.amount || null
        }
        setBookData(bookInfo)
      } else if (libraryItem && libraryItem.book) {
          // If Google fails but we have it in DB (even if not manual)
          setBookData(libraryItem.book)
      } else {
        console.warn("No book found for ISBN", isbn)
        setManualForm(prev => ({ ...prev, isbn: isbn }))
        setIsNotFoundOpen(true)
      }
    } catch (error) {
      console.error("Error fetching book:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToLibrary = async () => {
      setIsLoading(true)
      try {
          await addBookToLibrary(bookData, isPublic)
          // If we reach here without redirect, something went wrong
      } catch (error) {
          // Next.js redirects throw a NEXT_REDIRECT error, which is expected
          if (error.message?.includes('NEXT_REDIRECT')) {
              // This is a successful redirect, not an error
              return
          }
          console.error(error)
          alert("Failed to add book")
          setIsLoading(false)
      }
  }

  const handleReset = () => {
      setScannedResult(null)
      setBookData(null)
      setManualIsbn('')
      setExistingInLibrary(null)
      setIsLoading(false)
  }

  const handleManualSubmit = async (e) => {
      e.preventDefault()
      setIsLoading(true)
      try {
          await addBookToLibrary({
              ...manualForm,
              isManual: true
          }, isPublic)
      } catch (error) {
          if (error.message?.includes('NEXT_REDIRECT')) return
          console.error(error)
          alert("Failed to add manual book")
          setIsLoading(false)
      }
  }

  return (
    <div className="min-h-screen p-8 flex flex-col items-center gap-8">
        <h1 className="text-3xl font-bold">Scan a Book</h1>
        
        {!bookData && (
            <div className="w-full max-w-md space-y-8">
                <Card>
                    <CardContent className="pt-6">
                         <Html5Scanner 
                            onScanSuccess={handleScanSuccess} 
                            onScanFailure={handleScanFailure} 
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
                    />
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" /> : <Search className="w-4 h-4" />}
                    </Button>
                </form>
            </div>
        )}

        {bookData && (
            <Card className="w-full max-w-md animate-in slide-in-from-bottom-5">
                <CardHeader>
                    <CardTitle>{existingInLibrary ? "Book Already in Library" : "Book Found!"}</CardTitle>
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
                        {(bookData.description) && (
                            <p className="text-sm text-muted-foreground mt-3 px-4 line-clamp-3 leading-relaxed">
                                {bookData.description}
                            </p>
                        )}
                    </div>
                    
                    <div className="flex flex-col gap-3 w-full mt-4">
                        {!existingInLibrary && (
                            <div className="flex items-center space-x-2 px-4">
                                <input
                                    type="checkbox"
                                    id="isPublic"
                                    checked={isPublic}
                                    onChange={(e) => setIsPublic(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                <label htmlFor="isPublic" className="text-sm text-muted-foreground cursor-pointer">
                                    Make this book visible to others in my public library
                                </label>
                            </div>
                        )}
                        
                        {existingInLibrary ? (
                             <Button className="w-full" variant="secondary" onClick={() => router.push('/dashboard')}>
                                View in Library
                            </Button>
                        ) : (
                            <Button className="w-full" onClick={handleAddToLibrary} disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add to Library
                            </Button>
                        )}
                        <Button variant="outline" className="w-full" onClick={handleReset}>
                            {existingInLibrary ? "Scan Another" : "Cancel"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )}

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
    </div>
  )
}
