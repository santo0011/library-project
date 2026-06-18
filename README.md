# Enterprise MERN Admin Panel

Production-ready admin panel scaffold with separate frontend and backend projects.

## Projects

- `backend`: Node.js, Express, MongoDB, Mongoose, JWT auth, refresh tokens, RBAC, validation, secure middleware.
- `frontend`: React, Redux Toolkit, React Router, Axios, Bootstrap 5, charts, responsive dashboard UI, dark/light mode.

## Quick Start

```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev
```

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Default seeded super admin:

- Email: `superadmin@example.com`
- Password: `Admin@12345`

## Notes

- Change `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `COOKIE_SECRET` before production.
- Set explicit production CORS origins in `backend/.env`.
- Use HTTPS in production so refresh-token cookies can be marked secure.
