import React from 'react';
import { useApp } from '../../context/AppContext';
import { AlertTriangle, AlertOctagon, X, ArrowRight, Package } from 'lucide-react';

interface StockAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StockAlertModal: React.FC<StockAlertModalProps> = ({ isOpen, onClose }) => {
  const { lowStockProducts, outOfStockProducts, setSelectedProductForRestock, setCurrentSection } = useApp();

  if (!isOpen) return null;

  const totalAlerts = lowStockProducts.length + outOfStockProducts.length;

  const handleRestock = (product: any) => {
    setSelectedProductForRestock(product);
    setCurrentSection('ingreso');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-amber-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Alertas de Stock ({totalAlerts})
              </h3>
              <p className="text-xs text-gray-500">
                Productos con existencias agotadas o inferiores al nivel mínimo requerido
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-4 divide-y divide-gray-100">
          {totalAlerts === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Package className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-gray-800">Todo el inventario está en niveles óptimos</p>
              <p className="text-xs text-gray-500 mt-1">No hay productos que requieran reposición urgente.</p>
            </div>
          ) : (
            <>
              {/* Agotados */}
              {outOfStockProducts.length > 0 && (
                <div className="pt-2 first:pt-0 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 uppercase tracking-wider">
                    <AlertOctagon className="w-4 h-4 text-rose-600" />
                    <span>Productos Agotados ({outOfStockProducts.length})</span>
                  </div>
                  <div className="space-y-2">
                    {outOfStockProducts.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-rose-50/70 border border-rose-200"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-medium text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded">
                              {p.id}
                            </span>
                            <span className="font-semibold text-sm text-gray-900">{p.name}</span>
                          </div>
                          <p className="text-xs text-rose-700 mt-1 font-medium">
                            Producto agotado. 0 unidades disponibles (Mínimo: {p.minStock}).
                          </p>
                        </div>
                        <button
                          onClick={() => handleRestock(p)}
                          className="shrink-0 flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-xs"
                        >
                          Reponer
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bajo Stock */}
              {lowStockProducts.length > 0 && (
                <div className="pt-4 first:pt-0 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Productos con Stock Bajo ({lowStockProducts.length})</span>
                  </div>
                  <div className="space-y-2">
                    {lowStockProducts.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50/70 border border-amber-200"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-medium text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                              {p.id}
                            </span>
                            <span className="font-semibold text-sm text-gray-900">{p.name}</span>
                          </div>
                          <p className="text-xs text-amber-800 mt-1">
                            Advertencia: Quedan <span className="font-bold">{p.currentStock} unidades</span> disponibles. Nivel mínimo: {p.minStock}. Se recomienda reponer mercadería.
                          </p>
                        </div>
                        <button
                          onClick={() => handleRestock(p)}
                          className="shrink-0 flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-xs"
                        >
                          Reponer
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
