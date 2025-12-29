import { useState } from 'react'
import './App.css'
import { Route, Routes, Navigate } from 'react-router-dom'
import GameColyseus from './components/GameColyseus'
import GameSelector from './components/GameSelector'
import Login from './components/Login'
import Dashboard from './components/Dashboard'

function App() {

  return (
    <>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/game/:roomId" element={<GameColyseus />} />
      {/* <Route path="/app" element={<GameSelector />} /> */}
      <Route path="/" element={<Navigate to="/login" />} />
    </Routes>
    </>)
}

export default App
