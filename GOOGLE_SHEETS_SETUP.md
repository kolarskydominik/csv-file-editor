# Google Sheets Integration Setup Guide

This guide will walk you through setting up Google OAuth credentials to enable Google Sheets integration in the CSV Link Editor.

## Prerequisites

- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com/)

## Step-by-Step Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click **"New Project"**
4. Enter a project name (e.g., "CSV Link Editor")
5. Click **"Create"**
6. Wait for the project to be created, then select it from the dropdown

### Step 2: Enable Google Sheets API

1. In the Google Cloud Console, go to **"APIs & Services"** > **"Library"**
2. Search for **"Google Sheets API"**
3. Click on **"Google Sheets API"**
4. Click **"Enable"**
5. Wait for the API to be enabled (this may take a minute)

### Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** > **"OAuth consent screen"**
2. Select **"External"** (unless you have a Google Workspace account, then you can use "Internal")
3. Click **"Create"**
4. Fill in the required information:
   - **App name**: CSV Link Editor (or your preferred name)
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
5. Click **"Save and Continue"**
6. On the **"Scopes"** page, click **"Add or Remove Scopes"**
7. Add these scopes:
   - `https://www.googleapis.com/auth/spreadsheets.readonly`
   - `https://www.googleapis.com/auth/spreadsheets`
8. Click **"Update"**, then **"Save and Continue"**
9. On the **"Test users"** page (if in testing mode):
   - Click **"Add Users"**
   - Add your Google account email
   - Click **"Add"**
10. Click **"Save and Continue"** through the remaining pages

### Step 4: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** > **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"OAuth client ID"**
4. If prompted, select **"Web application"** as the application type
5. Fill in the form:
   - **Name**: CSV Link Editor Client (or your preferred name)
   - **Authorized JavaScript origins**:
     - For development: `http://localhost:3001`
     - For production: Your production URL (e.g., `https://yourdomain.com`)
   - **Authorized redirect URIs**:
     - For development: `http://localhost:3001/api/google/callback`
     - For production: `https://yourdomain.com/api/google/callback`
6. Click **"Create"**
7. A popup will appear with your **Client ID** and **Client Secret**
   - **IMPORTANT**: Copy these values immediately - you won't be able to see the secret again!
   - You can also download the credentials as JSON

### Step 5: Set Environment Variables

Create a `.env` file in the root of your project (or add to your existing `.env` file):

```env
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:3001/api/google/callback

# Session Secret (generate a random string)
SESSION_SECRET=your-random-session-secret-here

# Frontend URL (for OAuth redirects)
FRONTEND_URL=http://localhost:5173
```

**Important Notes:**

- Replace `your-client-id.apps.googleusercontent.com` with your actual Client ID
- Replace `your-client-secret-here` with your actual Client Secret
- Replace `your-random-session-secret-here` with a secure random string (you can generate one using: `openssl rand -base64 32`)
- Update `FRONTEND_URL` to match your frontend URL (default Vite dev server uses port 5173)

### Step 6: Update .gitignore

Make sure your `.env` file is in `.gitignore` to keep your credentials secure:

```
.env
.env.local
.env.production
```

### Step 7: Restart Your Development Server

After setting up the environment variables:

1. Stop your development server (if running)
2. Start it again:
   ```bash
   pnpm dev
   ```

The server will now load the environment variables and Google Sheets integration will be available.

## Testing the Integration

1. Start your development server:

   ```bash
   pnpm dev
   ```

2. Open the app in your browser (usually `http://localhost:5173`)

3. Click on the **"Google Sheets"** tab in the file upload area

4. Click **"Authenticate with Google"**

5. You should be redirected to Google's OAuth consent screen

6. Sign in with your Google account and grant permissions

7. You'll be redirected back to the app

8. Paste a Google Sheets URL and click **"Load from Google Sheets"**

## Troubleshooting

### "OAuth credentials not configured" warning

- Make sure your `.env` file exists and contains `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Restart your server after adding environment variables
- Check that the variable names match exactly (case-sensitive)

### "Redirect URI mismatch" error

- Verify that the redirect URI in your `.env` file matches exactly what you configured in Google Cloud Console
- Check that `GOOGLE_REDIRECT_URI` includes the full path: `http://localhost:3001/api/google/callback`
- Make sure there are no trailing slashes

### "Access denied" or "Permission denied" errors

- Ensure you've added yourself as a test user in the OAuth consent screen (if app is in testing mode)
- Check that you've granted the required scopes
- Verify that the Google Sheet you're trying to access is shared with your Google account

### "Sheet not found" error

- Verify the Google Sheets URL is correct
- Ensure you have access to the sheet (it should be shared with your Google account)
- Check that the sheet ID in the URL is correct

### Session/Cookie issues

- Make sure `SESSION_SECRET` is set in your `.env` file
- Check that cookies are enabled in your browser
- For production, ensure you're using HTTPS (cookies require secure context in production)

## Production Deployment

For production deployment:

1. **Update OAuth Consent Screen**:
   - Submit your app for verification (if using external user type)
   - Or keep it in testing mode and add all user emails as test users

2. **Update Environment Variables**:

   ```env
   GOOGLE_REDIRECT_URI=https://yourdomain.com/api/google/callback
   FRONTEND_URL=https://yourdomain.com
   SESSION_SECRET=your-production-session-secret
   ```

3. **Update Google Cloud Console**:
   - Add production URLs to "Authorized JavaScript origins"
   - Add production redirect URI to "Authorized redirect URIs"

4. **Security**:
   - Use strong, unique `SESSION_SECRET` in production
   - Enable HTTPS
   - Consider using environment variable management (e.g., Render, Vercel, AWS Secrets Manager)

## Pricing & Quotas

**Good news: Google Sheets API is FREE!** 🎉

Google Sheets API has generous free quotas that should be more than enough for most use cases:

### Free Tier Limits (per day):

- **Read requests**: 500 requests per 100 seconds per user (effectively unlimited for normal use)
- **Write requests**: 300 requests per 100 seconds per user
- **Total requests**: 1,000 requests per 100 seconds per project

### What this means:

- **Reading sheets**: You can read thousands of sheets per day without any cost
- **Writing/saving**: You can save changes hundreds of times per day
- **For most users**: These limits are effectively unlimited for normal editing workflows

### If you exceed quotas:

- Google will return a rate limit error
- You can request quota increases (still free)
- Or wait for the quota window to reset (100 seconds)

### No credit card required:

- Google Cloud Console account is free
- OAuth setup is free
- API usage within quotas is free
- No billing account needed for basic usage

**Note**: If you need higher quotas for enterprise use, you can request increases or upgrade to a paid plan, but for personal or small team use, the free tier is more than sufficient.

## Additional Resources

- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Google Sheets API Quotas](https://developers.google.com/sheets/api/limits)
