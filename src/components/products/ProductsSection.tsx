import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { formatCurrency, formatPercentage, calculateGrossMargin, formatDate } from '../../utils/formatters';
import { ProductFormModal } from './ProductFormModal';
import { AdjustStockModal } from './AdjustStockModal';
import { ProductMovementsModal } from './ProductMovementsModal';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  SlidersHorizontal,
  History,
  PowerOff,
  RotateCcw,
  AlertTriangle,
  AlertOctagon,
  Boxes,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

export const ProductsSection: React.FC = () => {
  const {
    products,
    createProduct,
    updateProduct,
    toggleProductActive,
    adjustStock,
    lowStockCount,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'lowStock'>('all');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);

  // Filtered and searched list
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Status filter
    if (filterStatus === 'active') {
      list = list.filter((p) => p.active);
    } else if (filterStatus === 'inactive') {
      list = list.filter((p) => !p.active);
    } else if (filterStatus === 'lowStock') {
      list = list.filter((p) => p.active && p.currentStock <= p.minStock);
    }

    // Search query
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
      );
    }

    // Sort by code / id
    return list.sort((a, b) => a.id.localeCompare(b.id));
  }, [products, filterStatus, searchQuery]);

  // Overall catalog metrics
  const metrics = useMemo(() => {
    const active = products.filter((p) => p.active);
    const totalValuationCost = active.reduce((acc, p) => acc + p.currentStock * p.costPrice, 0);
    const totalValuationSell = active.reduce((acc, p) => acc + p.currentStock * p.sellPrice, 0);

    return {
      totalCount: products.length,
      activeCount: active.length,
      totalValuationCost,
      totalValuationSell,
    };
  }, [products]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleSaveProduct = async (data: any) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, {
        name: data.name,
        costPrice: data.costPrice,
        sellPrice: data.sellPrice,
        minStock: data.minStock,
      });
    } else {
      await createProduct(data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Products */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Productos Activos
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gray-900 mt-2 font-mono">
            {metrics.activeCount} <span className="text-xs font-normal text-gray-400">/ {metrics.totalCount} tot.</span>
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Disponibles para comercialización</p>
        </div>

        {/* Card 2: Valorización al Costo */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Valor de Stock (Costo)
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gray-900 mt-2 font-mono">
            {formatCurrency(metrics.totalValuationCost)}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Capital invertido en existencias</p>
        </div>

        {/* Card 3: Valorización a la Venta */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Valor de Stock (Venta)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gray-900 mt-2 font-mono">
            {formatCurrency(metrics.totalValuationSell)}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Potencial de facturación total</p>
        </div>

        {/* Card 4: Alertas de Stock */}
        <div className={`p-5 rounded-2xl border shadow-2xs transition-colors ${
          lowStockCount > 0 ? 'bg-amber-50/80 border-amber-200' : 'bg-white border-gray-200/90'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${
              lowStockCount > 0 ? 'text-amber-800' : 'text-gray-500'
            }`}>
              Alertas de Stock
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              lowStockCount > 0 ? 'bg-amber-200 text-amber-800' : 'bg-gray-100 text-gray-400'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-extrabold mt-2 font-mono ${
            lowStockCount > 0 ? 'text-amber-900' : 'text-gray-900'
          }`}>
            {lowStockCount} <span className="text-xs font-normal">productos</span>
          </p>
          <p className={`text-[11px] mt-1 ${lowStockCount > 0 ? 'text-amber-700' : 'text-gray-400'}`}>
            {lowStockCount > 0 ? 'Requieren reposición de mercadería' : 'Existencias en niveles adecuados'}
          </p>
        </div>
      </div>

      {/* Control Bar: Search + Filter + New Product Button */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/90 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o código (ej: PRD-0001)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50/80 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-1 mr-1" />
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterStatus === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos ({products.length})
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterStatus === 'active'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Activos ({metrics.activeCount})
          </button>
          <button
            onClick={() => setFilterStatus('lowStock')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterStatus === 'lowStock'
                ? 'bg-amber-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Bajo Stock ({lowStockCount})
          </button>
          <button
            onClick={() => setFilterStatus('inactive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterStatus === 'inactive'
                ? 'bg-gray-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Inactivos ({products.length - metrics.activeCount})
          </button>
        </div>

        {/* Add Product Button */}
        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Producto</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200/80 text-gray-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Código</th>
                <th className="py-3.5 px-4">Producto</th>
                <th className="py-3.5 px-4 text-right">P. Costo</th>
                <th className="py-3.5 px-4 text-right">P. Venta</th>
                <th className="py-3.5 px-4 text-right">Margen Bruto</th>
                <th className="py-3.5 px-4 text-center">Stock Actual</th>
                <th className="py-3.5 px-4 text-center">Stock Mínimo</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="font-semibold text-gray-600">No se encontraron productos</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Prueba con otro filtro o haz clic en &ldquo;Nuevo Producto&rdquo;.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const margin = calculateGrossMargin(p.costPrice, p.sellPrice);
                  const isOutOfStock = p.currentStock === 0;
                  const isLowStock = p.currentStock > 0 && p.currentStock <= p.minStock;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-gray-50/70 transition-colors ${
                        !p.active ? 'opacity-60 bg-gray-50/30' : ''
                      }`}
                    >
                      {/* Code */}
                      <td className="py-3 px-4 font-mono font-semibold text-gray-500 whitespace-nowrap">
                        {p.id}
                      </td>

                      {/* Name & Created */}
                      <td className="py-3 px-4 font-medium text-gray-900 max-w-xs truncate">
                        <div className="font-bold text-gray-900">{p.name}</div>
                        <div className="text-[10px] text-gray-400 font-normal">
                          Alta: {formatDate(p.createdAt)}
                        </div>
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-4 text-right font-mono font-medium text-gray-600 whitespace-nowrap">
                        {formatCurrency(p.costPrice)}
                      </td>

                      {/* Sell */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-gray-900 whitespace-nowrap">
                        {formatCurrency(p.sellPrice)}
                      </td>

                      {/* Margin % */}
                      <td className="py-3 px-4 text-right font-mono whitespace-nowrap">
                        <span
                          className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                            margin === null
                              ? 'text-gray-400 bg-gray-100'
                              : margin >= 0
                              ? 'text-emerald-700 bg-emerald-50'
                              : 'text-rose-700 bg-rose-50'
                          }`}
                        >
                          {formatPercentage(margin)}
                        </span>
                      </td>

                      {/* Current Stock */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 font-bold font-mono text-[11px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertOctagon className="w-3 h-3 text-rose-600" />
                            0 u.
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 font-bold font-mono text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            {p.currentStock} u.
                          </span>
                        ) : (
                          <span className="font-mono font-bold text-gray-800">
                            {p.currentStock} u.
                          </span>
                        )}
                      </td>

                      {/* Min Stock */}
                      <td className="py-3 px-4 text-center font-mono text-gray-500 whitespace-nowrap">
                        {p.minStock} u.
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {p.active ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Activo
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                            Descontinuado
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Modificar producto"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Manual Stock Adjust */}
                          <button
                            onClick={() => setAdjustingProduct(p)}
                            className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Ajuste manual de inventario"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>

                          {/* Movement History */}
                          <button
                            onClick={() => setHistoryProduct(p)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver movimientos históricos"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Active / Deactivate */}
                          {p.active ? (
                            <button
                              onClick={() => toggleProductActive(p.id, false)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Descontinuar producto (conserva historial)"
                            >
                              <PowerOff className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleProductActive(p.id, true)}
                              className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Reactivar producto"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        productToEdit={editingProduct}
        onSave={handleSaveProduct}
      />

      <AdjustStockModal
        isOpen={Boolean(adjustingProduct)}
        product={adjustingProduct}
        onClose={() => setAdjustingProduct(null)}
        onConfirm={adjustStock}
      />

      <ProductMovementsModal
        isOpen={Boolean(historyProduct)}
        product={historyProduct}
        onClose={() => setHistoryProduct(null)}
      />
    </div>
  );
};
