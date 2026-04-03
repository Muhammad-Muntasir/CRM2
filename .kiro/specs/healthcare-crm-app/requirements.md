# Requirements Document

## Introduction

This document specifies the requirements for a healthcare CRM full-stack application that enables clinics to create and retrieve patient follow-up notes. The system uses AWS serverless architecture with a Node.js/TypeScript backend and React frontend, providing a scalable, production-ready solution for managing patient care documentation.

## Glossary

- **Backend_API**: The serverless API built with AWS Lambda, API Gateway, and DynamoDB that handles note operations
- **Frontend_Application**: The React-based web interface that allows users to interact with patient notes
- **Patient_Note**: A clinical follow-up note containing content, timestamps, and authorship information
- **Note_Service**: The backend service layer responsible for note business logic and data persistence
- **DynamoDB_Client**: The AWS SDK v3 client for interacting with DynamoDB tables
- **API_Gateway**: AWS HTTP API Gateway that routes requests to Lambda functions
- **Authentication_Middleware**: The component that validates user identity via x-user-id header
- **CORS_Configuration**: Cross-Origin Resource Sharing settings enabling frontend-backend communication

## Requirements

### Requirement 1: Create Patient Notes

**User Story:** As a clinic staff member, I want to create follow-up notes for patients, so that I can document patient care and treatment progress.

#### Acceptance Criteria

1. WHEN a POST request is sent to /patients/{patientId}/notes with valid content, THE Backend_API SHALL create a new Patient_Note with a generated UUID
2. WHEN creating a Patient_Note, THE Backend_API SHALL store the patientId, noteId, content, createdAt timestamp, and createdBy user identifier
3. WHEN a Patient_Note is successfully created, THE Backend_API SHALL return a 201 status code with the complete note object
4. THE Backend_API SHALL generate noteId values using the UUID library
5. THE Backend_API SHALL set createdAt timestamps in ISO 8601 format
6. THE Backend_API SHALL set createdBy from the authenticated user identifier

### Requirement 2: Retrieve Patient Notes

**User Story:** As a clinic staff member, I want to retrieve all notes for a specific patient, so that I can review their care history.

#### Acceptance Criteria

1. WHEN a GET request is sent to /patients/{patientId}/notes, THE Backend_API SHALL return all Patient_Note records for that patient
2. THE Backend_API SHALL sort returned Patient_Note records by createdAt in descending order
3. WHEN notes are successfully retrieved, THE Backend_API SHALL return a 200 status code with an array of note objects
4. WHEN no notes exist for a patient, THE Backend_API SHALL return a 200 status code with an empty array

### Requirement 3: Validate Request Data

**User Story:** As a system administrator, I want invalid requests to be rejected, so that data integrity is maintained.

#### Acceptance Criteria

1. WHEN a request contains an empty or missing content field, THE Backend_API SHALL return a 400 status code with a descriptive error message
2. WHEN a request contains an invalid patientId format, THE Backend_API SHALL return a 400 status code with a descriptive error message
3. THE Backend_API SHALL validate that content is a non-empty string before creating a Patient_Note
4. THE Backend_API SHALL validate that patientId is present in the request path

### Requirement 4: Authenticate Requests

**User Story:** As a security administrator, I want all API requests to be authenticated, so that only authorized users can access patient data.

#### Acceptance Criteria

1. WHEN a request is missing the x-user-id header, THE Backend_API SHALL return a 401 status code with an error message
2. WHEN a request includes a valid x-user-id header, THE Backend_API SHALL process the request normally
3. THE Authentication_Middleware SHALL extract the user identifier from the x-user-id header
4. THE Backend_API SHALL use the authenticated user identifier as the createdBy value for new notes

### Requirement 5: Store Notes in DynamoDB

**User Story:** As a system architect, I want patient notes stored in DynamoDB, so that the system can scale efficiently.

#### Acceptance Criteria

1. THE Backend_API SHALL store Patient_Note records in a DynamoDB table named PatientNotes
2. THE Backend_API SHALL use patientId as the partition key for the PatientNotes table
3. THE Backend_API SHALL use noteId as the sort key for the PatientNotes table
4. WHEN storing a Patient_Note, THE Backend_API SHALL include fields: noteId, patientId, content, createdAt, and createdBy
5. THE DynamoDB_Client SHALL use AWS SDK v3 for all database operations

### Requirement 6: Enable CORS for Frontend Integration

**User Story:** As a frontend developer, I want CORS enabled on the API, so that the web application can communicate with the backend.

#### Acceptance Criteria

1. THE API_Gateway SHALL include CORS headers in all HTTP responses
2. THE CORS_Configuration SHALL allow requests from the frontend origin
3. THE CORS_Configuration SHALL allow the x-user-id and Content-Type headers
4. THE CORS_Configuration SHALL allow GET and POST methods

### Requirement 7: Display Notes in Frontend

**User Story:** As a clinic staff member, I want to view all notes for a patient in the web interface, so that I can quickly review care history.

#### Acceptance Criteria

