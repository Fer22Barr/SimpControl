import React, { useState, useEffect } from 'react';
import { Product, Movement } from '../../types';
import { dbService } from '../../services/db';
import { formatDateTime } from '../../utils/formatters';
import { X, History, ArrowUpRight, ArrowDownRight, RefreshCw, PlusCircle, AlertCircle } from 'lucide-react';

interface ProductMovementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export const ProductMovementsModal: React.FC<ProductMovementsModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      setLoading(true);
      dbService
        .getMovements(product.id)
        .then((res) => setMovements(res))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const getMovementBadge = (type: Movement['type']) => {
    switch (type) {
      case 'existencia_inicial':
        return {
          label: 'Existencia Inicial',
          icon: <PlusCircle className="w-3.5 h-3.5 text-blue-600" />,
          color: 'bg-blue-50 text-blue-800 border-blue-200',
        };
      case 'ingreso_mercaderia':
        return {
          label: 'Ingreso / Reposición',
          icon: <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />,
          color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        };
      case 'venta':
        return {
          label: 'Venta',
          icon: <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />,
          color: 'bg-rose-50 text-rose-800 border-rose-200',
        };
      case 'anulacion_venta':
        return {
          label: 'Anulación de Venta',
          icon: <RefreshCw className="w-3.5 h-3.5 text-amber-600" />,
          color: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      case 'ajuste_manual':
        return {
          label: 'Ajuste Manual',
          icon: <AlertCircle className="w-3.5 h-3.5 text-purple-600" />,
          color: 'bg-purple-50 text-purple-800 border-purple-200',
        };
      default:
        return {
          label: type,
          icon: null,
          color: 'bg-gray-100 text-gray-800',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Historial de Movimientos</h3>
              <p className="text-xs text-gray-500 font-mono">{product.id} • {product.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current stock status banner */}
        <div className="px-6 py-3 bg-orange-50/50 border-b border-orange-100/60 flex items-center justify-between text-xs">
          <span className="text-gray-600">
            Stock actual: <strong className="text-gray-900 font-mono">{product.currentStock} unidades</strong>
          </span>
          <span className="text-gray-500">
            Mínimo configurable: <strong className="text-gray-900 font-mono">{product.minStock} unidades</strong>
          </span>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto flex-1 divide-y divide-gray-100">
          {loading ? (
            <div className="py-12 text-center text-xs text-gray-400">Cargando movimientos...</div>
          ) : movements.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">
              No hay movimientos registrados para este producto.
            </div>
          ) : (
            movements.map((mov) => {
              const badge = getMovementBadge(mov.type);
              const change = mov.newStock - mov.previousStock;

              return (
                <div key={mov.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${badge.color}`}
                      >
                        {badge.icon}
                        {badge.label}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">
                        {formatDateTime(mov.timestamp)}
                      </span>
                    </div>

                    {mov.reason && (
                      <p className="text-xs text-gray-600 italic">
                        &ldquo;{mov.reason}&rdquo;
                      </p>
                    )}

                    {mov.saleId && (
                      <p className="text-[11px] font-mono text-gray-500">
                        Ref: {mov.saleId}
                      </p>
                    )}
                  </div>

                  {/* Stock transition */}
                  <div className="text-right shrink-0">
                    <div className="flex items-center justify-end gap-1.5 font-mono text-xs">
                      <span className="text-gray-400">{mov.previousStock}</span>
                      <span className="text-gray-300">→</span>
                      <span className="font-bold text-gray-900">{mov.newStock} u.</span>
                    </div>
                    <span
                      className={`text-xs font-bold font-mono ${
                        change > 0 ? 'text-emerald-600' : change < 0 ? 'text-rose-600' : 'text-gray-500'
                      }`}
                    >
                      {change > 0 ? `+${change}` : change} u.
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
