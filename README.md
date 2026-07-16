# MFCI Command Center

GitHub-ready repository for deployment with **Firebase Hosting**.

## Why Firebase Hosting, not App Hosting

This app is currently a static installable web app. Firebase Hosting is designed for static and single-page web apps. App Hosting is aimed at modern full-stack apps with server-side rendering.

## Repository contents

- Root app files — the static installable web app served by Firebase Hosting
- `firebase.json` — Firebase Hosting configuration
- `database.rules.json` — owner-only Realtime Database rules
- `firebase-config.js` — Firebase web app configuration (public client identifiers)
- `.firebaserc` — MFCI Firebase project selection
- `package.json` — optional Firebase CLI commands

## Deploy from a phone using GitHub and Firebase

### 1. Create the GitHub repository

Create a private GitHub repository named:

`mfci-command-center`

Upload every file and folder from this package to the repository root.

### 2. Find your Firebase Project ID

In Firebase:

Project settings → General → Project ID

The repository is already configured for the `mfci-command-center` Firebase project.

### 3. Use regular Firebase Hosting

In the Firebase console, leave **App Hosting**.

Open:

Build → Hosting

Choose **Get started** for Firebase Hosting.

### 4. Connect GitHub

Use the GitHub integration offered under Firebase Hosting, and select the private `mfci-command-center` repository.

The public directory is the repository root (`.`), matching the current file layout.

This repository does not require a build command because it is already a static app.

### 5. Add the custom domain

After the first deployment:

Hosting → Add custom domain

Use:

`app.mkenterprise.ca`

Firebase will provide DNS records. Add those records at the company where `mkenterprise.ca` is registered.

Do not replace the domain nameservers unless the registrar or Firebase explicitly requires it.

## Installation

### Android

Open the hosted address in Chrome → menu → Install app or Add to Home screen.

### iPhone

Open the hosted address in Safari → Share → Add to Home Screen.

## Current security status

- Email/password authentication is required before the dashboard is shown.
- Only users with an owner record under `/users/{uid}` and `fullAccess: true` are authorized.
- Realtime Database rules deny access by default and restrict the shared `mfci-main` workspace to owners.
- Password reset and persistent/session sign-in controls are included.
- Local data is retained as an offline cache and is synchronized only after owner authorization.

Cloud Storage is not used by the current build. Add Storage rules before introducing file uploads. Add audit logs before employee or subcontractor roles are enabled.

Do not store bank, CRA, or brokerage passwords in the app.
