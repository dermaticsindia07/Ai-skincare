# Fincal Skincare Server

Minimal Node.js + Express + Mongoose API to store leads in MongoDB.

## Setup

1. Install dependencies
```bash
npm install --prefix server
```

2. Configure env
- Edit `server/.env` and set `MONGODB_URI`.
- Default port is `8080`.

3. Run locally
```bash
npm start --prefix server
```

API will start at `http://localhost:8080`.

## Endpoints
- POST `/leads`  Save a lead
  - Body: `{ name, age, gender: 'male'|'female'|'other', phone, email }`
  - Response: `{ id, createdAt }`

## Frontend
- Set in `.env.local`:
```
VITE_LEADS_API_URL=http://localhost:8080/leads
```