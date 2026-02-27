'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    })
    if (error) return { error: error.message }
    revalidatePath('/', 'layout')
    redirect('/dashboard')
  } catch (e: any) {
    return { error: 'Cannot connect to server. Please check your internet connection and try again.' }
  }
}

export async function register(formData: FormData) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signUp({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      options: {
        data: { full_name: formData.get('full_name') as string }
      }
    })
    if (error) return { error: error.message }
    revalidatePath('/', 'layout')
    redirect('/org-setup')
  } catch (e: any) {
    return { error: 'Cannot connect to server. Please check your internet connection and try again.' }
  }
}

export async function logout() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch {}
  redirect('/auth/login')
}