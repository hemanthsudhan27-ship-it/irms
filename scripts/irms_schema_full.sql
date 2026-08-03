-- ============================================================
-- IRMS — Integrated Residency Management System
-- Production-Ready PostgreSQL Schema v1.0
-- Project: idqpehhbebggkoofxohe
-- Run in: Supabase SQL Editor
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── ENUM Types ───────────────────────────────────────────────
DO $$ BEGIN CREATE TYPE user_status        AS ENUM ('active','inactive','suspended','pending');                    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE resident_status    AS ENUM ('active','inactive','evicted','moved_out');                    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE unit_status        AS ENUM ('available','occupied','maintenance','reserved','inactive');   EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE complex_status     AS ENUM ('active','inactive','under_construction','archived');          EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE log_action         AS ENUM ('create','update','delete','login','logout','view','assign','unassign','restore'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE notice_status      AS ENUM ('draft','published','archived','scheduled');                   EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE maintenance_status AS ENUM ('open','in_progress','resolved','closed','cancelled');         EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE maintenance_priority AS ENUM ('low','medium','high','urgent');                             EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── TABLE: companies ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(255) NOT NULL,
  slug        VARCHAR(255) NOT NULL,
  logo_url    TEXT,
  address     TEXT,
  city        VARCHAR(100),
  state       VARCHAR(100),
  country     VARCHAR(100)  DEFAULT 'India',
  postal_code VARCHAR(20),
  phone       VARCHAR(30),
  email       VARCHAR(255),
  website     VARCHAR(255),
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  settings    JSONB        DEFAULT '{}'::JSONB,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ,
  CONSTRAINT companies_name_unique  UNIQUE (name),
  CONSTRAINT companies_slug_unique  UNIQUE (slug),
  CONSTRAINT companies_email_check  CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);
COMMENT ON TABLE  companies           IS 'Top-level SaaS tenant — one company owns many complexes';
COMMENT ON COLUMN companies.slug      IS 'URL-friendly unique identifier (lowercase, hyphens)';
COMMENT ON COLUMN companies.settings  IS 'Tenant config: timezone, currency, branding, etc.';
COMMENT ON COLUMN companies.deleted_at IS 'Soft delete — NULL = active record';

-- ── TABLE: roles ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           VARCHAR(100) NOT NULL,
  slug           VARCHAR(100) NOT NULL,
  description    TEXT,
  permissions    JSONB        DEFAULT '{}'::JSONB,
  is_system_role BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ,
  CONSTRAINT roles_name_unique UNIQUE (name),
  CONSTRAINT roles_slug_unique UNIQUE (slug)
);
COMMENT ON TABLE  roles               IS 'User roles with granular JSON permission sets';
COMMENT ON COLUMN roles.permissions   IS 'JSON: {"resource":{"create":bool,"read":bool,"update":bool,"delete":bool}}';
COMMENT ON COLUMN roles.is_system_role IS 'TRUE = cannot be deleted by users';

