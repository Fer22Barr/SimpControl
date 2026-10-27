import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { calculateGrossMargin, formatPercentage, formatCurrency } from '../../utils/formatters';
import { X, Save, AlertCircle } from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    costPrice: number;
    sellPrice: number;
    initialStock: number;
    minStock: number;
  }) => Promise<any>;
  productToEdit?: Product | null;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
}) => {
  const [name, setName] = useState('');
  const [costPrice, setCostPrice] = useState<string>('0');
  const [sellPrice, setSellPrice] = useState<string>('0');
  const [initialStock, setInitialStock] = useState<string>('0');
  const [minStock, setMinStock] = useState<string>('5');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setCostPrice(String(productToEdit.costPrice));
      setSellPrice(String(productToEdit.sellPrice));
      setInitialStock(String(productToEdit.currentStock));
      setMinStock(String(productToEdit.minStock));
    } else {
      setName('');
      setCostPrice('0');
      setSellPrice('0');
      setInitialStock('0');
      setMinStock('5');
    }
    setError(null);
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const numCost = parseFloat(costPrice) || 0;
  const numSell = parseFloat(sellPrice) || 0;
  const liveMargin = calculateGrossMargin(numCost, numSell);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('El nombre del producto es obligatorio.');
      return;
    }

    if (numCost < 0 || numSell < 0) {
      setError('Los precios deben ser valores no negativos.');
      return;
    }

    const numInitial = parseInt(initialStock, 10);
    const numMin = parseInt(minStock, 10);

    if (isNaN(numInitial) || numInitial < 0) {
      setError('La cantidad de existencias debe ser un número entero no negativo.');
      return;
    }

    if (isNaN(numMin) || numMin < 0) {
      setError('El stock mínimo debe ser un número entero no negativo.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        name: name.trim(),
        costPrice: numCost,
        sellPrice: numSell,
        initialStock: numInitial,
        minStock: numMin,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el producto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col h-[506px]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70 shrink-0">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {productToEdit ? 'Modificar Producto' : 'Nuevo Producto'}
            </h3>
            <p className="text-xs text-gray-500">
              {productToEdit
                ? `Editando ${productToEdit.id} (${productToEdit.name})`
                : 'Registrar un nuevo producto en el catálogo comercial'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Nombre del Producto *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Mate de algarrobo artesanal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Precio de Costo Unitario ($) *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Valor: {formatCurrency(numCost)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Precio de Venta Unitario ($) *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Valor: {formatCurrency(numSell)}
              </span>
            </div>
          </div>

          {/* Dynamic Gross Margin Calculation Card */}
          <div className="p-3.5 rounded-xl bg-orange-50/60 border border-orange-200/70 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-orange-900">Margen Bruto Calculado</p>
              <p className="text-[11px] text-orange-700/80">
                [(Precio Venta - Precio Costo) / Precio Venta] × 100
              </p>
            </div>
            <div className="text-right">
              <span
                className={`text-base font-extrabold font-mono px-2 py-0.5 rounded-lg ${
                  liveMargin === null
                    ? 'text-gray-500 bg-gray-100'
                    : liveMargin >= 0
                    ? 'text-emerald-700 bg-emerald-100'
                    : 'text-rose-700 bg-rose-100'
                }`}
              >
                {formatPercentage(liveMargin)}
              </span>
              {liveMargin !== null && liveMargin >= 0 && (
                <p className="text-[10px] text-emerald-800 font-semibold mt-0.5">
                  Beneficio: +{formatCurrency(numSell - numCost)}/u.
                </p>
              )}
            </div>
          </div>

          {/* Stock Config Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!productToEdit && (
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Cantidad Inicial de Existencias *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={initialStock}
                  onChange={(e) => setInitialStock(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Se registrará como existencia inicial
                </span>
              </div>
            )}

            <div className={productToEdit ? 'sm:col-span-2' : ''}>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Stock Mínimo (Alerta de Reposición) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Alerta cuando el stock sea menor o igual a este valor
              </span>
            </div>
          </div>

          {/* Footer Actions */}
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
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Guardando...' : productToEdit ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
