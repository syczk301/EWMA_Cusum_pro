import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from './components/Layout';
import DataManagement from './pages/DataManagement';
import EWMAChart from './pages/EWMAChart';
import CUSUMChart from './pages/CUSUMChart';
import QualityAnalysis from './pages/QualityAnalysis';
import AlarmManagement from './pages/AlarmManagement';
import SystemSettings from './pages/SystemSettings';
import './index.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/data-management" replace />} />
            <Route path="/data-management" element={<DataManagement />} />
            <Route path="/ewma-chart" element={<EWMAChart />} />
            <Route path="/cusum-chart" element={<CUSUMChart />} />
            <Route path="/quality-analysis" element={<QualityAnalysis />} />
            <Route path="/alarm-management" element={<AlarmManagement />} />
            <Route path="/system-settings" element={<SystemSettings />} />
          </Routes>
        </Layout>
        <Toaster position="top-right" richColors />
      </div>
    </Router>
  );
}

export default App;
