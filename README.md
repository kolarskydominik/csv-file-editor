# CSV Cell Editor

A web application for editing HTML within CSV files. Upload a CSV, select columns containing links, and edit them with a visual interface.

## Features

- 📤 Drag & drop CSV file upload
- 📊 **Google Sheets integration** - Load and edit sheets directly from Google Sheets
- 🔗 Visual link editor with HTML preview
- 📝 Inline editing of CSV cells
- 🧭 Navigation between rows with links
- 💾 Download modified CSV files or save back to Google Sheets
- 🎨 Modern UI with TailwindCSS and React

## Local Development

```bash
# Install dependencies
pnpm install

# Run development server (frontend + backend)
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

The app will be available at:

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Google Sheets Integration Setup

To enable Google Sheets integration (load and save sheets directly):

1. **Set up Google OAuth credentials** - See [GOOGLE_SHEETS_SETUP.md](./GOOGLE_SHEETS_SETUP.md) for detailed instructions
2. **Create a `.env` file** from `.env.example`:
   ```bash
   cp .env.example .env
   ```
3. **Add your Google OAuth credentials** to `.env`
4. **Restart the development server**

The Google Sheets integration allows you to:

- Load sheets directly from Google Sheets URLs (including private sheets)
- Edit HTML links in the sheet
- Save changes back to Google Sheets (only modified cells are updated)
- Or download the modified CSV file

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) or [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for deployment instructions.

### Quick Deploy to Render

1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Connect GitHub repo → Render auto-detects `render.yaml`
4. Deploy!

**Benefits:**

- ✅ No body size limit (handles large CSV files)
- ✅ Persistent state
- ✅ Simple deployment

## Project Structure

```
├── server/           # Express server (serves API + frontend)
│   ├── index.ts      # Main Express app
│   ├── csv-manager.ts # CSV data management
│   └── link-index.ts # Link indexing utilities
├── src/              # React frontend
│   ├── components/   # React components
│   ├── hooks/        # Custom React hooks
│   └── lib/          # Utilities and API client
├── render.yaml       # Render deployment configuration
└── package.json      # Dependencies and scripts
```

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS
- **Backend**: Express.js (serves API + static frontend)
- **CSV Parsing**: PapaParse
- **UI Components**: Shadcn/ui, Radix UI
- **Deployment**: Render

## License

ISC
