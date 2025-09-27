import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './styles.css'
import App from './App.jsx'
import Submit from './pages/Submit.jsx'
import Admin from './pages/Admin.jsx'
import Presentation from './pages/Presentation.jsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Submit /> },
      { path: 'submit', element: <Submit /> },
      { path: 'admin', element: <Admin /> },
      { path: 'present', element: <Presentation /> }
    ]
  }
])

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
