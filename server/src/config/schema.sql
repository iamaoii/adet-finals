-- =========================================================
-- AI-Powered Invoice Processing System
-- Database Schema (PostgreSQL / Supabase / Neon)
-- =========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'user' CHECK (role IN ('admin','user')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Invoices ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  invoice_number  VARCHAR(100),
  supplier_name   VARCHAR(200),
  invoice_date    DATE,
  due_date        DATE,
  total_amount    NUMERIC(14,2),
  currency        CHAR(3)       NOT NULL DEFAULT 'PHP',
  category        VARCHAR(100)  NOT NULL DEFAULT 'General',
  status          VARCHAR(30)   NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','verified','paid','flagged')),
  file_url        TEXT,
  file_public_id  TEXT,                          -- Cloudinary public_id for deletion
  raw_ocr_text    TEXT,                          -- Full OCR output
  notes           TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Alerts / Anomalies ───────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id  UUID REFERENCES invoices(id) ON DELETE CASCADE,
  type        VARCHAR(50) NOT NULL
              CHECK (type IN ('duplicate','high_value','missing_field','other')),
  message     TEXT        NOT NULL,
  resolved    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_invoices_user_id      ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_supplier     ON invoices(supplier_name);
CREATE INDEX IF NOT EXISTS idx_invoices_date         ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status       ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_alerts_invoice_id     ON alerts(invoice_id);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved       ON alerts(resolved);

-- ── Auto-update updated_at trigger ───────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at    ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_invoices_updated_at ON invoices;
CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
