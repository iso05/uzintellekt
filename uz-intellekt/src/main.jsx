import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import './assets/styles/index.css'
import './i18n' // 🌍 i18n ishlashi uchun
import i18n from './i18n'
console.log("i18n resources:", i18n.services?.resourceStore?.data || i18n.store?.data)
console.log("i18n current language:", i18n.language)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
