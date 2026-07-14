# MFCI Command Center

GitHub-ready repository for deployment with **Firebase Hosting**.

## Why Firebase Hosting, not App Hosting

This app is currently a static installable web app. Firebase Hosting is designed for static and single-page web apps. App Hosting is aimed at modern full-stack apps with server-side rendering.

## Repository contents

- `public/` — the app files
- `firebase.json` — Firebase Hosting configuration
- `.firebaserc` — Firebase project ID placeholder
- `package.json` — optional Firebase CLI commands

## Deploy from a phone using GitHub and Firebase

### 1. Create the GitHub repository

Create a private GitHub repository named:

`mfci-command-center`

Upload every file and folder from this package to the repository root.

### 2. Find your Firebase Project ID

In Firebase:

Project settings → General → Project ID

Edit `.firebaserc` and replace:

`REPLACE_WITH_YOUR_FIREBASE_PROJECT_ID`

with the exact Project ID.

### 3. Use regular Firebase Hosting

In the Firebase console, leave **App Hosting**.

Open:

Build → Hosting

Choose **Get started** for Firebase Hosting.

### 4. Connect GitHub

Use the GitHub integration offered under Firebase Hosting, and select the private `mfci-command-center` repository.

Set the public directory to:

`public`

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

The app still supports local mode and optional Firebase configuration entered inside the interface. Before subcontractor access, invoice uploads, customer records, or shared cloud use, add:

- Firebase Authentication
- protected database rules
- Cloud Storage rules
- user roles
- audit logs

Do not store bank, CRA, or brokerage passwords in the app.