-- ── TABLE: complexes ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS complexes (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id   UUID        NOT NULL REFERENCES companies(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  name         VARCHAR(255) NOT NULL,
  slug         VARCHAR(255) NOT NULL,
  code         VARCHAR(50),
  address      TEXT,
  city         VARCHAR(100),
  state        VARCHAR(100),
  country      VARCHAR(100) DEFAULT 'India',
  postal_code  VARCHAR(20),
  phone        VARCHAR(30),
  email        VARCHAR(255),
  total_floors INTEGER      NOT NULL DEFAULT 0 CHECK (total_floors >= 0),
  total_units  INTEGER      NOT NULL DEFAULT 0 CHECK (total_units  >= 0),
  status       complex_status NOT NULL DEFAULT 'active',
  amenities    JSONB        DEFAULT '[]'::JSONB,
  settings     JSONB        DEFAULT '{}'::JSONB,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ,
  CONSTRAINT complexes_name_per_company UNIQUE (company_id, name),
  CONSTRAINT complexes_slug_unique      UNIQUE (slug),
  CONSTRAINT complexes_email_check      CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);
COMMENT ON TABLE  complexes      IS 'Apartment complexes belonging to companies';
COMMENT ON COLUMN complexes.code IS 'Short code used in display names, e.g. ALPHA, GAMMA';

-- ── TABLE: floors ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS floors (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  complex_id   UUID        NOT NULL REFERENCES complexes(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  floor_number INTEGER     NOT NULL CHECK (floor_number >= 0),
  floor_label  VARCHAR(50) NOT NULL,
  total_units  INTEGER     NOT NULL DEFAULT 0 CHECK (total_units >= 0),
  description  TEXT,
  is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ,
  CONSTRAINT floors_number_per_complex UNIQUE (complex_id, floor_number),
  CONSTRAINT floors_label_per_complex  UNIQUE (complex_id, floor_label)
);
COMMENT ON TABLE  floors             IS 'Floors within an apartment complex';
COMMENT ON COLUMN floors.floor_label IS 'Display label: A, B, C  |  Ground, First, etc.';

-- ── TABLE: apartment_units ───────────────────────────────────
-- Display name is generated dynamically:
--   complex.name + '-' + floor.floor_label + unit.unit_number
--   e.g.  Alpha-A1  |  Gamma-C3  |  Beta-B4
CREATE TABLE IF NOT EXISTS apartment_units (
  id              UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  floor_id        UUID           NOT NULL REFERENCES floors(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  unit_number     VARCHAR(50)    NOT NULL,
  capacity        INTEGER        NOT NULL DEFAULT 1  CHECK (capacity >= 1),
  occupancy_count INTEGER        NOT NULL DEFAULT 0  CHECK (occupancy_count >= 0),
  status          unit_status    NOT NULL DEFAULT 'available',
  unit_type       VARCHAR(100),
  area_sqft       DECIMAL(10,2),
  rent_amount     DECIMAL(12,2),
  deposit_amount  DECIMAL(12,2),
  description     TEXT,
  amenities       JSONB          DEFAULT '[]'::JSONB,
  metadata        JSONB          DEFAULT '{}'::JSONB,
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  CONSTRAINT units_number_per_floor  UNIQUE (floor_id, unit_number),
  CONSTRAINT units_occupancy_cap     CHECK  (occupancy_count <= capacity)
);
COMMENT ON TABLE  apartment_units                IS 'Units — display_name = ComplexName-FloorLabel+UnitNumber (e.g. Alpha-A1)';
COMMENT ON COLUMN apartment_units.unit_number    IS 'Number within floor only; full display name computed in view';
COMMENT ON COLUMN apartment_units.occupancy_count IS 'Auto-maintained by trigger trg_sync_occupancy';
COMMENT ON COLUMN apartment_units.metadata       IS 'Extensible JSON for parking, utilities, future features';

-- ── TABLE: users ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id     UUID         REFERENCES companies(id)  ON DELETE SET NULL ON UPDATE CASCADE,
  role_id        UUID         NOT NULL REFERENCES roles(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  complex_id     UUID         REFERENCES complexes(id)  ON DELETE SET NULL ON UPDATE CASCADE,
  resident_id    UUID,        -- FK added after residents table
  full_name      VARCHAR(255) NOT NULL,
  email          VARCHAR(255) NOT NULL,
  phone          VARCHAR(30),
  password_hash  TEXT         NOT NULL,
  avatar_url     TEXT,
  status         user_status  NOT NULL DEFAULT 'pending',
  last_login     TIMESTAMPTZ,
  email_verified BOOLEAN      NOT NULL DEFAULT FALSE,
  phone_verified BOOLEAN      NOT NULL DEFAULT FALSE,
  preferences    JSONB        DEFAULT '{}'::JSONB,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ,
  CONSTRAINT users_email_unique UNIQUE (email),
  CONSTRAINT users_email_check  CHECK  (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);
COMMENT ON COLUMN users.complex_id    IS 'NULL for Super Admin; scopes Complex Admin to their complex';
COMMENT ON COLUMN users.password_hash IS 'bcrypt / Argon2id hash — NEVER store plaintext';
COMMENT ON COLUMN users.preferences   IS 'UI prefs: theme, notification settings, language, etc.';

-- ── TABLE: residents ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS residents (
  id                      UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id                 UUID            NOT NULL REFERENCES apartment_units(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  user_id                 UUID            REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  full_name               VARCHAR(255)    NOT NULL,
  email                   VARCHAR(255),
  phone                   VARCHAR(30)     NOT NULL,
  emergency_contact_name  VARCHAR(255),
  emergency_contact_phone VARCHAR(30),
  move_in_date            DATE            NOT NULL,
  move_out_date           DATE,
  status                  resident_status NOT NULL DEFAULT 'active',
  id_proof_type           VARCHAR(100),
  id_proof_number         VARCHAR(100),
  id_proof_url            TEXT,
  notes                   TEXT,
  metadata                JSONB           DEFAULT '{}'::JSONB,
  created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ,
  CONSTRAINT residents_email_check  CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT residents_dates_check  CHECK (move_out_date IS NULL OR move_out_date >= move_in_date)
);
COMMENT ON TABLE  residents         IS 'Residents living in apartment units';
COMMENT ON COLUMN residents.user_id IS 'Links to users when resident activates portal (future)';
COMMENT ON COLUMN residents.metadata IS 'Extensible JSON: vehicle info, pets, lease docs, etc.';

-- Add circular FK: users ↔ residents
DO $$ BEGIN
  ALTER TABLE users ADD CONSTRAINT fk_users_resident_id
    FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── TABLE: activity_logs ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  UUID        REFERENCES companies(id) ON DELETE SET NULL ON UPDATE CASCADE,
  complex_id  UUID        REFERENCES complexes(id) ON DELETE SET NULL ON UPDATE CASCADE,
  user_id     UUID        REFERENCES users(id)     ON DELETE SET NULL ON UPDATE CASCADE,
  action      log_action  NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id   UUID,
  description TEXT,
  old_values  JSONB,
  new_values  JSONB,
  ip_address  INET,
  user_agent  TEXT,
  metadata    JSONB       DEFAULT '{}'::JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- No updated_at / deleted_at — logs are IMMUTABLE
);
COMMENT ON TABLE  activity_logs           IS 'Immutable audit trail — no UPDATE/DELETE ever';
COMMENT ON COLUMN activity_logs.old_values IS 'Full JSON snapshot before change';
COMMENT ON COLUMN activity_logs.new_values IS 'Full JSON snapshot after change';

-- ── TABLE: future_notices ────────────────────────────────────
CREATE TABLE IF NOT EXISTS future_notices (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID          REFERENCES companies(id) ON DELETE SET NULL ON UPDATE CASCADE,
  complex_id      UUID          REFERENCES complexes(id) ON DELETE SET NULL ON UPDATE CASCADE,
  created_by      UUID          REFERENCES users(id)     ON DELETE SET NULL ON UPDATE CASCADE,
  title           VARCHAR(500)  NOT NULL,
  content         TEXT          NOT NULL,
  category        VARCHAR(100),
  status          notice_status NOT NULL DEFAULT 'draft',
  priority        INTEGER       NOT NULL DEFAULT 0,
  target_audience JSONB         DEFAULT '["all"]'::JSONB,
  scheduled_at    TIMESTAMPTZ,
  published_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  attachments     JSONB         DEFAULT '[]'::JSONB,
  metadata        JSONB         DEFAULT '{}'::JSONB,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  CONSTRAINT notices_expiry_check CHECK (expires_at IS NULL OR published_at IS NULL OR expires_at > published_at)
);
COMMENT ON TABLE  future_notices                IS 'Notice board — activate when Resident portal launches';
COMMENT ON COLUMN future_notices.target_audience IS 'JSON array: ["all"] | ["floor:<id>"] | ["unit:<id>"]';
COMMENT ON COLUMN future_notices.priority        IS 'Higher = shown first; ties broken by published_at';

-- ── TABLE: future_maintenance_requests ──────────────────────
CREATE TABLE IF NOT EXISTS future_maintenance_requests (
  id               UUID                 PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id       UUID                 REFERENCES companies(id)       ON DELETE SET NULL ON UPDATE CASCADE,
  complex_id       UUID                 REFERENCES complexes(id)       ON DELETE SET NULL ON UPDATE CASCADE,
  unit_id          UUID                 REFERENCES apartment_units(id) ON DELETE SET NULL ON UPDATE CASCADE,
  resident_id      UUID                 REFERENCES residents(id)       ON DELETE SET NULL ON UPDATE CASCADE,
  assigned_to      UUID                 REFERENCES users(id)           ON DELETE SET NULL ON UPDATE CASCADE,
  created_by       UUID                 REFERENCES users(id)           ON DELETE SET NULL ON UPDATE CASCADE,
  title            VARCHAR(500)         NOT NULL,
  description      TEXT                 NOT NULL,
  category         VARCHAR(100),
  status           maintenance_status   NOT NULL DEFAULT 'open',
  priority         maintenance_priority NOT NULL DEFAULT 'medium',
  scheduled_at     TIMESTAMPTZ,
  resolved_at      TIMESTAMPTZ,
  resolution_notes TEXT,
  attachments      JSONB                DEFAULT '[]'::JSONB,
  metadata         JSONB                DEFAULT '{}'::JSONB,
  created_at       TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);
COMMENT ON TABLE  future_maintenance_requests          IS 'Maintenance requests — activate when Resident portal launches';
COMMENT ON COLUMN future_maintenance_requests.category IS 'plumbing, electrical, carpentry, pest, other';

-- ── VIEW: apartment_units_display ───────────────────────────
-- Dynamic display name: Alpha-A1 | Gamma-C3 | Beta-B4
CREATE OR REPLACE VIEW apartment_units_display AS
SELECT
  au.id,
  au.floor_id,
  au.unit_number,
  au.capacity,
  au.occupancy_count,
  au.status,
  au.unit_type,
  au.area_sqft,
  au.rent_amount,
  au.deposit_amount,
  au.amenities,
  au.metadata,
  au.created_at,
  au.updated_at,
  au.deleted_at,
  f.floor_label,
  f.floor_number,
  cx.name   AS complex_name,
  cx.id     AS complex_id,
  co.name   AS company_name,
  co.id     AS company_id,
  -- e.g. Alpha-A1
  cx.name || '-' || f.floor_label || au.unit_number AS display_name
FROM apartment_units  au
JOIN floors           f  ON au.floor_id  = f.id
JOIN complexes        cx ON f.complex_id = cx.id
JOIN companies        co ON cx.company_id = co.id;
COMMENT ON VIEW apartment_units_display IS 'Use for UI lists only — includes computed display_name (e.g. Alpha-A1)';

-- ── Indexes ──────────────────────────────────────────────────
-- companies
CREATE INDEX IF NOT EXISTS idx_companies_slug        ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_is_active   ON companies(is_active);
CREATE INDEX IF NOT EXISTS idx_companies_deleted_at  ON companies(deleted_at) WHERE deleted_at IS NULL;
-- roles
CREATE INDEX IF NOT EXISTS idx_roles_slug            ON roles(slug);
CREATE INDEX IF NOT EXISTS idx_roles_is_system       ON roles(is_system_role);
CREATE INDEX IF NOT EXISTS idx_roles_deleted_at      ON roles(deleted_at) WHERE deleted_at IS NULL;
-- complexes
CREATE INDEX IF NOT EXISTS idx_complexes_company_id  ON complexes(company_id);
CREATE INDEX IF NOT EXISTS idx_complexes_slug        ON complexes(slug);
CREATE INDEX IF NOT EXISTS idx_complexes_status      ON complexes(status);
CREATE INDEX IF NOT EXISTS idx_complexes_deleted_at  ON complexes(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_complexes_co_status   ON complexes(company_id, status);
-- floors
CREATE INDEX IF NOT EXISTS idx_floors_complex_id     ON floors(complex_id);
CREATE INDEX IF NOT EXISTS idx_floors_is_active      ON floors(is_active);
CREATE INDEX IF NOT EXISTS idx_floors_deleted_at     ON floors(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_floors_co_floor_num   ON floors(complex_id, floor_number);
-- apartment_units
CREATE INDEX IF NOT EXISTS idx_units_floor_id        ON apartment_units(floor_id);
CREATE INDEX IF NOT EXISTS idx_units_status          ON apartment_units(status);
CREATE INDEX IF NOT EXISTS idx_units_deleted_at      ON apartment_units(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_units_floor_status    ON apartment_units(floor_id, status);
-- users
CREATE INDEX IF NOT EXISTS idx_users_email           ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id         ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_complex_id      ON users(complex_id);
CREATE INDEX IF NOT EXISTS idx_users_company_id      ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_status          ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at      ON users(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_resident_id     ON users(resident_id);
-- residents
CREATE INDEX IF NOT EXISTS idx_residents_unit_id     ON residents(unit_id);
CREATE INDEX IF NOT EXISTS idx_residents_user_id     ON residents(user_id);
CREATE INDEX IF NOT EXISTS idx_residents_status      ON residents(status);
CREATE INDEX IF NOT EXISTS idx_residents_deleted_at  ON residents(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_residents_move_in     ON residents(move_in_date);
CREATE INDEX IF NOT EXISTS idx_residents_unit_stat   ON residents(unit_id, status);
CREATE INDEX IF NOT EXISTS idx_residents_email       ON residents(email) WHERE email IS NOT NULL;
-- activity_logs (high write volume — selective)
CREATE INDEX IF NOT EXISTS idx_logs_user_id          ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_company_id       ON activity_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_logs_complex_id       ON activity_logs(complex_id);
CREATE INDEX IF NOT EXISTS idx_logs_action           ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_logs_entity_type      ON activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_logs_entity_id        ON activity_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_logs_created_at       ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_entity_lookup    ON activity_logs(entity_type, entity_id);
-- future_notices
CREATE INDEX IF NOT EXISTS idx_notices_company_id    ON future_notices(company_id);
CREATE INDEX IF NOT EXISTS idx_notices_complex_id    ON future_notices(complex_id);
CREATE INDEX IF NOT EXISTS idx_notices_status        ON future_notices(status);
CREATE INDEX IF NOT EXISTS idx_notices_deleted_at    ON future_notices(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notices_scheduled     ON future_notices(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notices_published     ON future_notices(published_at);
-- future_maintenance_requests
CREATE INDEX IF NOT EXISTS idx_maint_company_id      ON future_maintenance_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_maint_complex_id      ON future_maintenance_requests(complex_id);
CREATE INDEX IF NOT EXISTS idx_maint_unit_id         ON future_maintenance_requests(unit_id);
CREATE INDEX IF NOT EXISTS idx_maint_resident_id     ON future_maintenance_requests(resident_id);
CREATE INDEX IF NOT EXISTS idx_maint_assigned_to     ON future_maintenance_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_maint_status          ON future_maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_maint_priority        ON future_maintenance_requests(priority);
CREATE INDEX IF NOT EXISTS idx_maint_deleted_at      ON future_maintenance_requests(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_maint_stat_priority   ON future_maintenance_requests(status, priority);

-- ── TRIGGER FUNCTION: auto updated_at ───────────────────────
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'companies','roles','complexes','floors','apartment_units',
    'users','residents','future_notices','future_maintenance_requests'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_set_updated_at ON %I', t);
    EXECUTE format('CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at()', t);
  END LOOP;
END $$;

-- ── TRIGGER FUNCTION: sync unit occupancy_count ──────────────
CREATE OR REPLACE FUNCTION sync_unit_occupancy()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- INSERT active resident → increment
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE apartment_units
    SET occupancy_count = occupancy_count + 1, status = 'occupied'::unit_status
    WHERE id = NEW.unit_id;

  -- DELETE active resident → decrement
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
    UPDATE apartment_units
    SET occupancy_count = GREATEST(0, occupancy_count - 1),
        status = CASE WHEN GREATEST(0, occupancy_count - 1) = 0 THEN 'available'::unit_status ELSE 'occupied'::unit_status END
    WHERE id = OLD.unit_id;

  -- UPDATE status change or unit transfer
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'active' AND NEW.status != 'active' THEN
      UPDATE apartment_units
      SET occupancy_count = GREATEST(0, occupancy_count - 1),
          status = CASE WHEN GREATEST(0, occupancy_count - 1) = 0 THEN 'available'::unit_status ELSE 'occupied'::unit_status END
      WHERE id = NEW.unit_id;
    ELSIF OLD.status != 'active' AND NEW.status = 'active' THEN
      UPDATE apartment_units SET occupancy_count = occupancy_count + 1, status = 'occupied'::unit_status WHERE id = NEW.unit_id;
    END IF;
    -- Resident transfers to different unit
    IF OLD.unit_id != NEW.unit_id AND OLD.status = 'active' THEN
      UPDATE apartment_units
      SET occupancy_count = GREATEST(0, occupancy_count - 1),
          status = CASE WHEN GREATEST(0, occupancy_count - 1) = 0 THEN 'available'::unit_status ELSE 'occupied'::unit_status END
      WHERE id = OLD.unit_id;
      UPDATE apartment_units SET occupancy_count = occupancy_count + 1, status = 'occupied'::unit_status WHERE id = NEW.unit_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_occupancy ON residents;
CREATE TRIGGER trg_sync_occupancy
AFTER INSERT OR UPDATE OR DELETE ON residents
FOR EACH ROW EXECUTE FUNCTION sync_unit_occupancy();

-- ── SEED: 3 default system roles ─────────────────────────────
INSERT INTO roles (name, slug, description, permissions, is_system_role) VALUES
(
  'Super Admin', 'super_admin',
  'Full system access across all companies and complexes',
  '{"all":true,"companies":{"create":true,"read":true,"update":true,"delete":true},"complexes":{"create":true,"read":true,"update":true,"delete":true},"floors":{"create":true,"read":true,"update":true,"delete":true},"units":{"create":true,"read":true,"update":true,"delete":true},"residents":{"create":true,"read":true,"update":true,"delete":true},"users":{"create":true,"read":true,"update":true,"delete":true},"reports":{"read":true},"dashboard":{"read":true}}'::JSONB,
  TRUE
),
(
  'Complex Admin', 'complex_admin',
  'Manages a single assigned complex — residents and occupancy',
  '{"all":false,"complexes":{"create":false,"read":true,"update":true,"delete":false},"floors":{"create":false,"read":true,"update":false,"delete":false},"units":{"create":false,"read":true,"update":true,"delete":false},"residents":{"create":true,"read":true,"update":true,"delete":true},"reports":{"read":true},"dashboard":{"read":true}}'::JSONB,
  TRUE
),
(
  'Resident', 'resident',
  'Resident portal — view profile, apartment details, notices',
  '{"all":false,"profile":{"read":true,"update":true},"apartment":{"read":true},"notices":{"read":true},"maintenance":{"create":true,"read":true}}'::JSONB,
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

-- ── VERIFICATION QUERIES ─────────────────────────────────────
-- Run these after the schema to confirm everything is correct:

SELECT '=== TABLES ===' AS check_label;
SELECT table_name,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = t.table_name AND table_schema = 'public') AS col_count
FROM information_schema.tables t
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  AND table_name IN ('companies','roles','complexes','floors','apartment_units','users','residents','activity_logs','future_notices','future_maintenance_requests')
ORDER BY table_name;

SELECT '=== ROLES SEEDED ===' AS check_label;
SELECT name, slug, is_system_role FROM roles ORDER BY name;

SELECT '=== ENUMS ===' AS check_label;
SELECT t.typname, COUNT(e.enumlabel) AS value_count
FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
GROUP BY t.typname ORDER BY t.typname;

SELECT '=== INDEXES ===' AS check_label;
SELECT tablename, COUNT(*) AS index_count
FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
GROUP BY tablename ORDER BY tablename;

SELECT '=== TRIGGERS ===' AS check_label;
SELECT event_object_table, trigger_name FROM information_schema.triggers
WHERE trigger_schema = 'public' ORDER BY event_object_table;

SELECT '=== VIEW ===' AS check_label;
SELECT table_name, 'OK' AS status FROM information_schema.views
WHERE table_schema = 'public' AND table_name = 'apartment_units_display';
