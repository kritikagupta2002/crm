-- Bansal Geo Solutions Pvt. Ltd.
-- HRMS & Attendance PostgreSQL Production Database Schema

-- 1. Users Table (Authentication & Access)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  role VARCHAR(64) NOT NULL,
  employee_id VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Employees Master Table
CREATE TABLE IF NOT EXISTS employees (
  id VARCHAR(64) PRIMARY KEY,
  employee_id VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(64),
  department VARCHAR(128),
  designation VARCHAR(128),
  role VARCHAR(64) DEFAULT 'Employee',
  status VARCHAR(64) DEFAULT 'Active',
  avatar_url TEXT,
  joining_date DATE,
  employment_type VARCHAR(64) DEFAULT 'Full-time',
  work_location VARCHAR(128) DEFAULT 'Jaipur Office',
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Attendance Register
CREATE TABLE IF NOT EXISTS attendance (
  id VARCHAR(64) PRIMARY KEY,
  employee_id VARCHAR(64) NOT NULL,
  employee_name VARCHAR(255),
  department VARCHAR(128),
  date DATE NOT NULL,
  check_in VARCHAR(32),
  check_out VARCHAR(32),
  working_hours VARCHAR(64),
  late_by VARCHAR(64) DEFAULT '-',
  overtime VARCHAR(64) DEFAULT '-',
  status VARCHAR(64) DEFAULT 'Present',
  punch_source VARCHAR(128) DEFAULT 'Office Geofenced GPS',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  in_geofence BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_employee_date UNIQUE (employee_id, date)
);

-- 4. Attendance Corrections & Regularization Requests
CREATE TABLE IF NOT EXISTS attendance_corrections (
  id VARCHAR(64) PRIMARY KEY,
  employee_id VARCHAR(64) NOT NULL,
  employee_name VARCHAR(255),
  department VARCHAR(128),
  date DATE NOT NULL,
  current_check_in VARCHAR(32),
  current_check_out VARCHAR(32),
  requested_check_in VARCHAR(32) NOT NULL,
  requested_check_out VARCHAR(32) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(64) DEFAULT 'Pending',
  reviewed_by VARCHAR(255),
  review_comment TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  applied_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Leave Requests
CREATE TABLE IF NOT EXISTS leaves (
  id VARCHAR(64) PRIMARY KEY,
  employee_id VARCHAR(64) NOT NULL,
  employee_name VARCHAR(255),
  department VARCHAR(128),
  leave_type VARCHAR(64) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  requested_days NUMERIC(4, 1) NOT NULL,
  approved_days NUMERIC(4, 1) DEFAULT 0,
  rejected_days NUMERIC(4, 1) DEFAULT 0,
  days NUMERIC(4, 1) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(64) DEFAULT 'Pending',
  approver_name VARCHAR(255),
  approver_comment TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Leave Balances
CREATE TABLE IF NOT EXISTS leave_balances (
  id VARCHAR(64) PRIMARY KEY,
  employee_id VARCHAR(64) NOT NULL,
  leave_type VARCHAR(64) NOT NULL,
  allocated NUMERIC(4, 1) DEFAULT 0,
  used NUMERIC(4, 1) DEFAULT 0,
  pending NUMERIC(4, 1) DEFAULT 0,
  available NUMERIC(4, 1) DEFAULT 0,
  fiscal_year VARCHAR(32) DEFAULT '2025-2026',
  CONSTRAINT unique_employee_leave_type UNIQUE (employee_id, leave_type)
);

-- 7. Shifts & Schedules
CREATE TABLE IF NOT EXISTS shifts (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  code VARCHAR(64) UNIQUE NOT NULL,
  start_time VARCHAR(32) NOT NULL,
  end_time VARCHAR(32) NOT NULL,
  grace_minutes INT DEFAULT 15,
  half_day_hours NUMERIC(4, 1) DEFAULT 4.5,
  is_night_shift BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Shift Assignments
CREATE TABLE IF NOT EXISTS shift_assignments (
  id VARCHAR(64) PRIMARY KEY,
  employee_id VARCHAR(64) NOT NULL,
  shift_id VARCHAR(64) NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Departments & Designations
CREATE TABLE IF NOT EXISTS departments (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) UNIQUE NOT NULL,
  code VARCHAR(64),
  head VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS designations (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(128) UNIQUE NOT NULL,
  department VARCHAR(128),
  grade VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. In-App Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(64) DEFAULT 'General',
  priority VARCHAR(64) DEFAULT 'normal',
  recipient_id VARCHAR(64),
  target_role VARCHAR(64) DEFAULT 'all',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. System Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  action VARCHAR(128) NOT NULL,
  performed_by VARCHAR(255) NOT NULL,
  target_id VARCHAR(128),
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. General Settings
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(128) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
