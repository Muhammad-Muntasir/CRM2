# Implementation Tasks

## Task 1: Setup Backend Project Structure
**Requirements:** 10, 11

- [x] 1.1 Create backend directory with src folder structure
- [x] 1.2 Create backend/package.json with dependencies
- [x] 1.3 Create backend/tsconfig.json for TypeScript configuration
- [x] 1.4 Install backend dependencies

## Task 2: Create Backend TypeScript Types
**Requirements:** 10.4

- [x] 2.1 Create backend/src/types/note.ts with Note and CreateNoteRequest interfaces

## Task 3: Create Backend Utility Modules
**Requirements:** 10.3

- [x] 3.1 Create backend/src/utils/dbClient.ts for DynamoDB client
- [x] 3.2 Create backend/src/utils/response.ts for HTTP response helpers
- [x] 3.3 Create backend/src/utils/auth.ts for authentication middleware
- [x] 3.4 Create backend/src/utils/validation.ts for input validation

## Task 4: Create Backend Note Service
**Requirements:** 1, 2, 5, 10.2

- [x] 4.1 Create backend/src/services/noteService.ts with createNote function
- [x] 4.2 Implement getNotesByPatient function in noteService.ts

## Task 5: Create Backend Lambda Handlers
**Requirements:** 1, 2, 3, 4, 10.1, 10.2

- [x] 5.1 Consolidate createNote, getNotes, updateNote, deleteNote into backend/src/handlers/notes.ts (single parent file)
- [x] 5.2 Consolidate listPatients, createPatient, deletePatient into backend/src/handlers/patients.ts (single parent file)
- [x] 5.3 Auto-generate patientId as UUID in createPatient — user provides name only
- [x] 5.4 Update serverless.yml handler paths to point to notes.ts and patients.ts
- [x] 5.5 Update frontend Sidebar to remove patientId input field
- [x] 5.6 Update frontend api.js createPatient to not send patientId

## Task 6: Configure Serverless Framework
**Requirements:** 11

- [x] 6.1 Create backend/serverless.yml with service configuration
- [x] 6.2 Define Lambda functions in serverless.yml
- [x] 6.3 Define HTTP API routes in serverless.yml
- [x] 6.4 Define DynamoDB table in serverless.yml
- [x] 6.5 Configure IAM permissions in serverless.yml
- [x] 6.6 Configure CORS in serverless.yml

## Task 7: Setup Frontend Project Structure
**Requirements:** 12

- [x] 7.1 Create frontend directory structure
- [x] 7.2 Create frontend/package.json with dependencies
- [x] 7.3 Create frontend/vite.config.js
- [x] 7.4 Create frontend/index.html
- [x] 7.5 Install frontend dependencies

## Task 8: Create Frontend API Service
**Requirements:** 9, 12.3

- [x] 8.1 Create frontend/src/services/api.js with getNotes function
- [x] 8.2 Implement createNote function in api.js

## Task 9: Create Frontend Components
**Requirements:** 7, 8, 12.1, 12.2

- [x] 9.1 Create frontend/src/components/NotesList.jsx
- [x] 9.2 Create frontend/src/components/NoteForm.jsx
- [x] 9.3 Create frontend/src/App.jsx
- [x] 9.4 Create frontend/src/main.jsx

## Task 10: Create Frontend Styles
**Requirements:** 12.5

- [x] 10.1 Create frontend/src/styles.css with component styles

## Task 11: Create Project Documentation
**Requirements:** 13

- [x] 11.1 Create README.md at root level with project overview, setup instructions, and architecture explanation
