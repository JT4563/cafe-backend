# 🔍 REFRESH TOKEN - DETAILED ANALYSIS & FIX

**Date**: November 7, 2025  
**Issue**: "Invalid refresh token" error when refreshing

---

## ⚠️ THE PROBLEM

### What You're Sending (WRONG):
```json
{
  "refreshToken": "{{eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWhkdXZhZnkwMDAzamp2YW13cG9lenNpIiwiaWF0IjoxNzYyNDkxMTMzLCJleHAiOjE3NjMwOTU5MzN9._BZsexf05XzBG3ZEl4kkXOigIPkSsIUqKTd34c17FYw}}"
}
```

### Why It's Wrong:
- ❌ The `{{` and `}}` are being sent as **literal characters** in the JSON
- ❌ The server receives: `{{eyJhbGc...}}`  instead of just `eyJhbGc...`
- ❌ This is not a valid JWT, so the server rejects it

---

## ✅ THE SOLUTION

### Correct Format for Postman:

**STEP 1**: After successful login/register, you get response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWhkdXZhZnkwMDAzamp2YW13cG9lenNpIiwidGVuYW50SWQiOiJjbWhkdXZhMW0wMDAxamp2YW12N3NqcjFsIiwiZW1haWwiOiJvd25lckBjYWZlbWFzdGVyLmNvbSIsInJvbGUiOiJPV05FUiIsImlhdCI6MTc2MjQ5MTQ5MCwiZXhwIjoxNzYyNTc3ODkwfQ.PlgueLqV-KMdccAHqvQhyspCeDR-1jx7HR-9hlGPwvQ",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWhkdXZhZnkwMDAzamp2YW13cG9lenNpIiwiaWF0IjoxNzYyNDkxMTMzLCJleHAiOjE3NjMwOTU5MzN9._BZsexf05XzBG3ZEl4kkXOigIPkSsIUqKTd34c17FYw",
  "user": { ... }
}
```

**STEP 2**: In Postman **Tests** tab of the login response, add:
```javascript
pm.environment.set("refreshToken", pm.response.json().refreshToken);
pm.environment.set("accessToken", pm.response.json().accessToken);
```

**STEP 3**: Create new POST request to `/api/v1/auth/refresh`

**STEP 4**: In Body tab, set to **raw** JSON:
```json
{
  "refreshToken": "{{refreshToken}}"
}
```

✅ **Now Postman will replace `{{refreshToken}}` with the actual token value**

---

## 🧪 WHAT'S HAPPENING WITH YOUR TOKEN

### Your Access Token (Currently Valid):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
.eyJ1c2VySWQiOiJjbWhkdXZhZnkwMDAzamp2YW13cG9lenNpIiwidGVuYW50SWQiOiJjbWhkdXZhMW0wMDAxamp2YW12N3NqcjFsIiwiZW1haWwiOiJvd25lckBjYWZlbWFzdGVyLmNvbSIsInJvbGUiOiJPV05FUiIsImlhdCI6MTc2MjQ5MTQ5MCwiZXhwIjoxNzYyNTc3ODkwfQ
.PlgueLqV-KMdccAHqvQhyspCeDR-1jx7HR-9hlGPwvQ
```

**Decoded Payload**:
```json
{
  "userId": "cmhduvafy0003jjvamwpoezsi",
  "tenantId": "cmhduva1m0001jjvamv7sjr1l",
  "email": "owner@cafemaster.com",
  "role": "OWNER",
  "iat": 1762491490,    // Nov 7, 2025 04:58:10
  "exp": 1762577890     // Nov 8, 2025 04:58:10 (24 hours)
}
```

✅ **This token is VALID and NOT expired**

---

