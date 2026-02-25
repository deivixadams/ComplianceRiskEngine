-- MODEL GOVERNANCE & PARAMETER MANAGEMENT SCHEMA
-- Target Database: cre_db

-- 2.1 Tabla: security_users
CREATE TABLE IF NOT EXISTS security_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255),
    role_code VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- 2.2 Tabla: security_rbac
CREATE TABLE IF NOT EXISTS security_rbac (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_code VARCHAR(50) NOT NULL,
    permission_code VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- 2.3 Tabla: corpus_params
CREATE TABLE IF NOT EXISTS corpus_params (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    param_code VARCHAR(100) UNIQUE NOT NULL,
    param_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    technical_description TEXT NOT NULL,
    default_value NUMERIC NOT NULL,
    configurable_value NUMERIC NOT NULL,
    min_allowed_value NUMERIC NOT NULL,
    max_allowed_value NUMERIC NOT NULL,
    requires_approval BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    is_locked BOOLEAN DEFAULT false,
    version_number INTEGER DEFAULT 1,
    effective_from TIMESTAMP DEFAULT now(),
    effective_to TIMESTAMP,
    created_at TIMESTAMP DEFAULT now(),
    created_by UUID,
    updated_at TIMESTAMP DEFAULT now(),
    updated_by UUID
);

-- 2.4 Tabla: corpus_param_profiles
CREATE TABLE IF NOT EXISTS corpus_param_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    profile_name VARCHAR(255) NOT NULL,
    jurisdiction_id UUID,
    version_number INTEGER DEFAULT 1,
    hash_snapshot TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT now(),
    approved_at TIMESTAMP,
    approved_by UUID,
    activated_at TIMESTAMP,
    is_active BOOLEAN DEFAULT false
);

-- 2.5 Tabla: corpus_param_profile_values
CREATE TABLE IF NOT EXISTS corpus_param_profile_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES corpus_param_profiles(id),
    param_id UUID REFERENCES corpus_params(id),
    value NUMERIC NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- 2.6 Tabla: corpus_param_change_log
CREATE TABLE IF NOT EXISTS corpus_param_change_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    param_id UUID REFERENCES corpus_params(id),
    old_value NUMERIC,
    new_value NUMERIC,
    changed_by UUID,
    change_reason TEXT,
    change_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT now()
);

-- 3. PARÁMETROS OBLIGATORIOS (INITIAL DATA)
-- This will be handled via seed or manual insert after table creation.

-- 6. INMUTABILIDAD: Trigger SQL que impida UPDATE en profiles con is_active=true.
CREATE OR REPLACE FUNCTION prevent_active_profile_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_active = true THEN
        RAISE EXCEPTION 'Cannot update an active profile. Create a new version instead.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_prevent_active_profile_update ON corpus_param_profiles;
CREATE TRIGGER tr_prevent_active_profile_update
BEFORE UPDATE ON corpus_param_profiles
FOR EACH ROW
EXECUTE FUNCTION prevent_active_profile_update();
