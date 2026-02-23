'use client'

import { createClient } from "@/utils/supabase/client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { login, signup } from "./actions"
import { useState } from "react"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const supabase = createClient() // We need browser client for OAuth

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
    
    if (error) {
        console.error(error)
        setIsLoading(false)
    }
    // If no error, we are redirecting, so loading state stays true technically
  }

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const handleLogin = (e) => {
      setIsSignUp(false)
      // We don't prevent default here as the form submission handles it,
      // but we need to ensure the state is set before submit fires if possible.
      // Actually, standard submit button clicks fire submit event.
      // The issue is that `onSubmit` runs, but `isSignUp` state might not have updated yet if we rely solely on onClick.
      // A better approach is to handle the action directly in the onClick or pass a prop to onSubmit.
  }

  const handleSignupAndSubmit = form.handleSubmit((values) => {
      setIsSignUp(true)
      submitWithMode(values, true)
  })

  const handleLoginAndSubmit = form.handleSubmit((values) => {
      setIsSignUp(false)
      submitWithMode(values, false)
  })

  async function submitWithMode(values, isSignupMode) {
    setIsLoading(true)
    try {
      if (isSignupMode) {
        await signup(values)
      } else {
        await login(values)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="name@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="******" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col gap-2">
            <Button onClick={handleLoginAndSubmit} disabled={isLoading}>
            {isLoading && !isSignUp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Log In
            </Button>
            <Button variant="outline" onClick={handleSignupAndSubmit} disabled={isLoading}>
            {isLoading && isSignUp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign Up with Email
            </Button>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button variant="secondary" type="button" onClick={handleGoogleLogin} disabled={isLoading} className="w-full">
                {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                ) : (
                    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                        <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                    </svg>
                )}
                Google
            </Button>
        </div>
      </form>
    </Form>
  )
}
