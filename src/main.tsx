import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Initialize console log configuration early
import './config/consoleConfig'
// Suppress Google Analytics debug logs if analytics logging is disabled
import './utils/analyticsSuppression'
// Initialize automatic booking completion tracking
import { BookingCompletionService } from './services/bookingCompletionService'
import App from './App'

// Initialize automatic booking completion tracking
BookingCompletionService.initializeAutoCompletion();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
