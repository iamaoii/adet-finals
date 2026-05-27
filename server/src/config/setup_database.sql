-- ============================================================
--  InvoiceIQ — Master Database Setup & Seeding Script
--  Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
--  This script will WIPE existing tables and recreate them fresh!
-- ============================================================

-- ── 1. Clean Slate (Drop existing tables with CASCADE) ──────────────────────

DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 2. Create Tables ────────────────────────────────────────────────────────

-- Users Table
CREATE TABLE users (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name               VARCHAR(120) NOT NULL,
  email              VARCHAR(255) UNIQUE NOT NULL,
  password_hash      VARCHAR(255) NOT NULL,
  role               VARCHAR(20)  NOT NULL DEFAULT 'user' CHECK (role IN ('admin','user')),
  is_verified        BOOLEAN      DEFAULT FALSE,
  verification_token VARCHAR(6),
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Invoices Table
CREATE TABLE invoices (
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
                  CHECK (status IN ('pending','verified','paid','flagged','duplicate')),
  file_url        TEXT,
  file_public_id  TEXT,
  raw_ocr_text    TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Alerts / Anomalies Table
CREATE TABLE alerts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id  UUID REFERENCES invoices(id) ON DELETE CASCADE,
  type        VARCHAR(50) NOT NULL
              CHECK (type IN ('duplicate','high_value','missing_field','other')),
  risk        VARCHAR(10)  DEFAULT 'medium',
  type_label  VARCHAR(100),
  message     TEXT        NOT NULL,
  description TEXT,
  similarity  NUMERIC(5,2),
  resolved    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (invoice_id, type)
);

-- ── 3. Create Indexes & Triggers ───────────────────────────────────────────

CREATE INDEX idx_invoices_user_id      ON invoices(user_id);
CREATE INDEX idx_invoices_supplier     ON invoices(supplier_name);
CREATE INDEX idx_invoices_date         ON invoices(invoice_date);
CREATE INDEX idx_invoices_status       ON invoices(status);
CREATE INDEX idx_alerts_invoice_id     ON alerts(invoice_id);
CREATE INDEX idx_alerts_resolved       ON alerts(resolved);

-- Auto-update updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 4. Seed Users ────────────────────────────────────────────────────────────
-- bcrypt hash of "password"

INSERT INTO users (name, email, password_hash, role, is_verified)
VALUES
  ('Test User',      'test@invoiceiq.com',  '$2a$12$Vk4e5dyu/GpjI.lnKqC.8eFORcFIx6zXpSNN3p4nu8mBHlZZmElom', 'admin', TRUE),
  ('Maria Santos',   'maria@invoiceiq.com', '$2a$12$Vk4e5dyu/GpjI.lnKqC.8eFORcFIx6zXpSNN3p4nu8mBHlZZmElom', 'user',  TRUE),
  ('Juan Dela Cruz', 'juan@invoiceiq.com',  '$2a$12$Vk4e5dyu/GpjI.lnKqC.8eFORcFIx6zXpSNN3p4nu8mBHlZZmElom', 'user',  TRUE);

-- ── 5. Seed Invoices & Alerts (PL/pgSQL block for UUID scoping) ──────────────

DO $$
DECLARE
  maria_id UUID;
  juan_id  UUID;
  inv1_id  UUID;
  inv2_id  UUID;
  inv3_id  UUID;
BEGIN
  -- Fetch user IDs
  SELECT id INTO maria_id FROM users WHERE email = 'maria@invoiceiq.com' LIMIT 1;
  SELECT id INTO juan_id  FROM users WHERE email = 'juan@invoiceiq.com' LIMIT 1;

  -- Seed Invoices for Maria Santos (User 1)
  INSERT INTO invoices
    (user_id, supplier_name, invoice_number, invoice_date, due_date,
     total_amount, category, status, file_url, raw_ocr_text, created_at)
  VALUES
    -- Maria's DBTK Supplies Co. (Supplies)
    (maria_id,'DBTK Supplies Co.','INV-2026-001','2026-01-10','2026-01-30', 21000.00,'Supplies','paid','https://res.cloudinary.com/demo/image/upload/sample.jpg','INVOICE #INV-2026-001','2026-01-10 08:00:00'),
    -- INV-2026-089 is a duplicate of INV-2026-109: same supplier, same amount, same date
    (maria_id,'DBTK Supplies Co.','INV-2026-089','2026-05-10','2026-05-30', 34500.00,'Supplies','duplicate','https://res.cloudinary.com/demo/image/upload/sample.jpg','INVOICE #INV-2026-089','2026-05-11 08:00:00'),
    (maria_id,'DBTK Supplies Co.','INV-2026-109','2026-05-10','2026-05-30', 34500.00,'Supplies','verified','https://res.cloudinary.com/demo/image/upload/sample.jpg','INVOICE #INV-2026-109','2026-05-10 09:00:00'),

    -- Maria's TechServ Corporation (Services)
    (maria_id,'TechServ Corporation','INV-2026-002','2026-01-15','2026-02-04', 42000.00,'Services','paid','https://res.cloudinary.com/demo/image/upload/sample.jpg','INVOICE #INV-2026-002','2026-01-15 09:00:00'),
    (maria_id,'TechServ Corporation','INV-2026-108','2026-05-12','2026-05-27', 98500.00,'Services','flagged','https://res.cloudinary.com/demo/image/upload/sample.jpg','INVOICE #INV-2026-108','2026-05-12 11:00:00'),

    -- Maria's Manila Office Goods (Equipment)
    (maria_id,'Manila Office Goods','INV-2026-012','2026-02-05','2026-02-25', 35000.00,'Equipment','paid','https://res.cloudinary.com/demo/image/upload/sample.jpg','INVOICE #INV-2026-012','2026-02-05 10:00:00'),
    (maria_id,'Manila Office Goods','INV-2026-033','2026-03-18','2026-04-07', 84000.00,'Equipment','paid','https://res.cloudinary.com/demo/image/upload/sample.jpg','INVOICE #INV-2026-033','2026-03-18 08:30:00'),

    -- Maria's PhilStar Utilities (Utilities)
    (maria_id,'PhilStar Utilities','INV-2026-013','2026-02-24','2026-03-16', 28500.00,'Utilities','paid','https://res.cloudinary.com/demo/image/upload/sample.jpg','INVOICE #INV-2026-013','2026-02-24 07:00:00'),
    -- INV-2026-101 has no invoice_date — seeds the missing_field alert
    (maria_id,'PhilStar Utilities','INV-2026-101',NULL,'2026-06-03', 28500.00,'Utilities','pending','https://res.cloudinary.com/demo/image/upload/sample.jpg','INVOICE #INV-2026-101','2026-05-24 07:00:00'),

    -- Maria's Global Print Solutions (Supplies)
    (maria_id,'Global Print Solutions','INV-2026-055','2026-03-05','2026-03-25', 78500.00,'Supplies','paid','https://res.cloudinary.com/demo/image/upload/sample.jpg','INVOICE #INV-2026-055','2026-03-05 14:00:00');

  -- Seed Invoices for Juan Dela Cruz (User 2)
  INSERT INTO invoices
    (user_id, supplier_name, invoice_number, invoice_date, due_date,
     total_amount, category, status, file_url, raw_ocr_text, created_at)
  VALUES
    -- Juan's DBTK Supplies Co. (Supplies)
    (juan_id,'DBTK Supplies Co.','INV-2026-045','2026-04-15','2026-05-05', 52800.00,'Supplies','paid','https://res.cloudinary.com/demo/image/upload/sample.jpg','INVOICE #INV-2026-045','2026-04-15 10:00:00'),

    -- Juan's TechServ Corporation (Services)
    (juan_id,'TechServ Corporation','INV-2026-072','2026-04-20','2026-05-10', 75000.00,'Services','paid','https://res.cloudinary.com/demo/image/upload/sample.jpg','INVOICE #INV-2026-072','2026-04-20 12:00:00'),

    -- Juan's Manila Office Goods (Equipment)
    (juan_id,'Manila Office Goods','INV-2026-021','2026-02-25','2026-03-17',168000.00,'Equipment','paid','https://res.cloudinary.com/demo/image/upload/sample.jpg','INVOICE #INV-2026-021','2026-02-25 09:30:00'),
    (juan_id,'Manila Office Goods','INV-2026-115','2026-05-22','2026-06-11', 21000.00,'Equipment','pending','https://res.cloudinary.com/demo/image/upload/sample.jpg','INVOICE #INV-2026-115','2026-05-22 08:00:00'),

    -- Juan's PhilStar Utilities (Utilities)
    (juan_id,'PhilStar Utilities','INV-2026-088','2026-04-24','2026-05-14', 28500.00,'Utilities','paid','https://res.cloudinary.com/demo/image/upload/sample.jpg','INVOICE #INV-2026-088','2026-04-24 07:00:00'),

    -- Juan's Kween Corp (Services)
    (juan_id,'Kween Corp','INV-2026-028','2026-03-12','2026-04-01', 84000.00,'Services','paid','https://res.cloudinary.com/demo/image/upload/sample.jpg','INVOICE #INV-2026-028','2026-03-12 11:00:00'),
    (juan_id,'Kween Corp','INV-2026-077','2026-04-30','2026-05-20',126000.00,'Services','verified','https://res.cloudinary.com/demo/image/upload/sample.jpg','INVOICE #INV-2026-077','2026-04-30 13:00:00'),

    -- Juan's Global Print Solutions (Supplies)
    (juan_id,'Global Print Solutions','INV-2026-118','2026-05-25','2026-06-14', 15750.00,'Supplies','pending','https://res.cloudinary.com/demo/image/upload/sample.jpg','INVOICE #INV-2026-118','2026-05-25 10:00:00');

  -- Seed Alerts (Scope them to Maria's invoices)
  SELECT id INTO inv1_id FROM invoices WHERE invoice_number = 'INV-2026-089' LIMIT 1;
  SELECT id INTO inv2_id FROM invoices WHERE invoice_number = 'INV-2026-108' LIMIT 1;
  SELECT id INTO inv3_id FROM invoices WHERE invoice_number = 'INV-2026-101' LIMIT 1;

  IF inv1_id IS NOT NULL THEN
    INSERT INTO alerts (invoice_id, type, risk, type_label, message, description, similarity, resolved)
    VALUES
      -- Duplicate Invoice (Maria)
      (inv1_id, 'duplicate',     'high',
       'Duplicate Invoice — High Risk',
       'INV-2026-089 is a duplicate of INV-2026-109',
       'Both invoices are from DBTK Supplies Co. for exactly ₱34,500 dated May 10, 2026. INV-2026-089 was uploaded the following day — possible duplicate payment risk.',
       99.4, FALSE),
      -- High Amount (Maria)
      (inv2_id, 'high_value',    'medium',
       'High Amount — Medium Risk',
       'INV-2026-108 exceeds the ₱75,000 threshold by 31%',
       'Invoice from TechServ Corporation totaling ₱98,500 is 31.3% above the configured alert threshold. Management approval may be required.',
       NULL, FALSE),
      -- Missing Field (Maria)
      (inv3_id, 'missing_field', 'low',
       'Missing Field — Low Risk',
       'Invoice date could not be extracted from receipt',
       'OCR extraction from Manila Goods Trading (receipt_manila_may26.jpg) returned 61% confidence. Invoice date field is blank.',
       NULL, FALSE);
  END IF;

END $$;

-- ── 6. Verify Seeding ────────────────────────────────────────────────────────
SELECT 'users'    AS table_name, COUNT(*) AS row_count FROM users;
SELECT 'invoices' AS table_name, COUNT(*) AS row_count FROM invoices;
SELECT 'alerts'   AS table_name, COUNT(*) AS row_count FROM alerts;

-- Show split of invoices by user
SELECT u.name, u.email, u.role, COUNT(i.id) AS invoices_count
FROM users u
LEFT JOIN invoices i ON i.user_id = u.id
GROUP BY u.name, u.email, u.role;
