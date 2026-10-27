import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { X, SlidersHorizontal, AlertCircle, Check } from 'lucide-react';

interface AdjustStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onConfirm: (productId: string, newStock: number, reason: string) => Promise<any>;
}

export const AdjustStockModal: React.FC<AdjustStockModalProps> = ({
  isOpen,
  onClose,
  product,
  onConfirm,
}) => {
  const [newStock, setNewStock] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setNewStock(String(product.currentStock));
      setReason('');
      setError(null);
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const numNew = parseInt(newStock, 10);
  const diff = isNaN(numNew) ? 0 : numNew - product.currentStock;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isNaN(numNew) || numNew < 0) {
      setError('La nueva cantidad debe ser un número entero no negativo (0 o mayor).');
      return;
    }

    if (!reason.trim()) {
      setError('El motivo del ajuste es obligatorio para auditoría.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirm(product.id, numNew, reason.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al registrar el ajuste de existencias.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Ajuste Manual de Inventario</h3>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current vs New comparison */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-200">
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase">Stock Registrado</p>
              <p className="text-xl font-extrabold text-gray-900 font-mono mt-0.5">
                {product.currentStock} <span className="text-xs font-normal text-gray-500">unidades</span>
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase">Diferencia</p>
              <p
                className={`text-xl font-extrabold font-mono mt-0.5 ${
                  diff > 0
                    ? 'text-emerald-600'
                    : diff < 0
                    ? 'text-rose-600'
                    : 'text-gray-500'
                }`}
              >
                {diff > 0 ? `+${diff}` : diff} <span className="text-xs font-normal">unidades</span>
              </p>
            </div>
          </div>

          {/* New Stock Input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Nueva Cantidad Física Real *
            </label>
            <input
              type="number"
              min="0"
              required
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-base font-bold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              placeholder="Ingresa el conteo físico exacto"
            />
            <span className="text-[11px] text-gray-400 mt-1 block">
              Este valor reemplazará el stock actual y quedará auditado en el historial.
            </span>
          </div>

          {/* Motivo Obligatorio */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Motivo del Ajuste (Obligatorio) *
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Conteo físico mensual, rotura accidental, mercadería dañada o vencida..."
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? 'Guardando Ajuste...' : 'Confirmar Ajuste'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
