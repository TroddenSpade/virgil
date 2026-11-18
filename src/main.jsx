import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AccountProvider } from './lib/account.jsx'
import './styles/fonts.css'
import './styles/theme.css'
import './styles/global.css'
import './styles/components.css'
import './styles/tabula.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AccountProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <App />
      </BrowserRouter>
    </AccountProvider>
  </StrictMode>,
)
