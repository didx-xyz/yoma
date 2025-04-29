# 🤝 Yoma External Partner API: User Creation

## 📘 Overview

This guide explains how external partners can create users via Yoma's External Partner (B2B) API using the **Client Credentials OAuth2 flow**. It currently covers user creation and supporting reference data endpoints.  

This guide applies to both **Stage** and **Production** environments.

---

## 🔐 Authentication – Client Credentials Flow

The SRE team will provide you with a **Client ID** and **Client Secret** per environment.

To authenticate and obtain a **Bearer Token**, send a `POST` request to the token endpoint.

### 🔑 Token Endpoint URLs

| Environment | URL                                                                  |
|-------------|----------------------------------------------------------------------|
| **Stage**   | `https://stage.yoma.world/auth/realms/yoma/protocol/openid-connect/token` |
| **Prod**    | `https://yoma.world/auth/realms/yoma/protocol/openid-connect/token`       |

### 🟢 Sample cURL

```bash
curl --request POST 'https://yoma.world/auth/realms/yoma/protocol/openid-connect/token' \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'grant_type=client_credentials' \
  --data-urlencode 'client_id=your-client-id' \
  --data-urlencode 'client_secret=your-client-secret'
```

Use the `access_token` returned in the response like this:

```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsIn...
```

---

## 🌍 API Base URLs

All API requests described in this document are made **relative to the base environment URL**:

| Environment | Base URL                                    |
|-------------|---------------------------------------------|
| **Stage**   | `https://v3api.stage.yoma.world/api/v3`     |
| **Prod**    | `https://api.yoma.world/api/v3`             |

Example:  
If an endpoint is documented as `POST /externalpartner/user`, you should send the request to:

- **Stage:** `https://v3api.stage.yoma.world/api/v3/externalpartner/user`  
- **Prod:** `https://api.yoma.world/api/v3/externalpartner/user`

---

## 📥 User Creation – `POST /externalpartner/user`

Creates a new user in both **Yoma** and the **Keycloak Identity Provider**.

### ✅ Required Fields

- `firstName`
- `surname`
- `countryCodeAlpha2`
- `phoneNumber` **OR** `email` (at least one must be provided)

> 💡 **Note:**  
> - Both phone and email are initially unconfirmed  
> - Phone will be verified at first login via OTP  
> - Email (if provided) will trigger a verification email  
> - A strong temporary password is generated automatically  
> - User must change their password on first login  
> - Terms & Conditions are accepted on the user's behalf in Keycloak

---

## 📖 Lookups for Gender & Education

Before creating a user, you must map the correct `educationId` and `genderId`.

Use these anonymous lookup endpoints:

| Purpose         | Endpoint                        |
|-----------------|----------------------------------|
| **Education**   | `GET /lookup/education`          |
| **Gender**      | `GET /lookup/gender`             |

These endpoints return lists of available values and corresponding IDs.

---

## 📦 Request Example – `POST /externalpartner/user`

```json
{
  "firstName": "Naledi",
  "surname": "Tlake",
  "phoneNumber": "+27831234567",
  "countryCodeAlpha2": "ZA",
  "email": "naledi@example.com",
  "displayName": "Naledi Tlake",
  "educationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "genderId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "dateOfBirth": "2005-04-25"
}
```

---

## 📤 Sample Response

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "username": "naledi@example.com",
  "email": "naledi@example.com",
  "emailConfirmed": false,
  "firstName": "Naledi",
  "surname": "Tlake",
  "displayName": "Naledi Tlake",
  "phoneNumber": "+27831234567",
  "phoneNumberConfirmed": false,
  "countryId": "ZA",
  "educationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "genderId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "dateOfBirth": "2005-04-25T00:00:00Z",
  "photoId": null,
  "photoURL": null,
  "dateLastLogin": null,
  "yoIDOnboarded": false,
  "dateYoIDOnboarded": null,
  "settings": {
    "items": []
  },
  "adminsOf": [],
  "zlto": {
    "walletCreationStatus": "Unscheduled",
    "available": 0,
    "pending": 0,
    "total": 0,
    "zltoOffline": true
  },
  "opportunityCountSaved": 0,
  "opportunityCountPending": 0,
  "opportunityCountCompleted": 0,
  "opportunityCountRejected": 0
}
```

---

## ⚠️ Error Codes

| Code | Meaning                                                               |
|------|-----------------------------------------------------------------------|
| 400  | Bad request – missing or invalid fields                              |
| 401  | Unauthorized – missing or invalid token                              |
| 404  | Not Found – endpoint or referenced resource could not be found        |
| 500  | Internal Server Error – unexpected server-side error                 |

---

## 🧠 Tips & Notes

- If both email and phone are provided, **email** will be used as the primary `username`.
- `displayName` is optional; if omitted, the system may infer one.
- Keycloak email verification and OTP phone confirmation happen **only at first login**.
- After user creation, the user must complete **YoID onboarding** to activate reward features and credential issuance.
- This document will be expanded as additional External Partner (B2B) APIs become available.
