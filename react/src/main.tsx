import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './components/pages/home'
import Login from './components/login'
import Signup from './components/signup'
import DashboardLayout from './components/dashboard/DashboardLayout'
import AuthGuard from './components/auth-guard'
import EMRDashboard from './components/dashboard/emr-dashboard'
import ICD11Sidebar from './components/dashboard/icd11'
import SettingsPage from './components/dashboard/settings'
import ReportsPage from './components/dashboard/ReportsPage'
import AuthProvider from '@/lib/auth'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

  <Route path="/dashboard" element={<AuthGuard><DashboardLayout /></AuthGuard>}>
          <Route index element={<EMRDashboard />} />
          <Route path="icd11" element={<ICD11Sidebar />} />
          <Route path="patients" element={<ICD11Sidebar />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

      </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
