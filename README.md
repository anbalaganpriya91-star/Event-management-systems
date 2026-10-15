# EventLy — Event Management System (Node.js + Express + MySQL)

Same full-featured Event Management System, rebuilt with a **Node.js / Express.js REST API backend** in place of PHP. Frontend is unchanged in spirit — HTML5, CSS3 (responsive), jQuery + AJAX — but now talks to clean REST routes instead of PHP query-action endpoints.

---

## 🧱 Tech Stack

- **Backend:** Node.js, Express.js, REST routes/controllers, `express-session` (auth), `bcryptjs` (password hashing), `mysql2/promise` (DB)
- **Database:** MySQL (same schema/relationships as before)
- **Frontend:** HTML5, CSS3 responsive design, JS + DOM, jQuery, AJAX (`$.ajax`)

---

## ✨ Features
Authentication (session-based) · Dashboard with Chart.js graphs · Venues CRUD · Participants CRUD · Events CRUD · Bookings with live seat-availability checks · Payment workflow (process / refund / mark failed, auto-confirms or cancels the linked booking) · Booking reports with filters + CSV export.

---

## 📁 Project Structure

```
ems-node/
├── app.js                     # Express app entry point
├── package.json
├── .env.example                # copy to .env and fill in
├── config/
│   └── db.js                  # mysql2 connection pool
├── middleware/
│   ├── authMiddleware.js      # requireLogin / requireAdmin
│   └── errorHandler.js        # centralized error handler + asyncHandler wrapper
├── utils/
│   └── helpers.js             # validation, code generators, response helpers
├── controllers/
│   ├── authController.js
│   ├── venueController.js
│   ├── participantController.js
│   ├── eventController.js
│   ├── bookingController.js
│   ├── paymentController.js
│   ├── dashboardController.js
│   └── reportController.js
├── routes/
│   ├── authRoutes.js
│   ├── venueRoutes.js
│   ├── participantRoutes.js
│   ├── eventRoutes.js
│   ├── bookingRoutes.js
│   ├── paymentRoutes.js
│   ├── dashboardRoutes.js
│   └── reportRoutes.js
├── database/
│   └── event_management.sql   # schema + seed data (same as before)
└── public/                     # static frontend served by Express
    ├── css/style.css
    ├── js/ (app.js, auth.js, dashboard.js, venues.js, participants.js, events.js, bookings.js, payments.js, reports.js)
    ├── index.html, login.html, register.html
    └── dashboard.html, venues.html, participants.html, events.html, bookings.html, payments.html, reports.html
```

---

## 🚀 Setup Instructions

### 1. Requirements
- Node.js 18+ and npm
- MySQL 5.7+ / MariaDB 10.3+

### 2. Install dependencies
```bash
cd ems-node
npm install
```

### 3. Import the database
```bash
mysql -u root -p < database/event_management.sql
```

### 4. Configure environment
```bash
cp .env.example .env
```
Edit `.env`:
```
PORT=3000
SESSION_SECRET=some_long_random_string
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=event_management_system
```

### 5. Run the server
```bash
npm start          # production
npm run dev         # auto-restart on file changes (nodemon)
```

Visit **http://localhost:3000** — you'll be redirected to the login page.

### 6. Login
```
Email:    admin@ems.com
Password: Admin@123
```
> ⚠️ Change this password after first login in a production deployment.

---

## 🔌 REST API Reference

All responses follow `{ success, message, data }`.

| Resource | Method | Route | Purpose |
|---|---|---|---|
| Auth | POST | `/api/auth/register` | Create account |
| Auth | POST | `/api/auth/login` | Authenticate, starts session |
| Auth | POST | `/api/auth/logout` | Destroy session |
| Auth | GET | `/api/auth/me` | Current session user |
| Venues | GET | `/api/venues?search=` | List / search venues |
| Venues | GET | `/api/venues/available` | Venues available for booking |
| Venues | GET/POST/PUT/DELETE | `/api/venues/:id` | Get / Create / Update / Delete |
| Participants | GET | `/api/participants?search=` | List / search |
| Participants | GET | `/api/participants/all` | Lightweight list for dropdowns |
| Participants | GET/POST/PUT/DELETE | `/api/participants/:id` | CRUD |
| Events | GET | `/api/events?search=&status=` | List / filter |
| Events | GET | `/api/events/upcoming` | Upcoming events for booking |
| Events | GET/POST/PUT/DELETE | `/api/events/:id` | CRUD |
| Bookings | GET | `/api/bookings?search=&status=` | List / filter |
| Bookings | POST | `/api/bookings` | Create (checks seat availability, auto-creates pending payment) |
| Bookings | PUT | `/api/bookings/:id/status` | Update booking status |
| Bookings | DELETE | `/api/bookings/:id` | Delete |
| Payments | GET | `/api/payments?status=` | List / filter |
| Payments | POST | `/api/payments/:id/process` | Complete payment → auto-confirms booking |
| Payments | POST | `/api/payments/:id/refund` | Refund → auto-cancels booking |
| Payments | POST | `/api/payments/:id/fail` | Mark payment as failed |
| Dashboard | GET | `/api/dashboard/stats` | Aggregated stats + chart data |
| Reports | GET | `/api/reports/bookings?from_date=&to_date=&status=&venue_id=` | Filterable report + summary |
| Reports | GET | `/api/reports/export` | CSV download (same filters) |

---

## 🔒 Security Notes
- All SQL uses **parameterized queries** via `mysql2` (no string concatenation).
- Passwords hashed with **bcryptjs**.
- `express-session` cookie-based auth guards every protected route via `requireLogin` middleware.
- Centralized error handler maps MySQL FK/duplicate errors to clean 409 responses instead of leaking stack traces.
- CORS configured with `credentials: true` for session cookie support (safe to remove if frontend and API always share the same origin, as they do by default here).

> **Production note:** `express-session` uses the default in-memory store, which is fine for development/demo but resets on server restart and doesn't scale across multiple processes. For production, swap in a persistent store such as `connect-mysql-session` or `connect-redis`.

## 🎨 Design
Same design system as the PHP version — deep navy + warm amber accent, Fraunces/Inter typefaces, fully responsive (sidebar collapses to a mobile drawer under 860px).
