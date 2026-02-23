'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export function LogoutButton({ variant = "ghost", className, ...props }) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <Button variant={variant} onClick={handleSignOut} className={className} {...props}>
      <LogOut className="mr-2 h-4 w-4" />
      <span>Sign Out</span>
    </Button>
  )
}
