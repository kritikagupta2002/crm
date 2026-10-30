# Bansal Geo HRMS & Attendance — Node.js Backend

A complete, production-ready Node.js & Express backend for the **HRMS, Attendance, and Employee Management** platform.

---

## 🚀 Quick Start

### 1. Install Dependencies
Dependencies are already configured in the root `package.json` (`express`, `cors`, `dotenv`, `jsonwebtoken`).

```bash
npm install
```

### 2. Start the Backend Server
```bash
npm run server
```
Server will start at:
- **API Base URL**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/api/health`
- **API Documentation Index**: `http://localhost:5000/`

For automatic reloads during development:
```bash
npm run server:dev
```

### 3. Run Both Frontend and Backend Concurrently
```bash
npm run dev:all
```
The Vite frontend (`http://localhost:5173`) automatically proxies all `/api/*` requests to `http://localhost:5000`.

---

## 📁 Backend Directory Architecture

```
server/
├── config/
│   └── config.js              # Environment settings (PORT, JWT Secret, Data Path)
├── controllers/
│   ├── authController.js      # Sign-in, token verification, current user profile
│   ├── employeeController.js  # Employee CRUD, performance reviews, exit process
│   ├── attendanceController.js# Daily/monthly attendance, live punches, corrections
│   ├── leaveController.js     # Leave applications, approval workflow, balances
│   ├── shiftController.js     # Shift scheduling & weekly off assignments
│   ├── organizationController.js # Departments, designations, hierarchy
│   ├── notificationController.js # HR notifications & alerts
│   └── settingsController.js  # Company profile, attendance & leave policies
├── middleware/
│   ├── auth.js                # JWT Bearer token authentication & role authorization
│   └── errorHandler.js        # Global error interception & JSON response
├── routes/
│   ├── authRoutes.js          # /api/auth/*
│   ├── employeeRoutes.js      # /api/employees/*
│   ├── attendanceRoutes.js    # /api/attendance/*
│   ├── leaveRoutes.js         # /api/leaves/*
│   ├── shiftRoutes.js         # /api/shifts/*
│   ├── organizationRoutes.js  # /api/organization/*
│   ├── notificationRoutes.js  # /api/notifications/*
│   ├── settingsRoutes.js      # /api/settings/*
│   └── index.js               # Route aggregator
├── services/
│   └── db.js                  # Persistent file database service with atomic JSON writes
├── data/                      # Persistent real JSON database files (auto-generated)
│   ├── employees.json
│   ├── attendance.json
│   ├── corrections.json
│   ├── leaves.json
│   ├── leave_types.json
│   ├── shifts.json
│   ├── shift_assignments.json
│   ├── departments.json
│   ├── designations.json
│   ├── notifications.json
│   └── settings.json
└── server.js                  # Main server entry point
```

---

## 📡 REST API Reference

### 🔐 1. Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/login` | Sign in with email, role & password | Public |
| `GET` | `/api/auth/me` | Fetch active user identity & linked profile | Authenticated |
| `POST` | `/api/auth/logout` | Invalidate active session | Authenticated |

#### Example Login Request:
```json
POST /api/auth/login
Content-Type: application/json

{
  "email": "kritika.gupta@bansalgeo.com",
  "role": "Super Admin",
  "password": "demo"
}
```

---

### 👥 2. Employees (`/api/employees`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/employees` | List employees (filter by department, status, search) | All |
| `GET` | `/api/employees/:id` | Get employee details by ID / Employee ID | All |
| `POST` | `/api/employees` | Create a new employee record | HR Admin |
| `PUT` | `/api/employees/:id` | Update employee information | HR Admin |
| `DELETE` | `/api/employees/:id` | Remove an employee record | HR Admin |
| `GET` | `/api/employees/performance/records` | Get performance reviews & ratings | All |
| `POST` | `/api/employees/performance/records` | Add performance review | HR Admin |
| `GET` | `/api/employees/exit/records` | List exit & resignation records | All |
| `POST` | `/api/employees/exit/records` | Initiate resignation / exit process | HR Admin |
| `PUT` | `/api/employees/exit/records/:id` | Update clearance & FNF status | HR Admin |

