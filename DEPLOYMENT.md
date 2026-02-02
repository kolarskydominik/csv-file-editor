# Deployment Guide: CSV Link Editor to Render

## Quick Deployment

1. **Push code to GitHub**

   ```bash
   git add .
   git commit -m "Ready for Render deployment"
   git push origin main
   ```

2. **Deploy on Render**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Render will auto-detect `render.yaml`
   - Click "Create Web Service"
   - Wait ~2-5 minutes

3. **Done!** Your app will be live at `https://csv-link-editor.onrender.com`

## How It Works

- **Frontend**: React + Vite app (builds to `dist/`)
- **Backend**: Express server in `server/index.ts` (serves API + frontend)
- **State**: Persists (Express runs continuously in a container)
- **No body size limit**: Unlike Vercel's 4.5MB limit

## Local Development

```bash
pnpm dev
```

This runs:

- Express server on port 3001 (with persistent state)
- Vite dev server on port 5173 (proxies `/api` to Express)

## Project Structure

```
├── server/             # Express server (serves API + frontend)
│   ├── index.ts        # Main Express app
│   ├── csv-manager.ts  # CSV data management
│   └── link-index.ts   # Link indexing utilities
├── src/                # React frontend
├── render.yaml         # Render deployment configuration
└── package.json        # Dependencies and scripts
```

## Benefits

✅ **No body size limit** - Handle large CSV files  
✅ **Persistent state** - Express runs continuously  
✅ **Simple deployment** - One service, not serverless functions  
✅ **Free tier available**

For detailed deployment instructions, see [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md).