1. WHEN the Frontend_Application loads, THE Frontend_Application SHALL fetch and display all notes for patient-123
2. THE Frontend_Application SHALL display Patient_Note records sorted by createdAt in descending order
3. THE Frontend_Application SHALL display the content and createdAt timestamp for each Patient_Note
4. WHEN notes are being fetched, THE Frontend_Application SHALL display a loading indicator

### Requirement 8: Submit Notes via Frontend Form

**User Story:** As a clinic staff member, I want to submit new notes through a web form, so that I can quickly document patient interactions.

#### Acceptance Criteria

1. THE Frontend_Application SHALL provide a textarea input for note content
2. THE Frontend_Application SHALL provide a submit button to create notes
3. WHEN the submit button is clicked with empty content, THE Frontend_Application SHALL prevent submission and show a validation message
4. WHEN a note is successfully submitted, THE Frontend_Application SHALL clear the form and refresh the notes list
5. WHEN a note submission fails, THE Frontend_Application SHALL display an error message to the user
6. THE Frontend_Application SHALL use patientId "patient-123" for all note operations

### Requirement 9: Integrate Frontend with Backend API

**User Story:** As a system integrator, I want the frontend to communicate with the backend API, so that the application functions end-to-end.

#### Acceptance Criteria

1. THE Frontend_Application SHALL send requests to the Backend_API at http://localhost:3000
2. THE Frontend_Application SHALL include the x-user-id header with value "demo-user" in all requests
3. THE Frontend_Application SHALL include the Content-Type header with value "application/json" in POST requests
4. THE Frontend_Application SHALL use the Fetch API for all HTTP requests
5. WHEN API requests fail, THE Frontend_Application SHALL handle errors gracefully and inform the user

### Requirement 10: Structure Backend Code Modularly

**User Story:** As a backend developer, I want the code organized into clear modules, so that the system is maintainable and testable.

#### Acceptance Criteria

1. THE Backend_API SHALL consolidate all note-related Lambda handlers (createNote, getNotes, updateNote, deleteNote) into a single parent file: `handlers/notes.ts`, exporting named handler functions. Any future note API additions SHALL be added to this same file.
2. THE Backend_API SHALL consolidate all patient-related Lambda handlers (listPatients, createPatient, deletePatient) into a single parent file: `handlers/patients.ts`.
3. THE Backend_API SHALL implement business logic in a noteService.ts module
4. THE Backend_API SHALL provide utility modules for: dbClient.ts, response.ts, auth.ts, and validation.ts
5. THE Backend_API SHALL define TypeScript types in a types/note.ts module
6. THE Backend_API SHALL use async/await for all asynchronous operations
7. THE Backend_API SHALL auto-generate patientId as a UUID when creating a patient — the user provides only the patient name.

### Requirement 11: Configure Serverless Deployment

**User Story:** As a DevOps engineer, I want the infrastructure defined as code, so that the application can be deployed consistently.

#### Acceptance Criteria

1. THE Backend_API SHALL define infrastructure in a serverless.yml configuration file
2. THE serverless.yml SHALL define two Lambda functions: createNote and getNotes
3. THE serverless.yml SHALL define HTTP API routes for POST /patients/{patientId}/notes and GET /patients/{patientId}/notes
4. THE serverless.yml SHALL define the PatientNotes DynamoDB table with appropriate keys
5. THE serverless.yml SHALL grant Lambda functions IAM permissions to access DynamoDB
6. THE serverless.yml SHALL enable CORS configuration in API Gateway
7. THE serverless.yml SHALL provide the DynamoDB table name as an environment variable to Lambda functions

### Requirement 12: Structure Frontend Code into Components

**User Story:** As a frontend developer, I want the UI organized into reusable components, so that the code is maintainable.

#### Acceptance Criteria

1. THE Frontend_Application SHALL implement a NoteForm.jsx component for note submission
2. THE Frontend_Application SHALL implement a NotesList.jsx component for displaying notes
3. THE Frontend_Application SHALL implement an api.js service module with getNotes and createNote functions
4. THE Frontend_Application SHALL use Vite as the build tool and development server
5. THE Frontend_Application SHALL style components using plain CSS in styles.css

### Requirement 13: Provide Documentation

**User Story:** As a new developer, I want clear setup instructions, so that I can run the application locally.

#### Acceptance Criteria

1. THE project SHALL include a README.md file at the root level
2. THE README.md SHALL explain the project overview and architecture
3. THE README.md SHALL provide backend setup instructions including npm install and serverless deploy commands
4. THE README.md SHALL provide frontend setup instructions including npm install and npm run dev commands
5. THE README.md SHALL explain how the frontend connects to the backend
6. THE README.md SHALL document the authentication mechanism using x-user-id header
7. THE README.md SHALL list assumptions and limitations of the system

### Requirement 14: Return Structured JSON Responses

**User Story:** As a frontend developer, I want consistent API response formats, so that I can reliably parse responses.

#### Acceptance Criteria

1. THE Backend_API SHALL return all responses in JSON format
2. WHEN an error occurs, THE Backend_API SHALL return a JSON object with an error message field
3. WHEN a note is created, THE Backend_API SHALL return the complete note object including all fields
4. WHEN notes are retrieved, THE Backend_API SHALL return a JSON array of note objects
5. THE Backend_API SHALL set appropriate Content-Type headers for JSON responses
