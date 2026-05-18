import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { AdminProvider } from './contexts/AdminContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AdminProvider>
        <App />
      </AdminProvider>
    </AuthProvider>
  </StrictMode>,
)
