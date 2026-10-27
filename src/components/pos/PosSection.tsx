import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, Sale } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { SalesCart } from './SalesCart';
import { SaleReceiptModal } from './SaleReceiptModal';
import { 
  Search, 
  TrendingUp, 
  Clock, 
  Package, 
  Plus, 
  Check, 
  AlertTriangle, 
  AlertOctagon,
  Layers,
  Sparkles
} from 'lucide-react';

export const PosSection: React.FC = () => {
  const { activeProducts, sales, addToCart } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [addedAnimationId, setAddedAnimationId] = useState<string | null>(null);

  // Top 5 Best Selling in last 30 days
  const topSoldProducts = useMemo(() => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const unitsMap = new Map<string, number>();

    const recentSales = sales.filter(
      (s) => s.status === 'confirmada' && s.timestamp >= thirtyDaysAgo
    );

    recentSales.forEach((sale) => {
      sale.items.forEach((item) => {
        unitsMap.set(item.productId, (unitsMap.get(item.productId) || 0) + item.quantity);
      });
    });

    const activeMap = new Map<string, Product>();
    activeProducts.forEach((p) => activeMap.set(p.id, p));

    const sortedByUnits = Array.from(unitsMap.entries())
      .filter(([id]) => activeMap.has(id))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, units]) => ({
        product: activeMap.get(id)!,
        unitsSold: units,
      }));

    return sortedByUnits;
  }, [sales, activeProducts]);

  // Last 5 Added Products
  const recentProducts = useMemo(() => {
    return [...activeProducts]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [activeProducts]);

  // General Catalog sorted alphabetically and filtered
  const filteredCatalog = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const sorted = [...activeProducts].sort((a, b) => a.name.localeCompare(b.name, 'es'));
    if (!q) return sorted;
    return sorted.filter(
      (p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
    );
  }, [activeProducts, searchQuery]);

  const handleAdd = (product: Product) => {
    const result = addToCart(product, 1);
    if (result.success) {
      setAddedAnimationId(product.id);
      setTimeout(() => setAddedAnimationId(null), 1000);
    }
  };

  const renderStockBadge = (product: Product) => {
    if (product.currentStock === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
          <AlertOctagon className="w-3 h-3 text-rose-600" />
          Agotado
        </span>
      );
    }
    if (product.currentStock <= product.minStock) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          {product.currentStock} disp. (Bajo)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        {product.currentStock} disp.
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Search bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/90 shadow-2xs">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar producto por nombre o código (búsqueda en tiempo real)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50/70 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-gray-600 px-2 py-1"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Products (left) + Sales Cart (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Products) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-8">
          {/* Section 1: Productos Más Vendidos (Only when not actively filtering) */}
          {!searchQuery && topSoldProducts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Productos más vendidos</h2>
                    <p className="text-xs text-gray-500">Últimos 30 días</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400 font-medium">Top 5</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {topSoldProducts.map(({ product, unitsSold }) => {
                  const isOutOfStock = product.currentStock === 0;
                  const isJustAdded = addedAnimationId === product.id;

                  return (
                    <div
                      key={product.id}
                      className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs flex flex-col justify-between hover:border-orange-300 transition-all group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <span className="text-[10px] font-mono text-gray-400 font-semibold">{product.id}</span>
                          <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                            {unitsSold} vendidas
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                          {product.name}
                        </h4>
                        <div className="mt-2 flex items-baseline justify-between">
                          <span className="text-base font-extrabold text-gray-900 font-mono">
                            {formatCurrency(product.sellPrice)}
                          </span>
                          {renderStockBadge(product)}
                        </div>
                      </div>

                      <button
                        onClick={() => handleAdd(product)}
                        disabled={isOutOfStock}
                        className={`mt-3 w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                          isOutOfStock
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : isJustAdded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white'
                        }`}
                      >
                        {isOutOfStock ? (
                          'Agotado'
                        ) : isJustAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Agregado
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            Agregar a venta
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 2: Productos Recientes (Only when not actively filtering) */}
          {!searchQuery && recentProducts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Productos recientes</h2>
                    <p className="text-xs text-gray-500">Últimos 5 incorporados al catálogo</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400 font-medium">Novedades</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {recentProducts.map((product) => {
                  const isOutOfStock = product.currentStock === 0;
                  const isJustAdded = addedAnimationId === product.id;

                  return (
                    <div
                      key={product.id}
                      className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs flex flex-col justify-between hover:border-gray-400 transition-all group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <span className="text-[10px] font-mono text-gray-400 font-semibold">{product.id}</span>
                          <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-orange-500" />
                            Nuevo
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                          {product.name}
                        </h4>
                        <div className="mt-2 flex items-baseline justify-between">
                          <span className="text-base font-extrabold text-gray-900 font-mono">
                            {formatCurrency(product.sellPrice)}
                          </span>
                          {renderStockBadge(product)}
                        </div>
                      </div>

                      <button
                        onClick={() => handleAdd(product)}
                        disabled={isOutOfStock}
                        className={`mt-3 w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                          isOutOfStock
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : isJustAdded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white'
                        }`}
                      >
                        {isOutOfStock ? (
                          'Agotado'
                        ) : isJustAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Agregado
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            Agregar a venta
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 3: Catálogo General */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Catálogo general</h2>
                  <p className="text-xs text-gray-500">
                    {searchQuery
                      ? `Resultados de búsqueda (${filteredCatalog.length})`
                      : `Todos los productos ordenados alfabéticamente (${filteredCatalog.length})`}
                  </p>
                </div>
              </div>
            </div>

            {filteredCatalog.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center text-gray-500">
                <Package className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="font-semibold text-sm text-gray-700">No se encontraron productos</p>
                <p className="text-xs text-gray-400 mt-1">
                  Intenta buscar con otro término o agrega nuevos productos desde la sección de Productos.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs divide-y divide-gray-100 overflow-hidden">
                {filteredCatalog.map((product) => {
                  const isOutOfStock = product.currentStock === 0;
                  const isJustAdded = addedAnimationId === product.id;

                  return (
                    <div
                      key={product.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/70 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-medium text-gray-400">{product.id}</span>
                          <h4 className="text-sm font-bold text-gray-900 truncate">{product.name}</h4>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs">
                          <span className="font-bold text-gray-900 font-mono">
                            {formatCurrency(product.sellPrice)}
                          </span>
                          <span className="text-gray-300">•</span>
                          {renderStockBadge(product)}
                        </div>
                      </div>

                      <div className="flex items-center justify-end sm:shrink-0">
                        <button
                          onClick={() => handleAdd(product)}
                          disabled={isOutOfStock}
                          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                            isOutOfStock
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : isJustAdded
                              ? 'bg-emerald-600 text-white'
                              : 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white'
                          }`}
                        >
                          {isOutOfStock ? (
                            'Agotado'
                          ) : isJustAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Agregado
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              Agregar a venta
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Sales Cart - Sticky) */}
        <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-20">
          <SalesCart onSaleConfirmed={(sale) => setCompletedSale(sale)} />
        </div>
      </div>

      {/* Sale Receipt Modal */}
      <SaleReceiptModal
        sale={completedSale}
        isOpen={Boolean(completedSale)}
        onClose={() => setCompletedSale(null)}
      />
    </div>
  );
};
