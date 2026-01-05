---
description: How to configure Google OAuth for Supabase
---

# Setting up Google Login

To make the "Sign in with Google" button work, you need to configure your Supabase project.

## Step 1: Create Google Cloud Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your project (or create a new one).
3. Navigate to **APIs & Services** > **OAuth consent screen**.
   - Select **External** and click **Create**.
   - Fill in the required app information (App name, User support email, Developer contact information).
   - Click **Save and Continue**.
4. Navigate to **Credentials**.
   - Click **Create Credentials** > **OAuth client ID**.
   - Application type: **Web application**.
   - Name: `Supabase Auth`.
   - **Authorized redirect URIs**: You need your Supabase Project URL for this.
     - Go to Supabase Dashboard > Authentication > Providers > Google to find the "Callback URL (for OAuth)".
     - It typically looks like: `https://<project-id>.supabase.co/auth/v1/callback`.
   - Click **Create**.
5. Copy your **Client ID** and **Client Secret**.

## Step 2: Configure Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project.
3. Navigate to **Authentication** > **Providers**.
4. Click on **Google** to expand the settings.
5. Toggle **Enable Sign in with Google** to ON.
6. Paste your **Client ID** and **Client Secret** from the previous step.
7. Click **Save**.

## Step 3: Local Environment Setup

1. In your project folder (`c:\Users\ACER\Desktop\WSA\safe-haven-web-1`), create a new file named `.env`.
2. Copy the contents from `.env.example` into `.env`.
3. Allow the app to restart (or run `npm run dev` again).
4. Fill in your Supabase credentials in `.env`:
   ```env
   VITE_SUPABASE_URL=your_project_url_from_supabase_settings
   VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_from_supabase_settings
   ```
   *(You can find these in Supabase Dashboard > Settings > API)*

## Step 4: Test

1. Restart your development server: `npm run dev`.
2. Go to the login page.
3. Click **Sign in with Google**.
