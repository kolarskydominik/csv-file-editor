import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from './components/theme-provider'
import './styles.css'
import App from './app'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="csv-editor-theme">
      <App />
    </ThemeProvider>
  </StrictMode>,
)
