'use client'

import { Button } from '@/components/ui/button'

export default function ErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
        <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
        <p className="mb-4">Sorry, there was an error with your authentication request.</p>
        <Button onClick={() => window.location.href = '/login'}>Try Again</Button>
    </div>
  )
}
