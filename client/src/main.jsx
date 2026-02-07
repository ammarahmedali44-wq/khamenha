import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './App.css' // استدعاء ملف التصميم الخاص بنا

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)