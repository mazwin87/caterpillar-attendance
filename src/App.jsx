import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import Navbar from './components/Navbar'
import Scanner from './components/Scanner'
import Dashboard from './components/Dashboard'
import Students from './components/Students'
import Holidays from './components/Holidays'
import { useLanguage } from './hooks/useLanguage'
import Reports from './components/Reports'
import Events from './components/Events'


export default function App() {
  const { lang, setLang, t } = useLanguage()

  return (
    <BrowserRouter>
      {/* <div style={{ minHeight: '100vh', background: '#0a0a0a', position: 'relative' }}> */}
        <Routes>
          <Route path="/" element={<Navigate to="/scanner" replace />} />
          <Route path="/scanner"   element={<Scanner lang={lang} setLang={setLang} t={t} />} />
          <Route path="/dashboard" element={<Dashboard t={t} />} />
          <Route path="/students"  element={<Students t={t} />} />
          <Route path="/holidays"  element={<Holidays t={t} />} />
          <Route path="/reports"   element={<Reports t={t} />} />
          <Route path="/events"    element={<Events t={t} />} />
        </Routes>
        <Navbar t={t} />
      {/* </div> */}
    </BrowserRouter>
  )
}
