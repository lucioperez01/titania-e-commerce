# Manual Testing Checklist — Auth Middleware Fix

Run these checks after the build passes (`npm run build`).
Start the dev server with `npm run dev` and verify each scenario.

## Pre-requisites

- [ ] `npm run build` completes without E900 or other errors
- [ ] `ADMIN_EMAIL` is set in `.env.local` (e.g., `ADMIN_EMAIL=admin@titania.com`)
- [ ] Google OAuth credentials are configured (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
- [ ] At least one ADMIN user exists in the database (matching `ADMIN_EMAIL`)
- [ ] At least one regular USER exists in the database

## 1. Admin Login — Credentials

- [ ] Navigate to `/login`
- [ ] Enter admin email + password
- [ ] Click "Iniciar sesión"
- [ ] **Expected**: Redirect to `/dashboard`
- [ ] Dashboard sidebar renders correctly

## 2. Admin Login — Google OAuth

- [ ] Navigate to `/login`
- [ ] Click "Continuar con Google"
- [ ] Complete Google consent flow with admin account
- [ ] **Expected**: Redirect to `/dashboard`
- [ ] Dashboard renders correctly

## 3. Regular User Login — Credentials

- [ ] Navigate to `/login`
- [ ] Enter regular user email + password
- [ ] Click "Iniciar sesión"
- [ ] **Expected**: Redirect to `/` (home page)
- [ ] User sees the storefront, NOT the dashboard

## 4. Regular User Login — Google OAuth

- [ ] Navigate to `/login`
- [ ] Click "Continuar con Google"
- [ ] Complete Google consent flow with non-admin account
- [ ] **Expected**: Redirect to `/` (home page)

## 5. Login with callbackUrl — Credentials

- [ ] Navigate to `/login?callbackUrl=/dashboard`
- [ ] Enter admin credentials
- [ ] Click "Iniciar sesión"
- [ ] **Expected**: Redirect to `/dashboard` (callbackUrl respected)

## 6. Login with callbackUrl — Google OAuth

- [ ] Navigate to `/login?callbackUrl=/dashboard/products`
- [ ] Click "Continuar con Google"
- [ ] Complete OAuth with admin account
- [ ] **Expected**: Redirect to `/dashboard/products`

## 7. Unauthenticated Dashboard Access

- [ ] Clear cookies / use incognito
- [ ] Navigate directly to `/dashboard`
- [ ] **Expected**: Redirect to `/login?callbackUrl=%2Fdashboard`
- [ ] After login as admin, should land on `/dashboard`

## 8. Unauthenticated Nested Dashboard Route

- [ ] Clear cookies / use incognito
- [ ] Navigate directly to `/dashboard/create-product`
- [ ] **Expected**: Redirect to `/login?callbackUrl=%2Fdashboard%2Fcreate-product`

## 9. Non-Admin Dashboard Access

- [ ] Login as regular USER
- [ ] Manually navigate to `/dashboard`
- [ ] **Expected**: Redirect to `/` (home page)

## 10. /dashboard/create-product Route Protection

- [ ] Login as admin
- [ ] Navigate to `/dashboard/create-product`
- [ ] **Expected**: Page renders (redirects to `/dashboard/products`)
- [ ] Dashboard layout (sidebar + header) is visible

## 11. No Orphaned /create-product Links

- [ ] Login as admin
- [ ] Navigate through the dashboard
- [ ] **Expected**: All "create product" links point to `/dashboard/create-product`, NOT `/create-product`

## 12. Build Verification

- [ ] `npm run build` completes without error E900
- [ ] No "dual middleware" error
- [ ] No cookie resolution warnings in console

## 13. Session Cookie Behavior

- [ ] In dev: cookie name should be `authjs.session-token`
- [ ] In prod: cookie name should be `__Secure-authjs.session-token`
- [ ] No references to old `next-auth.session-token` (v4) cookie names
