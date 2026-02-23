'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function checkBookInLibrary(isbn) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Find book by ISBN first
    const { data: book } = await supabase
        .from('books')
        .select('*')
        .eq('isbn', isbn)
        .single()

    if (!book) return null

    // Check if in user library
    const { data: libraryItem } = await supabase
        .from('user_library')
        .select(`
            *,
            book:books (*)
        `)
        .eq('user_id', user.id)
        .eq('book_id', book.id)
        .single()

    return libraryItem || { book: book }
}

export async function addBookToLibrary(bookData, isPublic = true) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // console.log("Debug Auth:", { user, authError })

    if (!user) {
        console.error("Auth Error in addBookToLibrary:", authError)
        throw new Error("Not authenticated")
    }

    // Ensure profile exists. If trigger failed or old user, we might miss a profile.
    const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single()
    if (!profile) {
        // Try to create it manually as fallback
        await supabase.from('profiles').insert({
            id: user.id,
            email: user.email,
            username: user.email.split('@')[0]
        })
    }

    // 1. Prepare book payload
    let bookPayload = {};
    const isManual = bookData.isManual || false;

    if (isManual) {
        bookPayload = {
            isbn: bookData.isbn || `MANUAL-${Date.now()}`,
            title: bookData.title,
            author: bookData.author || 'Unknown',
            genre: bookData.genre || null,
            image_url: bookData.image_url || null,
            publish_date: bookData.publish_date || null,
            description: bookData.description || null,
            is_manual: true
        }
    } else {
        // Mapping from Google Books API
        const isbn = bookData.industryIdentifiers?.find(i => i.type === 'ISBN_13')?.identifier 
                    || bookData.industryIdentifiers?.find(i => i.type === 'ISBN_10')?.identifier 
                    || 'UNKNOWN';

        const truncateDescription = (text) => {
            if (!text) return null;
            const words = text.split(' ');
            if (words.length <= 250) return text;
            return words.slice(0, 250).join(' ') + '...';
        };

        bookPayload = {
            isbn: isbn,
            title: bookData.title,
            author: bookData.authors ? bookData.authors[0] : 'Unknown',
            genre: bookData.categories ? bookData.categories[0] : null,
            image_url: bookData.imageLinks?.thumbnail?.replace('http:', 'https:'),
            publish_date: bookData.publishedDate || null,
            description: truncateDescription(bookData.description),
            is_manual: false
        }
    }

    // 1. Upsert into public.books
    const { data: bookRecord, error: bookError } = await supabase
        .from('books')
        .upsert(bookPayload, { onConflict: 'isbn' })
        .select()
        .single()

    if (bookError) {
        console.error("Book Upsert Error:", bookError)
        throw new Error(`Failed to process book: ${bookError.message}`)
    }

    const bookId = bookRecord.id;

    // 2. Insert into user_library
    const { error: libraryError } = await supabase
        .from('user_library')
        .insert({
            user_id: user.id,
            book_id: bookId,
            read_status: 'Not Read',
            is_public: isPublic,
            user_sell_price: isManual ? (bookData.user_sell_price || null) : null,
            user_importance: 3,
            condition: 'used',
        })
    
    if (libraryError) {
        // if unique constraint violation (already in library), maybe just return success?
        if (libraryError.code === '23505') {
            return { message: "Book already in library" }
        }
        console.error("Library Insert Error:", libraryError)
        throw new Error(`Failed to add to library: ${libraryError.message}`)
    }

    revalidatePath('/dashboard')
    redirect('/dashboard')
}

export async function deleteBookFromLibrary(bookId) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        throw new Error("Not authenticated")
    }

    const { error } = await supabase
        .from('user_library')
        .delete()
        .eq('user_id', user.id)
        .eq('book_id', bookId)

    if (error) {
        console.error("Delete Error:", error)
        throw new Error(`Failed to delete book: ${error.message}`)
    }

    revalidatePath('/dashboard')
}

export async function toggleBookPublicStatus(libraryItemId, isPublic) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error("Not authenticated")

    const { error } = await supabase
        .from('user_library')
        .update({ is_public: isPublic })
        .eq('id', libraryItemId)
        .eq('user_id', user.id)

    if (error) {
        console.error("Toggle Public Error:", error)
        throw new Error(`Failed to update public status: ${error.message}`)
    }

    revalidatePath('/dashboard')
    return { success: true }
}

export async function updateReadStatus(libraryItemId, status) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error("Not authenticated")

    const { error } = await supabase
        .from('user_library')
        .update({ read_status: status })
        .eq('id', libraryItemId)
        .eq('user_id', user.id)

    if (error) {
        console.error("Update Status Error:", error)
        throw new Error(`Failed to update status: ${error.message}`)
    }

    revalidatePath('/dashboard')
    return { success: true }
}

export async function updateImportance(libraryItemId, importance) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error("Not authenticated")

    const { error } = await supabase
        .from('user_library')
        .update({ user_importance: importance })
        .eq('id', libraryItemId)
        .eq('user_id', user.id)

    if (error) {
        console.error("Update Importance Error:", error)
        throw new Error(`Failed to update rating: ${error.message}`)
    }

    revalidatePath('/dashboard')
    return { success: true }
}

export async function updateBookCondition(libraryItemId, condition) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error("Not authenticated")

    const { error } = await supabase
        .from('user_library')
        .update({ condition: condition })
        .eq('id', libraryItemId)
        .eq('user_id', user.id)

    if (error) {
        console.error("Update Condition Error:", error)
        throw new Error(`Failed to update condition: ${error.message}`)
    }

    revalidatePath('/dashboard')
    return { success: true }
}




