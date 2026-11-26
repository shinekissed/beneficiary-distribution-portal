
# Hybrid Benefit Distribution Information and Queue Assistance System
## Frontend–Backend API Contract

**Project:** BSIT Prototype  
**Frontend:** Vanilla HTML, CSS, JavaScript  
**API Style:** REST with JSON  
**Status:** Proposed contract — awaiting backend implementation

---

## 1. Purpose

This document defines how the beneficiary-facing frontend will communicate with the backend.

The system is an academic demonstration using fictional information only.

The frontend provides:
- Distribution schedule searching
- Fictional beneficiary record lookup
- Public announcements
- General information and guidance

The prototype does not verify eligibility, approve benefits, validate documents, assign live queue numbers, or monitor real-time attendance.

---

## 2. API Configuration

Expected development API base URL:

http://localhost:3000/api

Frontend configuration file:

vanilla-frontend/js/api/config.js

Current configuration:

```javascript
const API_CONFIG = {
  USE_MOCK_DATA: true,
  BASE_URL: "http://localhost:3000/api",
  TIMEOUT: 10000
};
```

### Integration mode

- `USE_MOCK_DATA: true` — frontend uses fictional local data.
- `USE_MOCK_DATA: false` — frontend sends requests to the backend.

Do not disable mock mode until the backend is available and the endpoints have been tested.

The backend port and base URL must be confirmed by the backend developer.

---

## 3. Endpoint: Get Distribution Schedules

**Method:** GET  
**Path:** `/api/schedules`

### Optional query parameter

`barangay` — searches schedules by barangay name.

### Example requests

GET /api/schedules

GET /api/schedules?barangay=Maligaya

### Expected response

HTTP 200 OK

```json
[
  {
    "id": 1,
    "barangay": "Barangay Maligaya",
    "date": "November 15, 2026",
    "day": "Sunday",
    "time": "8:00 AM – 12:00 PM",
    "venue": "Maligaya Covered Court",
    "group": "Surnames A–L"
  }
]
```

### Requirements

- Return a JSON array.
- Return all schedules when no barangay is provided.
- Filter by barangay when the parameter is provided.
- Support case-insensitive partial matching.
- Return `[]` when no schedules match.
- Keep field names and value types consistent.

The current frontend expects display-ready date, day, and time strings.

---

## 4. Endpoint: Beneficiary Lookup

**Method:** POST  
**Path:** `/api/beneficiaries/lookup`

### Request body

```json
{
  "name": "Maria Santos",
  "referenceCode": "HBD-2026-0142"
}
```

### Expected successful response

HTTP 200 OK

```json
{
  "id": 1,
  "name": "Maria Santos",
  "referenceCode": "HBD-2026-0142",
  "barangay": "Maligaya",
  "scheduleId": 1
}
```

### No matching record

HTTP 200 OK

```json
null
```

### Requirements

- Accept a JSON request body.
- Match the full name and reference code.
- Treat name matching as case-insensitive.
- Treat reference-code matching as case-insensitive.
- Return `null` if no fictional record matches.
- Do not return sensitive personal information.
- Use fictional demonstration records only.

### Important frontend limitation

The current frontend checks whether a matching record exists but still displays a fixed fictional Maria Santos result.

Before real backend integration, the frontend developer must update the result card to safely display approved fields from the response.

The backend must not rely on client-side validation for security.

---

## 5. Endpoint: Get Announcements

**Method:** GET  
**Path:** `/api/announcements`

### Example request

GET /api/announcements

### Expected response

HTTP 200 OK

```json
[
  {
    "id": 1,
    "type": "Schedule update",
    "date": "November 8, 2026",
    "title": "Barangay Mabini venue confirmed",
    "text": "The sample distribution venue is the Mabini Elementary School Gym. Please use the east gate entrance."
  },
  {
    "id": 2,
    "type": "Reminder",
    "date": "November 6, 2026",
    "title": "Bring original documents",
    "text": "Prepare your original valid ID and reference slip. Photocopies may be requested at the validation desk."
  },
  {
    "id": 3,
    "type": "Advisory",
    "date": "November 2, 2026",
    "title": "No fee is required",
    "text": "This fictional program does not collect processing fees. Report anyone asking for payment to the help desk."
  }
]
```

### Requirements

- Return a JSON array.
- Return `[]` when no announcements are available.
- Return newest announcements first.
- Keep `type`, `date`, `title`, and `text` as strings.

The homepage displays the first two announcements.

The full Announcements page displays all announcements.

---

## 6. Error Handling

The frontend expects successful responses to contain JSON.

Recommended HTTP status codes:

| Status | Meaning |
|---|---|
| 200 | Successful request |
| 400 | Invalid request |
| 404 | Unknown endpoint |
| 429 | Too many requests |
| 500 | Internal server error |
| 503 | Service temporarily unavailable |

Suggested error response:

```json
{
  "error": "SERVICE_UNAVAILABLE",
  "message": "Please try again later."
}
```

The current frontend displays a generic unavailable message when an API request fails.

The backend should not expose database details, stack traces, or internal secrets in public error messages.

---

## 7. Security and Privacy

- Use fictional data for the academic prototype.
- Do not store or expose real beneficiary records.
- Validate and sanitize all inputs on the backend.
- Restrict CORS to approved frontend origins.
- Apply rate limiting to the lookup endpoint.
- Avoid exposing complete beneficiary lists publicly.
- Do not put passwords, database credentials, or API secrets in frontend JavaScript.
- Use HTTPS for any deployment involving personal information.
- Obtain appropriate authorization and implement additional privacy controls before considering real beneficiary data.

---

## 8. Frontend Integration Checklist

Before switching to real API mode:

- [ ] Confirm backend host and port.
- [ ] Confirm all three endpoint paths.
- [ ] Confirm JSON field names and response formats.
- [ ] Test GET /api/schedules.
- [ ] Test GET /api/schedules?barangay=Maligaya.
- [ ] Test POST /api/beneficiaries/lookup.
- [ ] Test GET /api/announcements.
- [ ] Confirm CORS configuration.
- [ ] Update frontend rendering for safe API data.
- [ ] Test loading, empty, and error states.
- [ ] Set USE_MOCK_DATA to false.
- [ ] Retest all nine beneficiary pages.

---

## 9. Team Responsibilities

### Frontend Developer

- Maintain the nine beneficiary-facing pages.
- Implement API calls and UI integration.
- Handle loading, empty, and error states.
- Ensure responsive and accessible design.
- Test the frontend against agreed API responses.

### Backend Developer

- Implement the agreed API endpoints.
- Provide fictional records and announcements.
- Validate requests and handle errors.
- Configure CORS and basic security.
- Coordinate endpoint changes with the frontend developer.

---

## 10. Current Project Status

Frontend pages: Complete for prototype testing.

Mock API service: Implemented and tested.

Real backend API: Not yet connected.

Integration status: Awaiting backend implementation and contract confirmation.

**Note:** All examples in this document are fictional demonstration data.
