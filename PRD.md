# Product Requirement Document (PRD): Bookworm

## 1. Project Overview
Bookworm is a web-based application designed for book collectors to catalog their physical libraries, track the financial value of their collection, and connect with other readers with similar tastes.

## 2. Target Audience
- Serious book collectors and hobbyists.
- People looking to inventory their homes for insurance purposes.
- Readers seeking community based on niche library commonalities.

## 3. Tech Stack Recommendation
- **Frontend:** Next.js (App Router) with Tailwind CSS and ShadCN for UI components.
- **Backend:** Express.js (Node.js).
- **Database:** PostgreSQL (via Supabase or Prisma).
  - *Why:* Relational databases are perfect for mapping users to books. Supabase specifically offers built-in Auth and a "Vector" extension (pgvector) which is excellent for building the recommendation engine you described.
- **APIs:** Google Books API (Metadata), eBay/AbeBooks (Valuation), Lucide-React (Icons).

## 4. Functional Requirements

### 4.1 Authentication & User Profiles
- Users must be able to sign up via Email/Password or Social OAuth (Google).
- Each user has a private "Library" view.
- Profile settings to toggle "Discoverability" for the social recommendation feature.

### 4.2 Book Cataloging (The "Scanner")
- **Camera Integration:** Use a library like html5-qrcode or quagga2 to access the mobile/desktop camera.
- **Barcode Processing:** Scan ISBN barcodes and fetch data from Google Books API.
- **Manual Entry:** A fallback form for users to type in ISBN manually.
- **Verification Step:** A "Preview Card" showing the book cover and title with a Verify & Add button.

### 4.3 Library Management
- **Database Storage:** Store ISBN, Title, Author, Thumbnail, Genre, and Date Added.
- **Valuation Logic:** Integration with a 3rd-party marketplace API to display an "Estimated Value" based on the ISBN.
- **Personalization:** Ability to mark a book as "Read," "Currently Reading," or "Wishlist."

### 4.4 Recommendation Engine ("Book Club Buddies")
- **Logic:** An algorithm that calculates a "Similarity Score" between User A and User B.
- **Matching Criteria:** Overlap in specific titles AND percentage of shared genres (e.g., if both users have >20% "Cyberpunk Sci-Fi").
- **Interaction:** A "Discover" tab showing recommended buddies and the option to "Wave" or "Message."

## 5. User Flow

### Phase 1: The "Hook" (Guest Experience)
1. User lands on the homepage.
2. User clicks "Scan a Book" (No login required yet).
3. Camera opens → Barcode scanned → Google Books API returns "The Great Gatsby."
4. Call to Action: "Want to save this to your digital library? [Sign Up Now]"

### Phase 2: The "Library" (Authenticated Experience)
1. User logs in.
2. Dashboard: Shows total book count and total estimated library value.
3. Add Book: Persistent FAB (Floating Action Button) for scanning or manual entry.
4. Social: "Buddies" tab shows users with similar libraries.

## 6. Data Schema (Simplified)

| Table | Fields |
| :--- | :--- |
| **Users** | `id`, `email`, `username`, `bio`, `is_public` |
| **Books** | `id`, `isbn`, `title`, `author`, `genre`, `image_url` |
| **User_Library** | `user_id`, `book_id`, `condition`, `purchase_price`, `book_value`, `book_condition`, `read_status`, `user_book_importance`, `added_at` |

## 7. Other features
- **Bulk Import:** Allow users to upload a CSV of ISBNs to their library.
- **Library Export:** Allow users to down a CSV file of their book library.
- **User Marketplace Exchange:** Enable users to buy and sell books from their library and set flags for books that they are willing to part with.
