
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import PriceAnalysis from './pages/PriceAnalysis';
import StrategyConfig from './pages/StrategyConfig';
import DataCollection from './pages/DataCollection';
import AgentAssistant from './components/AgentAssistant';
import { AppProvider } from './contexts/AppContext';

const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <div className="flex min-h-screen bg-slate-50">
          <Sidebar />
          <div className="flex-1 ml-64">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/analysis" element={<PriceAnalysis />} />
              <Route path="/config" element={<StrategyConfig />} />
              <Route path="/data" element={<DataCollection />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <AgentAssistant />
        </div>
      </Router>
    </AppProvider>
  );
};

export default App;