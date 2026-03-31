# PIRNAV Task Management App

Full-stack task management system for **PIRNAV Software Solutions Pvt. Ltd.**

## Stack

- Frontend: React + Tailwind CSS
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Authentication: JWT

## Features

- JWT-based login and protected routes
- Role-based dashboards for `Admin` and `User`
- Admin task creation, assignment, task visibility, and status updates
- User-only task dashboard with issue reporting
- Responsive light-theme SaaS UI with PIRNAV branding

## Project Structure

```text
bug tracking/
|-- client/        -> frontend app (React + Tailwind)
|-- server/        -> backend app (Express + MongoDB)
|-- package.json
`-- README.md
```

Inside the main app folders:

```text
client/src/
|-- assets/
|-- components/
|   |-- dashboard/
|   |-- layout/
|   |-- shared/
|   |-- tasks/
|   `-- ui/
|-- context/
|-- hooks/
|-- lib/
`-- pages/

server/
|-- config/
|-- controllers/
|-- middleware/
|-- models/
|-- routes/
|-- scripts/
`-- utils/
```

## Setup

1. Install dependencies:

```bash
npm install
npm install --prefix server
npm install --prefix client
```

2. Create environment files:

- Copy `server/.env.example` to `server/.env`
- Copy `client/.env.example` to `client/.env`

3. Start the app:

```bash
npm run dev
```

4. Open the app:

- Client: `http://localhost:5173`
- Server API: `http://localhost:5000`

## Root Scripts

- `npm run dev`
- `npm run dev:server`
- `npm run dev:client`
- `npm run build`
- `npm run start`
- `npm run reset:default-user`

## Sample Environment Files

### server/.env

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/pirnav_task_management
JWT_SECRET=change-this-secret
```

### client/.env

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## Seeded Demo Accounts

The server seeds two demo accounts on startup:

- Admin
  - Email: `admin@example.com`
  - Password: `admin123`
- User
  - Email: `user@example.com`
  - Password: `user123`

## Main API Routes

### Auth

- `POST /api/auth/login`
- `POST /api/auth/register`

### Users

- `GET /api/users` admin only

### Tasks

- `POST /api/tasks` admin only
- `GET /api/tasks` admin only
- `GET /api/tasks/my` authenticated user
- `PUT /api/tasks/:id` admin or assigned user
- `POST /api/tasks/issues` authenticated user

## Notes

- Public registration creates a standard `User` account.
- The user issue flow creates a new open task assigned to the logged-in user.