---

### ⏱️ 3. Attendance (`/api/attendance`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/attendance` | List attendance records (filter by date, month, employeeId) | All |
| `GET` | `/api/attendance/today` | Today's live dashboard stats (present, late, absent, on leave) | All |
| `POST` | `/api/attendance/punch` | Record Punch-In (`checkIn`) or Punch-Out (`checkOut`) | All |
| `GET` | `/api/attendance/monthly` | Get monthly attendance grid matrix (P/A/L/LV/WO) | All |
| `GET` | `/api/attendance/corrections` | List attendance correction requests | All |
| `POST` | `/api/attendance/corrections` | Submit attendance correction request | All |
| `PUT` | `/api/attendance/corrections/:id` | Approve / Reject correction request | HR Admin |

#### Punch Request Example:
```json
POST /api/attendance/punch
Content-Type: application/json

{
  "employeeId": "BGS-008",
  "punchType": "checkIn",
  "source": "Web Portal"
}
```

---

### 🏖️ 4. Leave Management (`/api/leaves`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/leaves/types` | List leave types (Privilege, Casual, Sick, etc.) | All |
| `GET` | `/api/leaves/balances/:employeeId` | Get leave balances (allocated, used, available) | All |
| `GET` | `/api/leaves/requests` | List leave applications (filter by status, employeeId) | All |
| `POST` | `/api/leaves/requests` | Apply for leave | All |
| `PUT` | `/api/leaves/requests/:id/status` | Approve or Reject leave application | HR Admin |

---

### 🔄 5. Shifts (`/api/shifts`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/shifts` | List all shift timings | All |
| `POST` | `/api/shifts` | Create new shift definition | HR Admin |
| `GET` | `/api/shifts/assignments` | List employee shift & weekly-off assignments | All |
| `POST` | `/api/shifts/assignments` | Assign shift & weekly off to employee | HR Admin |

---

### 🏢 6. Organization (`/api/organization`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/organization/departments` | List all departments | All |
| `POST` | `/api/organization/departments` | Create new department | HR Admin |
| `GET` | `/api/organization/designations` | List all designations | All |
| `POST` | `/api/organization/designations` | Create new designation | HR Admin |
| `GET` | `/api/organization/chart` | Hierarchical org chart | All |

---

### ⚙️ 7. Settings (`/api/settings`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/settings/company` | Company profile & contact details | All |
| `PUT` | `/api/settings/company` | Update company profile | HR Admin |
| `GET` | `/api/settings/attendance` | Attendance rules & work hour settings | All |
| `PUT` | `/api/settings/attendance` | Update attendance rules | HR Admin |
| `GET` | `/api/settings/leave` | Leave policy settings | All |
| `PUT` | `/api/settings/leave` | Update leave policies | HR Admin |

---

## 💾 Adding Real Data

To add real data to your system, you can choose any of the following methods:

1. **Via the UI / REST APIs**:
   - Create real employees via the **Add Employee** form in the UI or `POST /api/employees`.
   - Punch attendance via the UI or `POST /api/attendance/punch`.
   - Apply leaves via `POST /api/leaves/requests`.

2. **Direct JSON File Editing**:
   - The server stores data in `server/data/*.json`.
   - You can replace or populate `server/data/employees.json` directly with your company's actual employee dataset.

3. **Connecting a Production Database (MongoDB / PostgreSQL / MySQL)**:
   - The database layer is isolated in `server/services/db.js`.
   - Replace the file read/write methods in `server/services/db.js` with your preferred ORM (e.g., Mongoose, Prisma, or Sequelize) without changing any controller or route logic!

