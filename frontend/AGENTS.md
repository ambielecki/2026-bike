# Frontend
This is a Vue.js with pinia and vue-router frontend. This repo is using playwright for e2e testing and 

## Procedures
- All UI development should be accessible, please ensure that all components are accessible to users with disabilities.
- All UI development should be mobile responsive and work for both desktop and mobile devices.
- npm v26.x is installed with nvm, use this version for development.
- The backend api base url is set in VITE_API_URL in .env file.
- Prefer native JavaScript APIs over third-party libraries when possible.
- For css prefer rem spacing to px.
- Single-card pages, such as log in and follow-on authenticated views, should sit below the navbar with standard page padding. Do not vertically center a lone card in the viewport.

## API Endpoints
- `GET /api/health`
  - Returns `200 OK` with `{"status":"ok"}`.
  - Use this for lightweight API availability checks.
- The following endpoints exist only when `APP_ENV` is not `production`. The environment check is case insensitive.
- `GET /api/test-errors/not-found`
  - Returns `404` with JSON containing `{"message":"Test not found error."}`.
  - Use this to test frontend not-found handling.
- `GET /api/test-errors/server-error`
  - Returns `500` with JSON containing `{"message":"Test server error."}`.
  - Use this to test frontend server error handling.
- `GET /api/test-errors/validation`
  - Returns `422` with JSON containing `{"message":"Test validation error.","errors":{"test":["Test validation error."]}}`.
  - Use this to test frontend validation error handling.
- `POST /api/test-session`
  - Returns `200 OK` with `{"status":"ok","count":N}` when the request has a valid session and CSRF token.
  - The `count` value increments when multiple valid POST requests reuse the same session.
  - Requests without a valid CSRF token should fail with `419`.
  - Use this to test frontend session cookies and CSRF protection for mutating API requests.
