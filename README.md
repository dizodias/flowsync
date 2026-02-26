# ⚡ FlowSync

![FlowSync Banner](https://github.com/user-attachments/assets/a86c1743-8032-429a-858a-4759fd2378b4)

> A high-performance, modern CRM built for speed, fluid interactions, and global scalability. 

[![Live Demo](https://img.shields.io/badge/Live_Demo-flowsync.vercel.app-0866FF?style=for-the-badge)](https://flowsync.vercel.app)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)

**FlowSync** is an open-source Lead Management platform that brings the aesthetic and fluid UX of modern 2024+ social media platforms into the B2B SaaS space. It features a fully interactive Drag-and-Drop Kanban board, advanced data synchronization, and enterprise-grade security.

## ✨ Key Features

* **Fluid Kanban Engine:** Built with `@hello-pangea/dnd`, featuring **Optimistic UI updates** for 60fps drag-and-drop interactions that feel instantaneous.
* **Advanced Notes System (WhatsApp-Style):** A robust timeline for lead interactions supporting full CRUD, inline editing with history tooltips `(edited)`, and soft-deletions.
* **Smart Internationalization (i18n):** Fully localized in English, Portuguese (BR), Spanish, and German using `react-i18next`. Dates and times are formatted natively based on the user's locale.
* **Intelligent Phone Formatting:** Integrates `react-phone-number-input` to automatically parse international numbers and render high-quality SVG country flags seamlessly.
* **Product-Led Growth (PLG) Landing Page:** Features a fully interactive, localized dummy Kanban board on the unauthenticated landing page to reduce user friction and showcase core value immediately.
* **Modern UI/UX Architecture:** Designed with a "Modern Clean" aesthetic: pure white floating cards, highly rounded corners (`rounded-2xl`), subtle shadows, and native Dark/Light mode support.

## 🏗️ Architecture & Tech Stack

### Frontend
* **Framework:** React 18 + TypeScript + Vite
* **Styling:** Tailwind CSS v4 (Class-based dark mode, custom CSS theme variables)
* **Routing:** React Router v6 (with Protected Routes)
* **State Management:** React Hooks + Optimistic UI patterns for real-time feel
* **Icons:** Lucide React

### Backend (Supabase)
* **Database:** PostgreSQL
* **Authentication:** Supabase Auth (Email/Password)
* **Security:** Strict Row Level Security (RLS) policies ensuring users can only access and mutate their own leads and notes.

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites
* Node.js (v18 or higher)
* npm or yarn
* A free [Supabase](https://supabase.com/) account

### Installation

**Clone the repository:**
```
git clone [https://github.com/dizodias/flowsync.git](https://github.com/dizodias/flowsync.git)
cd flowsync
```

Install dependencies:
```
npm install
```

**Set up environment variables:**
Create a .env file in the root directory and add your Supabase credentials:
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
**Database Setup:**
Run the following SQL script in your Supabase SQL Editor to provision the tables and RLS policies:
```bash
-- Core Tables
CREATE TABLE columns (id text PRIMARY KEY, title text NOT NULL, color text NOT NULL, order_index integer NOT NULL DEFAULT 0);
CREATE TABLE leads (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, title text NOT NULL, contact_name text NOT NULL, whatsapp text, column_id text REFERENCES columns(id), order_index integer NOT NULL DEFAULT 0, created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL, user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid());
CREATE TABLE notes (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, lead_id uuid REFERENCES leads(id) ON DELETE CASCADE, content text NOT NULL, created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL, is_deleted BOOLEAN DEFAULT FALSE, is_edited BOOLEAN DEFAULT FALSE, original_content TEXT);

-- Initial Data
INSERT INTO columns (id, title, color, order_index) VALUES ('col-new', 'New', '#0866FF', 1), ('col-progress', 'In Progress', '#f59e0b', 2), ('col-won', 'Won', '#42b72a', 3);

-- Row Level Security (RLS)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Isolamento de Leads" ON leads FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Isolamento de Notas" ON notes FOR ALL USING (EXISTS (SELECT 1 FROM leads WHERE leads.id = notes.lead_id AND leads.user_id = auth.uid()));
```
**Run the development server:**
```bash
npm run dev
```
Open http://localhost:5173 to view it in the browser.

## 🛠️ Upcoming Features / Roadmap
• Integration with WhatsApp Cloud API for direct messaging.
<br>• Automated email triggers via Edge Functions.
<br>• Analytics Dashboard with conversion metrics.

## 📄 License
Distributed under the MIT License. See LICENSE for more information.

## 👨‍💻 Author
Created by: [dizodias](https://github.com/dizodias)
<br>Live Project: [FlowSync](https://flowsync.vercel.app)

##

Built with passion and 60fps animations. 2026.
