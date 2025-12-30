import React from 'react'
import ReactDOM from 'react-dom/client'

// --- GITHUB SETUP INSTRUCTIONS ---
// When you upload this file to GitHub in the 'src' folder:
// 1. Uncomment the import line below
// 2. Uncomment the ReactDOM block below
// 3. Ensure this file is named 'main.jsx' inside the 'src' folder

import App from './App.jsx' 
import './index.css'


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)