# 📚 Bookworm

<p align="center">
  <img src="client/public/favicon.ico" width="80" alt="Bookworm Logo" />
</p>

<p align="center">
  <strong>Track your library, value your collection, and share your reading journey.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Supabase-Database-green?style=for-the-badge&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Tailwind-CSS-blue?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Radix_UI-Components-af4fef?style=for-the-badge&logo=radix-ui" alt="Radix UI" />
</p>

---

## ✨ Features

- 🔍 **Instant ISBN Scanning**: Use your camera to scan barcodes and instantly fetch book metadata via the Google Books API.
- 💰 **Value Tracking**: Automatically track the retail value of your collection and set your own sell prices.
- 📊 **Library Dashboard**: A sleek, high-end dashboard to manage your collection with grid and list views.
- ⭐ **Personal Ratings**: Rate your books with a 5-star system to track your favorites.
- 📝 **Detailed Metadata**: Track reading status (Read, Reading, etc.), book condition (New, Used, etc.), and public/private visibility.
- 📤 **CSV Export**: Export your entire library to CSV for external tracking or backups.
- 🔒 **Secure Auth**: Powered by Supabase for secure user authentication and data persistence.

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS.
- **UI Components**: Radix UI, Lucide Icons, Shadcn UI patterns.
- **Backend/DB**: Supabase (PostgreSQL, Auth, Storage).
- **APIs**: Google Books API for metadata retrieval.
- **Scanner**: `html5-qrcode` for advanced barcode processing.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A Supabase Project

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/philscottcanada/bookworm.git
   cd bookworm
   ```

2. **Setup the Client**:
   ```bash
   cd client
   npm install
   ```

3. **Environment Variables**:
   Create a `.env.local` file in the `client` directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY=your_google_cloud_api_key
   ```

4. **Database Setup**:
   Run the SQL scripts found in the `database/` folder in your Supabase SQL Editor to set up the necessary tables and triggers:
   - `schema.sql` (if available) or individual migration files.
   - Tables required: `books`, `user_library`, `profiles`.

5. **Run the development server**:
   ```bash
   npm run dev
   ```

## 📂 Project Structure

- `/client`: The Next.js frontend application.
- `/database`: SQL migration and setup files.
- `/server`: Backend service components.

## 🎨 Design Philosophy

Bookworm is designed with a **Dark Premium** aesthetic, utilizing vibrant accents, glassmorphism, and smooth transitions to provide a state-of-the-art user experience for book lovers.

---

<p align="center">
  Built with ❤️ by Phil Scott
</p>
