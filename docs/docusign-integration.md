# DocuSign Integration

This document describes how SolarOps integrates with DocuSign to send, track, and download Power Purchase Agreement (PPA) contracts.

## Overview

The integration allows **ops** users to:

1. Send a PPA contract to a project's customer for e-signature
2. Check the signing status of a sent contract
3. Download the signed PDF once completed

Contract sending is routed through a **Make.com webhook** (which handles template population and envelope creation in DocuSign), while status checks and document downloads call the **DocuSign REST API v2.1** directly.

## Architecture

```
[Frontend]  -->  [Express API]  -->  [Make.com Webhook]  -->  [DocuSign]
                                -->  [DocuSign REST API (status/download)]
```

- **Send contract**: Express -> Make.com webhook -> DocuSign (envelope creation + sending)
- **Check status**: Express -> DocuSign REST API (JWT auth)
- **Download PDF**: Express -> DocuSign REST API (JWT auth)

## Authentication

The service uses the **OAuth 2.0 JWT Bearer Grant** flow to authenticate directly with DocuSign (no user interaction required).

### How it works

1. A JWT is signed locally using the RSA private key with claims including the integration key (client ID) and impersonated user ID
2. The JWT is exchanged for an access token at `https://account-d.docusign.com/oauth/token`
3. The access token is cached in memory for 1 hour (with a 5-minute early-expiry buffer)

### Token payload

| Claim   | Value                              |
|---------|------------------------------------|
| `iss`   | `DOCUSIGN_INTEGRATION_KEY`         |
| `sub`   | `DOCUSIGN_USER_ID`                 |
| `aud`   | `account-d.docusign.com`           |
| `scope` | `signature impersonation`          |
| `exp`   | 1 hour from issuance               |

> **Note**: The current configuration targets the DocuSign **demo/sandbox** environment (`account-d.docusign.com` for auth, `demo.docusign.net` for API calls). For production, these URLs must be updated to `account.docusign.com` and `docusign.net` respectively.

## Environment Variables

| Variable                   | Description                                          |
|----------------------------|------------------------------------------------------|
| `DOCUSIGN_INTEGRATION_KEY` | OAuth client ID (integration key) from DocuSign      |
| `DOCUSIGN_USER_ID`         | User ID of the impersonated DocuSign account         |
| `DOCUSIGN_ACCOUNT_ID`      | DocuSign account ID used in REST API paths           |
| `DOCUSIGN_PRIVATE_KEY`     | RSA private key for JWT signing (PEM format)         |
| `MAKE_WEBHOOK_URL`         | Make.com webhook URL for sending contracts           |
| `MAKE_API_KEY`             | API key sent in `x-make-apikey` header to Make.com   |

## API Endpoints

All endpoints require authentication. Send, check-status, and download are restricted to the **ops** role.

### Send Contract

```
POST /api/projects/:id/send-contract
```

Sends a PPA contract to the project's customer via the Make.com webhook. Creates a `ppa_documents` record with the returned envelope ID.

**Requires**: Project must have a `customerEmail` set.

**Response** (`201`):
```json
{
  "id": 1,
  "projectId": 42,
  "envelopeId": "abc-123-def",
  "status": "sent",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "createdAt": "2026-03-29T...",
  "updatedAt": "2026-03-29T..."
}
```

### List PPA Documents

```
GET /api/projects/:id/ppa-documents
```

Returns all PPA documents for a given project.

**Response** (`200`): Array of `ppa_documents` records.

### Check Envelope Status

```
POST /api/ppa-documents/:id/check-status
```

Queries the DocuSign REST API for the current envelope status and updates the local database record.

**DocuSign API called**:
```
GET /restapi/v2.1/accounts/{accountId}/envelopes/{envelopeId}
```

**Response** (`200`): Updated `ppa_documents` record with refreshed `status`.

### Download Signed Document

```
GET /api/ppa-documents/:id/download
```

Downloads the combined PDF of all documents in the envelope from DocuSign and returns it as an attachment.

**DocuSign API called**:
```
GET /restapi/v2.1/accounts/{accountId}/envelopes/{envelopeId}/documents/combined
```

**Response** (`200`): PDF file with `Content-Disposition: attachment; filename="PPA-{customerName}.pdf"`

## Database Schema

The `ppa_documents` table tracks each sent contract:

| Column          | Type        | Description                                  |
|-----------------|-------------|----------------------------------------------|
| `id`            | serial (PK) | Auto-incrementing primary key                |
| `project_id`    | integer (FK)| References `projects.id`                     |
| `envelope_id`   | text        | DocuSign envelope identifier                 |
| `status`        | text        | Current envelope status (e.g. sent, completed)|
| `customer_name` | text        | Name of the contract recipient               |
| `customer_email`| text        | Email of the contract recipient              |
| `created_at`    | timestamp   | When the record was created                  |
| `updated_at`    | timestamp   | When the record was last updated             |

## Document Lifecycle

```
Send Contract       Check Status         Download
     |                   |                   |
     v                   v                   v
  "sent"  ------>  "delivered"  ------>  "completed"  ------>  PDF
                   "declined"
                   "voided"
```

1. **sent** - Envelope created and email sent to the signer
2. **delivered** - Signer has opened the email/document
3. **completed** - Signer has signed the document (download available)
4. **declined** / **voided** - Signing was refused or cancelled

## Key Files

| File | Purpose |
|------|---------|
| `server/services/docusign.ts` | DocuSign service (auth, status, download) + Make.com webhook call |
| `server/routes.ts` (lines 335-410) | Express route handlers for PPA endpoints |
| `shared/routes.ts` (lines 203-239) | API route type definitions with Zod schemas |
| `shared/schema.ts` (lines 105-114) | Drizzle ORM table definition for `ppa_documents` |
| `server/storage.ts` (lines 272-290) | Database CRUD operations for PPA documents |
| `client/src/pages/projects/detail.tsx` | Frontend UI for contract management |
| `client/src/hooks/use-data.ts` (lines 270-343) | TanStack Query hooks for PPA mutations |

## Production Checklist

- [ ] Replace demo URLs with production DocuSign endpoints
  - Auth: `account-d.docusign.com` -> `account.docusign.com`
  - API: `demo.docusign.net` -> `docusign.net`
- [ ] Generate and configure a production RSA key pair
- [ ] Ensure the DocuSign app has gone through the Go-Live process
- [ ] Update Make.com webhook to production scenario
- [ ] Verify consent has been granted for the impersonated user in production
