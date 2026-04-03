# Healthcare CRM App

A full-stack serverless application for managing patient follow-up notes. Clinic staff can create and retrieve notes for patients through a React web interface backed by AWS Lambda, API Gateway, and DynamoDB.

## Architecture

```
Frontend (React + Vite)
    └── Fetch API
        └── AWS API Gateway (HTTP API)
            ├── POST /patients/{patientId}/notes → createNote Lambda
            └── GET  /patients/{patientId}/notes → getNotes Lambda
                └── DynamoDB (PatientNotes table)
```

**Stack:**
- Frontend: React 18, Vite, plain CSS
- Backend: Node.js 18 / TypeScript, AWS Lambda
- Infrastructure: Serverless Framework, AWS API Gateway, DynamoDB
- Auth: `x-user-id` request header (demo/internal use)

## Prerequisites

- Node.js 18+
- AWS CLI configured with appropriate credentials
- Serverless Framework CLI (`npm install -g serverless`)

## Backend Setup

```bash
cd backend
npm install
npx serverless deploy
```

After deployment, note the API Gateway URL printed in the output — you'll need it for the frontend.

## Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:

```
VITE_API_URL=https://your-api-gateway-url
VITE_USER_ID=demo-user
```

Then start the dev server:

```bash
npm run dev
```

## Environment Variables

| Variable | Location | Description |
|---|---|---|
| `VITE_API_URL` | frontend `.env` | Base URL of the deployed API Gateway |
| `VITE_USER_ID` | frontend `.env` | Value sent as `x-user-id` header (defaults to `demo-user`) |
| `NOTES_TABLE` | backend (auto) | DynamoDB table name — set automatically by Serverless Framework |

## Authentication

All API requests must include the `x-user-id` header. The frontend sends this automatically using the `VITE_USER_ID` env var. The value is stored as `createdBy` on each note.

## Running Tests

```bash
cd backend
npm test
```

## Assumptions & Limitations

- Authentication is header-based (`x-user-id`) — not suitable for production without a proper auth layer
- The frontend hardcodes `patient-123` as the active patient ID
- No pagination on note retrieval; all notes for a patient are returned in a single response
- Frontend connects to `http://localhost:3000` by default (Serverless Offline) unless `VITE_API_URL` is set
