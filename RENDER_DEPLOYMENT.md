# Deploy to Render

## Quick Deployment Steps

### 1. Push Code to GitHub

```bash
git add .
git commit -m "Configure for Render deployment"
git push origin main
```

### 2. Deploy on Render

1. **Go to [render.com](https://render.com)** and sign up/login
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**
   - Select your `csv-link-editor` repository
   - Render will auto-detect `render.yaml`
4. **Review Settings** (should be auto-filled from `render.yaml`):
   - **Name**: csv-link-editor
   - **Environment**: Node
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `pnpm start`
   - **Environment Variables**:
     - `NODE_ENV=production` (auto-set)
     - `PORT` (auto-set by Render)
5. **Click "Create Web Service"**
6. **Wait for deployment** (~2-5 minutes)

### 3. Your App is Live! 🎉

Your app will be available at: `https://csv-link-editor.onrender.com` (or your custom domain)

## How It Works

- **Express server** runs continuously (no cold starts!)
- **Serves API** at `/api/*` routes
- **Serves React frontend** at all other routes
- **No body size limit** (unlike Vercel's 4.5MB)
- **State persists** (Express runs in a container)

## Configuration Files

- `render.yaml` - Render deployment configuration
- `server/index.ts` - Express server (serves API + frontend)
- `package.json` - Contains `start` script

## Environment Variables

Render automatically sets:

- `NODE_ENV=production`
- `PORT` (assigned by Render)

No additional environment variables needed!

## Troubleshooting

### Build Fails

- Check build logs in Render dashboard
- Ensure `pnpm` is available (Render supports it)
- Verify all dependencies are in `package.json`

### App Doesn't Start

- Check logs in Render dashboard
- Verify `pnpm start` command works locally
- Ensure `tsx` is in dependencies (it is!)

### 404 Errors

- Verify `dist/` folder is created during build
- Check that static file serving is working
- Review Express routes in `server/index.ts`

## Benefits Over Vercel

✅ **No 4.5MB body size limit**  
✅ **Persistent state** (Express runs continuously)  
✅ **Simpler deployment** (one service, not serverless functions)  
✅ **Free tier available**  
✅ **Better for large files**

## Next Steps

After deployment:

1. Test uploading a CSV file
2. Verify all features work
3. Check logs if any issues occur

Your app is ready to handle large CSV files! 🚀
