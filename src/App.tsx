/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { PosSection } from './components/pos/PosSection';
import { ProductsSection } from './components/products/ProductsSection';
import { RestockSection } from './components/restock/RestockSection';
import { SalesHistorySection } from './components/sales/SalesHistorySection';
import { MonthlyBalanceSection } from './components/balance/MonthlyBalanceSection';
import { BackupSection } from './components/backup/BackupSection';
import { StockAlertModal } from './components/common/StockAlertModal';
import { Notifications } from './components/common/Notifications';
import { Store, Loader2 } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { currentSection, loading } = useApp();
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-bold shadow-lg mb-4 animate-bounce">
          <Store className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">SimpControl</h1>
        <p className="text-xs text-gray-500 mt-1">Cargando base de datos local...</p>
        <div className="mt-4 flex items-center gap-2 text-orange-600 text-xs font-semibold">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Iniciando IndexedDB</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Top Header & Navigation */}
      <Header onOpenAlerts={() => setIsAlertsModalOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentSection === 'inicio' && <PosSection />}
        {currentSection === 'productos' && <ProductsSection />}
        {currentSection === 'ingreso' && <RestockSection />}
        {currentSection === 'historial' && <SalesHistorySection />}
        {currentSection === 'balance' && <MonthlyBalanceSection />}
        {currentSection === 'backup' && <BackupSection />}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200/80 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-700">SimpControl</span>
            <span>•</span>
            <span>Simplificador de Control Comercial</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Almacenamiento Local (IndexedDB)</span>
            <span>•</span>
            <span>100% Autónomo</span>
          </div>
        </div>
      </footer>

      {/* Low & Out of Stock Alerts Modal */}
      <StockAlertModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
      />

      {/* Toast Notifications */}
      <Notifications />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
