import React from 'react'
import ReactDOM, { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Game from './components/Game.jsx';
import Login from './components/Login.jsx';

const router = createBrowserRouter([
  {
    path: "app",
    element: <Login />,
  },
  {
    path: `app/*`,
    element: <App />,
  },
]);
createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);