### Your Refresh Token:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
.eyJ1c2VySWQiOiJjbWhkdXZhZnkwMDAzamp2YW13cG9lenNpIiwiaWF0IjoxNzYyNDkxMTMzLCJleHAiOjE3NjMwOTU5MzN9
._BZsexf05XzBG3ZEl4kkXOigIPkSsIUqKTd34c17FYw
```

**Decoded Payload**:
```json
{
  "userId": "cmhduvafy0003jjvamwpoezsi",
  "iat": 1762491133,    // Nov 7, 2025 04:52:13
  "exp": 1763095933     // Nov 14, 2025 04:52:13 (7 days)
}
```

✅ **This token is VALID and NOT expired**

---

## 🔍 WHY THE ERROR OCCURS

### In Your Current Postman Request:

**What you're sending to server**:
```json
{
  "refreshToken": "{{eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWhkdXZhZnkwMDAzamp2YW13cG9lenNpIiwiaWF0IjoxNzYyNDkxMTMzLCJleHAiOjE3NjMwOTU5MzN9._BZsexf05XzBG3ZEl4kkXOigIPkSsIUqKTd34c17FYw}}"
}
```

**Server receives**:
```
refreshToken = "{{eyJhbGc...}}"
```

**Server tries to verify JWT**:
```
jwt.verify("{{eyJhbGc...}}", SECRET)
```

❌ **FAILS** - This is not a valid JWT format (has extra `{{` and `}}`)

**Error**: "Invalid refresh token"

---

## ✅ CORRECT POSTMAN SETUP

### Option A: Using Postman Variables (RECOMMENDED)

**In Login Response > Tests tab**:
```javascript
pm.environment.set("refreshToken", pm.response.json().refreshToken);
```

**In Refresh Token Request > Body**:
```json
{
  "refreshToken": "{{refreshToken}}"
}
```

✅ Postman substitutes before sending

---

### Option B: Copy-Paste Token Directly

**In Refresh Token Request > Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWhkdXZhZnkwMDAzamp2YW13cG9lenNpIiwiaWF0IjoxNzYyNDkxMTMzLCJleHAiOjE3NjMwOTU5MzN9._BZsexf05XzBG3ZEl4kkXOigIPkSsIUqKTd34c17FYw"
}
```

✅ No variable substitution needed

---

## 🧬 TOKEN VALIDATION FLOW

### When server receives valid token:

```
1. Client sends:
   {
     "refreshToken": "eyJhbGc..."
   }

2. Server validates JWT:
   - Checks 3 parts (header.payload.signature)
   - Verifies signature using REFRESH_SECRET
   - Checks expiration (exp: 1763095933)

3. If valid:
   - Looks up user in database
   - Generates NEW accessToken
   - Returns to client

4. If invalid:
   - Returns 500 with message: "Invalid refresh token"
```

---

## 🛠️ DEBUGGING CHECKLIST

| Check | Status | How to Fix |
|-------|--------|-----------|
| Token has `{{}}` braces | ❌ YES | Remove the braces - they're Postman syntax, not part of the token |
| Token format is valid JWT | ✅ YES | Has 3 parts separated by dots |
| Token is expired | ❌ NO | Expires Nov 14, 2025 - still valid |
| Token payload is correct | ✅ YES | Contains userId and expiration |
| Server is running | ? | Check terminal for "listening on port 4000" |
| Content-Type header | ? | Must be `application/json` |

---

## 🚀 QUICK FIX

### In Postman:

1. **Clear** the current body
2. **Change** from:
   ```json
   {
     "refreshToken": "{{eyJhbGc...}}"
   }
   ```
   
   To:
   ```json
   {
     "refreshToken": "eyJhbGc..."
   }
   ```

3. **Remove** the `{{` and `}}` around the token
4. **Click Send**

✅ **Expected response** (200 OK):
```json
{
  "accessToken": "eyJhbGc..."
}
```

---

## 📊 REQUEST vs RESPONSE

### ❌ WRONG (What you're doing):
```
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "{{eyJhbGc...}}"  ← Extra braces!
}

→ Response: {"error": "Invalid refresh token"}
```

### ✅ CORRECT (What you should do):
```
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."  ← Just the token
}

→ Response: {"accessToken": "eyJhbGc..."}
```

---

## 💡 POSTMAN PRO TIPS

### Auto-Save Tokens from Login:

**1. Open Login endpoint**
2. **Go to Tests tab**
3. **Add this code**:
```javascript
var jsonData = pm.response.json();
pm.environment.set("accessToken", jsonData.accessToken);
pm.environment.set("refreshToken", jsonData.refreshToken);
pm.environment.set("tenantId", jsonData.user.tenantId);
pm.environment.set("userId", jsonData.user.id);
```

### Use Tokens in Other Requests:

**Authorization header** (for protected routes):
```
Authorization: Bearer {{accessToken}}
```

**Refresh token body**:
```json
{
  "refreshToken": "{{refreshToken}}"
}
```

**Tenant ID in URL**:
```
/menu/{{tenantId}}
```

---

## ✅ SUMMARY

| Item | Your Issue | Solution |
|------|-----------|----------|
| **Format** | `{{token}}` | Change to `token` |
| **Token validity** | ✅ Valid | No change needed |
| **Expiration** | ✅ Not expired | Valid until Nov 14 |
| **Postman setup** | ❌ Wrong syntax | Use environment variables |
| **Fix** | Remove `{{}}` | Copy-paste or use variables |

---

**Status**: 🔴 **ISSUE: Formatting error in JSON body**

**Fix Difficulty**: ⚡ **EASY** - Just remove the extra `{{}}` braces

**Next Step**: 
1. Remove `{{` and `}}` from the token in your Postman request body
2. Click Send
3. ✅ Should work!

