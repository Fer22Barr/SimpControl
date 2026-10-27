import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { formatDateTime } from '../../utils/formatters';
import { 
  PackagePlus, 
  Search, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  History, 
  Package, 
  Truck
} from 'lucide-react';

export const RestockSection: React.FC = () => {
  const {
    activeProducts,
    restockProduct,
    movements,
    selectedProductForRestock,
    setSelectedProductForRestock,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantityInput, setQuantityInput] = useState<string>('');
  const [restockNote, setRestockNote] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastRestocked, setLastRestocked] = useState<{ product: Product; added: number } | null>(null);

  // If a product was selected from an alert modal or other section, initialize it here
  useEffect(() => {
    if (selectedProductForRestock) {
      setSelectedProduct(selectedProductForRestock);
      setSelectedProductForRestock(null);
    }
  }, [selectedProductForRestock, setSelectedProductForRestock]);

  // Search filtered products for the picker
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return activeProducts.slice(0, 8);
    return activeProducts.filter(
      (p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
    );
  }, [activeProducts, searchQuery]);

  // Recent replenishment movements for the audit table
  const recentReplenishments = useMemo(() => {
    return movements
      .filter((m) => m.type === 'ingreso_mercaderia')
      .slice(0, 10);
  }, [movements]);

  const numQty = parseInt(quantityInput, 10);
  const resultingStock =
    selectedProduct && !isNaN(numQty) && numQty > 0
      ? selectedProduct.currentStock + numQty
      : selectedProduct
      ? selectedProduct.currentStock
      : 0;

  const handleSelectProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setSearchQuery('');
    setError(null);
    setLastRestocked(null);
  };

  const handleConfirmRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedProduct) {
      setError('Por favor selecciona un producto para ingresar existencias.');
      return;
    }

    if (isNaN(numQty) || numQty <= 0) {
      setError('La cantidad a ingresar debe ser un número entero mayor a cero.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await restockProduct(selectedProduct.id, numQty, restockNote);
      setLastRestocked({ product: res.product, added: numQty });
      // Update selected product's stock in local state
      setSelectedProduct(res.product);
      setQuantityInput('');
      setRestockNote('');
    } catch (err: any) {
      setError(err.message || 'Error al registrar el ingreso de mercadería.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
            <PackagePlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Ingreso de Mercadería</h2>
            <p className="text-xs text-gray-500">
              Registra la recepción o reposición de artículos aumentando el stock local
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
          <Truck className="w-4 h-4 text-orange-500" />
          <span>Gestión de Proveedores y Stock</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Product Selection & Restock Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-2xs space-y-5">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <span>1. Seleccionar Producto</span>
            </h3>

            {/* Product Search Picker */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar producto por nombre o código para reponer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              {/* Suggestions list */}
              {searchQuery && (
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 bg-white shadow-md">
                  {filteredProducts.length === 0 ? (
                    <div className="p-3 text-xs text-gray-400 text-center">
                      No se encontraron productos activos
                    </div>
                  ) : (
                    filteredProducts.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectProduct(p)}
                        className="w-full p-2.5 text-left text-xs hover:bg-orange-50/60 flex items-center justify-between transition-colors"
                      >
                        <div>
                          <span className="font-mono text-gray-400 mr-2">{p.id}</span>
                          <span className="font-bold text-gray-900">{p.name}</span>
                        </div>
                        <span className="text-gray-500 font-mono">
                          Stock: <strong>{p.currentStock} u.</strong>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Selected Product Details & Form */}
            {selectedProduct ? (
              <form onSubmit={handleConfirmRestock} className="space-y-5 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                    2. Detalles del Ingreso
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    className="text-xs text-orange-600 hover:text-orange-700 font-semibold"
                  >
                    Cambiar Producto
                  </button>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Selected Product Card */}
                <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-200/80">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded">
                        {selectedProduct.id}
                      </span>
                      <h4 className="text-base font-bold text-gray-900 mt-1.5">
                        {selectedProduct.name}
                      </h4>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-gray-500 font-medium">Stock Actual</p>
                      <p className="text-lg font-extrabold text-gray-900 font-mono">
                        {selectedProduct.currentStock} <span className="text-xs font-normal text-gray-500">u.</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Calculation Interactive Preview */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 text-center items-center">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-gray-500">Stock Actual</p>
                    <p className="text-lg font-extrabold text-gray-800 font-mono mt-0.5">
                      {selectedProduct.currentStock} u.
                    </p>
                  </div>
                  <div className="text-orange-500 font-bold text-lg flex items-center justify-center gap-1">
                    <span>+</span>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-gray-500">Ingreso</p>
                      <p className="text-lg font-extrabold text-orange-600 font-mono mt-0.5">
                        {!isNaN(numQty) && numQty > 0 ? numQty : 0} u.
                      </p>
                    </div>
                  </div>
                  <div className="border-t sm:border-t-0 sm:border-l border-gray-200 pt-2 sm:pt-0">
                    <p className="text-[10px] font-bold uppercase text-emerald-700">Stock Resultante</p>
                    <p className="text-xl font-extrabold text-emerald-600 font-mono mt-0.5">
                      {resultingStock} u.
                    </p>
                  </div>
                </div>

                {/* Input Quantity */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Cantidad que Desea Ingresar *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    placeholder="Ej: 20"
                    value={quantityInput}
                    onChange={(e) => setQuantityInput(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-base font-bold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    Solo números enteros positivos mayores a cero.
                  </span>
                </div>

                {/* Optional Note / Reference */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Nota o Referencia (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Factura Proveedor N° 4022 / Remito de compra"
                    value={restockNote}
                    onChange={(e) => setRestockNote(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !numQty || numQty <= 0}
                  className="w-full py-3.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PackagePlus className="w-5 h-5" />
                  <span>
                    {isSubmitting
                      ? 'Actualizando existencias...'
                      : `Confirmar Ingreso de ${!isNaN(numQty) && numQty > 0 ? numQty : 0} Unidades`}
                  </span>
                </button>
              </form>
            ) : (
              <div className="p-8 border border-dashed border-gray-200 rounded-xl text-center text-gray-400">
                <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-xs font-semibold text-gray-600">Ningún producto seleccionado</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Usa el buscador superior o selecciona un producto de la lista rápida para registrar su reposición.
                </p>
              </div>
            )}

            {/* Success message banner */}
            {lastRestocked && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold">¡Ingreso confirmado correctamente!</p>
                  <p className="mt-0.5">
                    Se sumaron <strong>{lastRestocked.added} unidades</strong> a{' '}
                    <strong>{lastRestocked.product.name}</strong>. Stock actual:{' '}
                    <strong>{lastRestocked.product.currentStock} unidades</strong>.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Replenishment Audit Table (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Reposiciones Recientes</h3>
                  <p className="text-[11px] text-gray-500">Últimos ingresos registrados</p>
                </div>
              </div>
              <span className="text-[11px] text-gray-400 font-mono">
                {recentReplenishments.length} reg.
              </span>
            </div>

            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
              {recentReplenishments.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400">
                  No hay ingresos de mercadería registrados aún.
                </div>
              ) : (
                recentReplenishments.map((m) => (
                  <div key={m.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">
                          {m.productName}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono">
                          {formatDateTime(m.timestamp)}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        +{m.quantity} u.
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <span>
                        Transición: {m.previousStock} → <strong>{m.newStock} u.</strong>
                      </span>
                      {m.reason && (
                        <span className="text-gray-400 truncate max-w-[150px] italic">
                          {m.reason}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
