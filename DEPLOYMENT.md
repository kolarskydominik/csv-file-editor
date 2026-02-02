# Deployment Guide: CSV Link Editor to Vercel

## Quick Deployment

1. **Push code to GitHub**

   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite + Express configuration
   - Click "Deploy"

3. **Done!** Your app will be live at `https://your-project.vercel.app`

## How It Works

- **Frontend**: React + Vite app (builds to `dist/`)
- **Backend**: Express app in `/api/index.ts` (becomes a single Vercel Function)
- **State**: Persists within the same function instance (cold starts reset state)

## Local Development

For local development, use the Express server directly:

```bash
pnpm dev
```

This runs:

- Express server on port 3001 (with persistent state)
- Vite dev server on port 5173 (proxies `/api` to Express)

## Production Considerations

For production with multiple users, consider adding:

- **Vercel KV** (Redis) for persistent state
- **Database** (PostgreSQL, MongoDB) for multi-user support

## Project Structure

```
├── api/
│   └── index.ts        # Express app (Vercel serverless function)
├── server/             # Express server (for local dev)
│   ├── csv-manager.ts  # CSV data management
│   └── link-index.ts  # Link indexing utilities
├── src/                # React frontend
└── vercel.json         # Vercel configuration
```
