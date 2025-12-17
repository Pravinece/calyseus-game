import { useState } from 'react'
import './App.css'
import { Route, Routes, Navigate } from 'react-router-dom'
import Game from './components/Game'
import Login from './components/Login'
import Dashboard from './components/Dashboard'

function App() {

  return (
    <>
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/room/:roomId" element={<Game />} />
      <Route path="/" element={<Navigate to="/app" />} />
    </Routes>
    </>)
}

export default App
