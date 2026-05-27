# AI-Powered Invoice Processing and Analytics System

> ADET Finals Project — Zero-cost prototype using free-tier technologies.

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | React + Vite + Tailwind CSS + Recharts |
| Backend     | Node.js + Express.js                |
| OCR         | Tesseract OCR + pdf-parse           |
| Database    | PostgreSQL via Supabase / Neon      |
| File Storage| Cloudinary (free tier)              |
| Auth        | JWT (jsonwebtoken + bcryptjs)       |

---

## Project Structure

```
adet-finals/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/   # Sidebar, ProtectedLayout
│   │   ├── context/      # AuthContext
│   │   ├── lib/          # axios API client
│   │   └── pages/        # All page components
│   └── .env              # VITE_API_URL
│
└── server/          # Express backend
    ├── src/
    │   ├── config/       # db.js, cloudinary.js, schema.sql
    │   ├── controllers/  # auth, invoice, analytics, alerts
    │   ├── middleware/    # auth, error, upload
    │   └── routes/       # all route files
    └── .env              # server env vars
```

---

## Quick Start

### 1. Clone / open the project

### 2. Set up services (all free)
- **Supabase**: https://supabase.com — create a project, copy the `DATABASE_URL`
- **Cloudinary**: https://cloudinary.com — copy cloud name, API key, and secret
- **Install Tesseract OCR** locally: https://github.com/UB-Mannheim/tesseract/wiki

### 3. Configure environment variables

**Server** — copy `.env.example` → `.env` and fill in:
```
PORT=5000
JWT_SECRET=your_secret_here
DATABASE_URL=postgresql://...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLIENT_URL=http://localhost:5173
```

**Client** — already configured in `.env`:
```
VITE_API_URL=http://localhost:5000/api
```

### 4. Initialize the database

Run the SQL from `server/src/config/schema.sql` in your Supabase SQL editor.

### 5. Install dependencies

```bash
# Client
cd client && npm install

# Server
cd server && npm install
```

### 6. Run the development servers

```bash
# In /server
npm run dev

# In /client
npm run dev
```

- Frontend: http://localhost:5173
- Backend:  http://localhost:5000

---

## Pages

| Page            | Route                      |
|-----------------|----------------------------|
| Login           | `/login`                   |
| Register        | `/register`                |
| Dashboard       | `/dashboard`               |
| Upload Invoice  | `/upload`                  |
| OCR Review      | `/invoices/:id/review`     |
| Invoice List    | `/invoices`                |
| Invoice Detail  | `/invoices/:id`            |
| Analytics       | `/analytics`               |
| Alerts          | `/alerts`                  |
| Settings        | `/settings`                |

---

## API Endpoints

### Auth
| Method | Route              | Description         |
|--------|--------------------|---------------------|
| POST   | /api/auth/register | Register user       |
| POST   | /api/auth/login    | Login               |
| GET    | /api/auth/me       | Get current user    |

### Invoices
| Method | Route                     | Description              |
|--------|---------------------------|--------------------------|
| POST   | /api/invoices             | Upload + OCR             |
| GET    | /api/invoices             | List (search, filter)    |
| GET    | /api/invoices/:id         | Get one                  |
| PATCH  | /api/invoices/:id         | Update                   |
| DELETE | /api/invoices/:id         | Delete                   |
| POST   | /api/invoices/:id/confirm | Confirm OCR data         |

### Analytics
| Method | Route                       | Description           |
|--------|-----------------------------|-----------------------|
| GET    | /api/analytics/summary      | KPI totals            |
| GET    | /api/analytics/monthly      | Monthly trend         |
| GET    | /api/analytics/by-supplier  | Supplier breakdown    |
| GET    | /api/analytics/by-status    | Status distribution   |

### Alerts
| Method | Route                    | Description          |
|--------|--------------------------|----------------------|
| GET    | /api/alerts              | List anomaly alerts  |
| PATCH  | /api/alerts/:id/resolve  | Mark resolved        |

---

## Cost: ₱0 / $0 (Prototype)
All tools used are free-tier or open-source.