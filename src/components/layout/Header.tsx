import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Section } from '../../types';
import { 
  Menu, 
  X, 
  ShoppingCart, 
  Package, 
  PackagePlus, 
  History, 
  PieChart, 
  Database, 
  AlertTriangle,
  Store
} from 'lucide-react';

interface HeaderProps {
  onOpenAlerts: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAlerts }) => {
  const { currentSection, setCurrentSection, lowStockCount, cartTotalItemsCount } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems: { id: Section; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'inicio', label: 'Inicio y Ventas', icon: <ShoppingCart className="w-4 h-4" />, badge: cartTotalItemsCount },
    { id: 'productos', label: 'Productos y Stock', icon: <Package className="w-4 h-4" /> },
    { id: 'ingreso', label: 'Ingreso de Mercadería', icon: <PackagePlus className="w-4 h-4" /> },
    { id: 'historial', label: 'Historial de Ventas', icon: <History className="w-4 h-4" /> },
    { id: 'balance', label: 'Balance Mensual', icon: <PieChart className="w-4 h-4" /> },
    { id: 'backup', label: 'Exportar / Importar', icon: <Database className="w-4 h-4" /> },
  ];

  const handleSelectSection = (section: Section) => {
    setCurrentSection(section);
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div 
          onClick={() => setCurrentSection('inicio')} 
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold shadow-xs group-hover:bg-orange-600 transition-colors">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-gray-900 group-hover:text-orange-600 transition-colors">
                SimpControl
              </span>
              <span className="hidden sm:inline-flex items-center text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200/60">
                Comercial
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium hidden xs:block">
              Simplificador de Control Comercial
            </p>
          </div>
        </div>

        {/* Center / Desktop quick navigation tabs */}
        <nav className="hidden xl:flex items-center gap-1">
          {menuItems.map((item) => {
            const isActive = currentSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectSection(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all relative ${
                  isActive
                    ? 'bg-orange-50 text-orange-600 font-bold border border-orange-200/70 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-tight">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right action icons & menu toggle */}
        <div className="flex items-center gap-2">
          {/* Stock Alert Badge Button */}
          <button
            onClick={onOpenAlerts}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              lowStockCount > 0
                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
            }`}
            title="Ver productos con stock bajo o agotados"
          >
            <AlertTriangle className={`w-4 h-4 ${lowStockCount > 0 ? 'text-amber-600 animate-pulse' : 'text-gray-400'}`} />
            <span className="hidden sm:inline">Alertas</span>
            {lowStockCount > 0 && (
              <span className="bg-amber-500 text-white text-[11px] px-1.5 py-0.2 rounded-full font-bold">
                {lowStockCount}
              </span>
            )}
          </button>

          {/* Cart quick indicator button (goes to inicio if not there) */}
          <button
            onClick={() => setCurrentSection('inicio')}
            className={`relative flex items-center justify-center p-2 rounded-lg border transition-colors ${
              currentSection === 'inicio' && cartTotalItemsCount > 0
                ? 'bg-orange-50 text-orange-600 border-orange-200'
                : 'text-gray-700 bg-white border-gray-200 hover:bg-gray-50'
            }`}
            title="Ver carrito de venta"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartTotalItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold ring-2 ring-white">
                {cartTotalItemsCount}
              </span>
            )}
          </button>

          {/* Menu button with three horizontal lines */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 transition-colors"
            aria-label="Abrir menú de navegación"
            title="Menú de opciones"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Slide-over / Dropdown Menu from top-right */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-150">
          {/* Backdrop */}
          <div 
            onClick={() => setIsMenuOpen(false)} 
            className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity" 
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-sm bg-white shadow-2xl flex flex-col border-l border-gray-200">
              {/* Header */}
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Menú Principal</h2>
                  <p className="text-xs text-gray-500">SimpControl v1.0</p>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">
                  Secciones del Comercio
                </p>
                {menuItems.map((item, index) => {
                  const isActive = currentSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectSection(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-orange-500 text-white shadow-xs'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={isActive ? 'text-white' : 'text-gray-500'}>
                          {item.icon}
                        </span>
                        <span>{index + 1}. {item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            isActive ? 'bg-white text-orange-600' : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}

                <div className="mt-6 pt-6 border-t border-gray-100 px-3">
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/70 text-xs text-gray-600 space-y-1">
                    <p className="font-semibold text-gray-800">Almacenamiento Local Seguro</p>
                    <p className="text-[11px] text-gray-500">
                      Todos los datos se guardan en tu navegador mediante IndexedDB. Sin servidores externos ni costo.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 bg-gray-50/50 text-center">
                <p className="text-[11px] text-gray-400">
                  SimpControl • Simplificador de Control Comercial
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
