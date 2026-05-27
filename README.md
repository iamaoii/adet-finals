# InvoiceIQ — AI-Powered Invoice Processing & Analytics System

> **InvoiceIQ** is a premium, AI-powered financial management system designed to automate invoice processing, extract structured data from receipts, verify financial accuracy, and track live analytics trends. 
> 
> *Built as an advanced **ADET Finals Project** using zero-cost, enterprise-grade open-source and free-tier cloud architectures.*

---

## 🎨 Premium App Features

*   📷 **AI-Powered OCR Extraction:** Upload raw invoice/receipt images and PDFs; the **Tesseract OCR** and **PDF-Parse** engine extracts items, suppliers, totals, tax details, and dates automatically in under 2 seconds.
*   📊 **Dynamic MoM Analytics:** Interactive charts powered by **Recharts** displaying spending trends, supplier distributions, and category breakdowns. KPI cards calculate dynamic **Month-over-Month (MoM) growth rates** based on active database date tracking.
*   ✉️ **SMTP Authentication & Verification:** Fully functional registration, instant password encryption (bcrypt), and transactional email activation using **Nodemailer SMTP** (e.g., Gmail App Passwords) with high-definition custom HTML mailers.
*   ⚠️ **Intelligent Anomaly Detection:** Instantly flags high-risk duplications (matching prices and supplier uploads), out-of-bounds expenses (above limits), and missing fields (like missing OCR invoice dates).
*   💳 **Secure Payment Lifecycle:** Strict backend validation toggling invoice status securely through protected route controls (`verified` ⇄ `paid`) to ensure zero tamper risk.
*   🔔 **Toast Notifications:** Real-time feedback alerts using **React Hot Toast** repositioned cleanly in the lower-right corner of the website for optimal, distraction-free user experience.

---

## 💻 Tech Stack

| Layer | Technology | Key Capabilities |
| :--- | :--- | :--- |
| **Frontend** | React (Vite) + Tailwind CSS + Lucide | Fast SPAs, modern interactive components, beautiful glassmorphism |
| **Backend** | Node.js + Express.js | Structured REST API, asynchronous route handling, modular architecture |
| **Database** | Supabase (PostgreSQL) | Fully relational storage, optimized indexing, secure connection pooling |
| **OCR** | Tesseract OCR + PDF-Parse | OCR extraction from images (PNG/JPG) and vector/raster PDF receipts |
| **File Storage** | Cloudinary | Auto-configured asset CDN with secure Cloudinary file uploads |
| **Email Service**| Nodemailer SMTP | Transactional, secure HTML sign-up & key verification dispatchers |

---

## 📂 Project Architecture

```text
adet-finals/
├── client/                 # React SPA Frontend
│   ├── src/
│   │   ├── assets/         # High-Definition WebP assets & Favicons
│   │   ├── components/     # Reusable components (Sidebar, ProtectedLayout)
│   │   ├── context/        # Global context (AuthContext session manager)
│   │   ├── hooks/          # React Custom Hooks
│   │   ├── lib/            # Axios API config
│   │   └── pages/          # Pages (Dashboard, Upload, OcrReview, Alerts, Analytics)
│   └── .env                # React environmental configuration
│
└── server/                 # Express.js REST Backend
    ├── src/
    │   ├── config/         # Database pools, Cloudinary settings, SQL seeders
    │   ├── controllers/    # Controllers (Auth, Invoice, Analytics, Alerts)
    │   ├── middleware/     # Middleware (Auth token checker, upload, error handler)
    │   ├── routes/         # Express Router routes mapping endpoints
    │   └── utils/          # Nodemailer SMTP mailer utilities
    └── .env                # Server environmental keys
```

---

## 🚀 Local Development Setup

Follow these steps to run **InvoiceIQ** on your local machine:

