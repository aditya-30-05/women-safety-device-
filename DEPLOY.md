# Deployment Guide for SafeHer

Your web application is now ready for deployment. Follow these steps to deploy it to popular static hosting platforms.

## Prerequisites

Ensure you have your environment variables ready:

1.  `VITE_SUPABASE_URL`
2.  `VITE_SUPABASE_PUBLISHABLE_KEY`
3.  `VITE_GOOGLE_MAPS_API_KEY`

## Option 1: Deploy to Netlify (Recommended)

1.  Fork or push this repository to your GitHub/GitLab/Bitbucket account.
2.  Log in to [Netlify](https://www.netlify.com/).
3.  Click **"Add new site"** -> **"Import an existing project"**.
4.  Connect your Git provider and select this repository.
5.  **Build Settings** (should be auto-detected):
    *   **Build command:** `npm run build`
    *   **Publish directory:** `dist`
6.  **Environment variables:**
    *   Click "Add environment variable" and add the 3 keys from the Prerequisites section.
7.  Click **"Deploy site"**.

*Note: A `netlify.toml` file has been added to handle SPA routing automatically.*

## Option 2: Deploy to Vercel

1.  Navigate to the directory in your terminal.
2.  Run `npx vercel` (you may need to log in).
3.  Follow the prompts. Use default settings for Vite.
4.  When asked about Environment Variables, you can add them via the CLI or later in the Vercel Dashboard under **Settings > Environment Variables**.

*Note: A `vercel.json` file has been added to handle SPA routing automatically.*

## Option 3: Manual Deployment (Any Static Host)

1.  Run the build command locally:
    ```bash
    npm run build
    ```
2.  The output will be in the `dist` folder.
3.  Upload the contents of the `dist` folder to any static hosting service (Firebase Hosting, GitHub Pages, AWS S3, etc.).
4.  **Important:** Configure your host to rewrite all 404s to `index.html` to support Client-Side Routing.

## Testing Production Build Locally

To preview what the deployed app will look like:

```bash
npm run build
npm run preview
```
