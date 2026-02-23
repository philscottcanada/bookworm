'use client'

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BookOpen, ScanLine, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/logout-button"
import { createClient } from "@/utils/supabase/client"
import { useEffect, useState } from "react"

export function Navbar() {
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])
  
  // Hide navbar on login page.
  if (pathname === '/login') return null

  return (
    <nav className={cn(
      "fixed left-0 right-0 z-50 bg-background/80 backdrop-blur-lg md:top-0 md:bottom-auto md:border-b md:border-t-0",
      user ? "bottom-0 border-t md:top-0" : "top-0 border-b"
    )}>
      <div className="flex h-16 items-center justify-between px-4 md:px-8">
        <Link 
          href={user ? "/dashboard" : "/"} 
          className={cn(
            "flex items-center gap-2 font-bold text-xl",
            user && "hidden md:flex"
          )}
        >
          <BookOpen className="h-6 w-6 text-primary" />
          <span>Bookworm</span>
        </Link>
        
        <div className="flex gap-4 items-center">
            {user ? (
              <>
                <Link href="/dashboard" className="hidden md:block">
                    <Button variant={pathname === '/dashboard' ? "default" : "ghost"} className="gap-2">
                        <BookOpen className="h-5 w-5" />
                        <span>Library</span>
                    </Button>
                </Link>

                 <Link href="/scan" className="hidden md:block">
                    <Button variant={pathname === '/scan' ? "default" : "ghost"} className="gap-2">
                        <ScanLine className="h-5 w-5" />
                        <span>Scan</span>
                    </Button>
                </Link>

                 <Link href="/profile" className="hidden md:block">
                    <Button variant={pathname === '/profile' ? "default" : "ghost"} className="gap-2">
                        <User className="h-5 w-5" />
                        <span>Profile</span>
                    </Button>
                </Link>

                {/* Mobile Icons - Only if user is logged in, replaces the justify-between content */}
                <div className="flex md:hidden w-full justify-around items-center">
                  <Link href="/dashboard">
                      <Button variant={pathname === '/dashboard' ? "default" : "ghost"} size="icon">
                          <BookOpen className="h-5 w-5" />
                      </Button>
                  </Link>

                   <Link href="/scan">
                      <Button variant={pathname === '/scan' ? "default" : "ghost"} size="icon" className="rounded-full h-12 w-12 -mt-6 border-4 border-background shadow-lg bg-background">
                          <ScanLine className="h-6 w-6" />
                      </Button>
                   </Link>

                   <Link href="/profile">
                      <Button variant={pathname === '/profile' ? "default" : "ghost"} size="icon">
                          <User className="h-5 w-5" />
                      </Button>
                   </Link>
                </div>
                
                <LogoutButton className="hidden md:flex" />
              </>
            ) : (
              <Link href="/login">
                <Button variant="ghost">Login / Sign Up</Button>
              </Link>
            )}
        </div>
      </div>
    </nav>
  )
}
