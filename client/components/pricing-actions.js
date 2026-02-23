'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateBookPricing(libraryItemId, retailValue, userSellPrice) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        throw new Error("Not authenticated")
    }

    const { error } = await supabase
        .from('user_library')
        .update({
            retail_value: retailValue ? parseFloat(retailValue) : null,
            user_sell_price: userSellPrice ? parseFloat(userSellPrice) : null,
        })
        .eq('id', libraryItemId)
        .eq('user_id', user.id)

    if (error) {
        console.error("Update Error:", error)
        throw new Error(`Failed to update pricing: ${error.message}`)
    }

    revalidatePath('/dashboard')
    return { success: true }
}