### 1. Prerequisites
* **Node.js** (v18+ recommended)
* **PostgreSQL** or a free [Supabase Account](https://supabase.com)
* **Cloudinary** free developer account
* **Tesseract OCR** installed on your system:
  * *Windows:* Install via [UB-Mannheim Tesseract Installer](https://github.com/UB-Mannheim/tesseract/wiki) and make sure to add it to your System environment path (`C:\Program Files\Tesseract-OCR`).
  * *macOS:* Run `brew install tesseract`

### 2. Clone and Setup Environment Variables

Copy the `.env.example` configurations to local `.env` files:

#### 📁 Server Configuration (`server/.env`)
```env
PORT=5000
NODE_ENV=development

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Database Connection
DATABASE_URL=postgresql://postgres:password@your-database-url:5432/postgres

# Cloudinary Setup
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# CORS
CLIENT_URL=http://localhost:5173

# Nodemailer SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=YOUR_EMAIL_ADDRESS@gmail.com
SMTP_PASS=YOUR_16_DIGIT_GMAIL_APP_PASSWORD
```

#### 📁 Client Configuration (`client/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

---

### 3. Initialize & Seed the Database
1. Connect to your Supabase SQL Editor.
2. Paste the SQL script from `server/src/config/setup_database.sql` and run it.
3. This creates all tables, optimized database indexes, updated triggers, and seeds users, invoices, and anomalies with current **2026 timestamps** for accurate percentage growth calculations.

---

### 4. Install Dependencies & Run

```bash
# Install server dependencies
cd server
npm install

# Start backend using nodemon hot-reloads
npm run dev
```

In a new terminal window:
```bash
# Install client dependencies
cd client
npm install

# Start Vite frontend
npm run dev
```

* **Frontend URL:** [http://localhost:5173](http://localhost:5173)
* **Backend URL:** [http://localhost:5000](http://localhost:5000)

---

## 🗺️ Master API Route Map

### 🔐 Authentication (`/api/auth`)
| Method | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/register` | Create user with secure password hash & dispatch SMTP code |
| `POST` | `/verify` | Validate 6-digit key and activate user account |
| `POST` | `/resend-verification` | Generate new verification code and email to user |
| `POST` | `/login` | Authenticate user, returns 7-day signed JWT |
| `GET` | `/me` | Retrieve verified details of current user session |
| `PATCH`| `/me` | Update active user's profile details |
| `PATCH`| `/me/password` | Change user password (validates current password first) |

### 📑 Invoices & OCR Operations (`/api/invoices`)
| Method | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/` | Upload receipt image/PDF, run OCR, parse fields & flags |
| `POST` | `/:id/confirm` | Confirm/save extracted OCR fields after user review |
| `GET` | `/` | Query invoices (supports multi-term search, status, & user filter) |
| `GET` | `/:id` | Fetch detailed single invoice |
| `PATCH`| `/:id` | Update invoice info (strips status for security compliance) |
| `PATCH`| `/:id/payment` | Securely toggle status between `verified` and `paid` |
| `DELETE`| `/:id` | Delete invoice and clear linked anomalies |

### 📊 Analytics & Reporting (`/api/analytics`)
| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/summary` | Computes KPI totals and dynamic MoM growth rates |
| `GET` | `/monthly` | Outputs 6-month historical spending curves |
| `GET` | `/by-supplier` | Groups and ranks expenses by supplier |
| `GET` | `/by-status` | Computes status count distributions for charts |

### ⚠️ Anomaly Management (`/api/alerts`)
| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/` | List all active unreviewed anomalies |
| `PATCH`| `/:id/resolve` | Mark anomaly resolved |

---

## 🌐 Production Hosting (Free Tier)
To put this app live on the cloud, please refer to the step-by-step **[Production Hosting Guide](file:///C:/Users/AJ/.gemini/antigravity/brain/f2e64b37-aca7-413d-ae64-329ba4aaabc6/hosting_guide.md)** created inside your conversation directory. It uses **Render** for backend API processes, **Vercel** for frontend deployment, and preserves your **Supabase** cloud database instance.