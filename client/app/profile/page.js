'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { User, LogOut } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [supabase, router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
      return <div className="p-8 flex justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen p-8 flex flex-col items-center gap-8">
      <h1 className="text-3xl font-bold">Profile</h1>
      
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
            </div>
            <div>
                <CardTitle>User Account</CardTitle>
                <CardDescription>{user?.email}</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="space-y-4">
             <div className="text-sm text-muted-foreground">
                <p>User ID: {user?.id}</p>
                <p>Last Sign In: {new Date(user?.last_sign_in_at).toLocaleDateString()}</p>
             </div>

             <Button variant="destructive" className="w-full" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
             </Button>
        </CardContent>
      </Card>
    </div>
  )
}
