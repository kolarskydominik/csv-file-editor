# CSV Link Editor

A web application for editing HTML links within CSV files. Upload a CSV, select columns containing links, and edit them with a visual interface.

## Features

- 📤 Drag & drop CSV file upload
- 🔗 Visual link editor with HTML preview
- 📝 Inline editing of CSV cells
- 🧭 Navigation between rows with links
- 💾 Download modified CSV files
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

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions to Vercel.

### Quick Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel dashboard
3. Vercel will auto-detect Vite configuration
4. Deploy!

## Project Structure

```
├── api/              # Vercel serverless functions
├── server/           # Express server (for local dev)
├── src/              # React frontend
│   ├── components/   # React components
│   ├── hooks/        # Custom React hooks
│   └── lib/          # Utilities and API client
└── vercel.json       # Vercel configuration
```

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS
- **Backend**: Express (local) / Vercel Serverless Functions (production)
- **CSV Parsing**: PapaParse
- **UI Components**: Shadcn/ui, Radix UI

## License

ISC
