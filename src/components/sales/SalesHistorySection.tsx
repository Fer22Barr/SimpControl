import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Sale } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Eye,
  FileText,
  X,
  Printer
} from 'lucide-react';

export const SalesHistorySection: React.FC = () => {
  const { sales, cancelSale } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmada' | 'anulada'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');

  // Detail Modal
  const [selectedSaleForDetail, setSelectedSaleForDetail] = useState<Sale | null>(null);

  // Cancellation Modal
  const [saleToCancel, setSaleToCancel] = useState<Sale | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Filtered sales list
  const filteredSales = useMemo(() => {
    let list = [...sales];

    // Status filter
    if (statusFilter !== 'all') {
      list = list.filter((s) => s.status === statusFilter);
    }

    // Date range filter
    const now = Date.now();
    if (dateFilter === 'today') {
      const todayStr = new Date().toISOString().split('T')[0];
      list = list.filter((s) => s.dateStr === todayStr);
    } else if (dateFilter === '7days') {
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
      list = list.filter((s) => s.timestamp >= sevenDaysAgo);
    } else if (dateFilter === '30days') {
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
      list = list.filter((s) => s.timestamp >= thirtyDaysAgo);
    }

    // Search query: ID, product name inside sale, or date
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter((s) => {
        const matchesId = s.id.toLowerCase().includes(q);
        const matchesDate = s.dateStr.includes(q);
        const matchesProduct = s.items.some((item) =>
          item.productName.toLowerCase().includes(q)
        );
        return matchesId || matchesDate || matchesProduct;
      });
    }

    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [sales, statusFilter, dateFilter, searchQuery]);

  const handleConfirmCancel = async () => {
    if (!saleToCancel) return;
    try {
      setIsCancelling(true);
      await cancelSale(saleToCancel.id);
      setSaleToCancel(null);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Historial de Ventas</h2>
            <p className="text-xs text-gray-500">
              Registro inmutable de todas las transacciones comerciales realizadas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
          <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-200">
            {sales.filter((s) => s.status === 'confirmada').length} Confirmadas
          </span>
          <span className="bg-rose-50 text-rose-700 px-2.5 py-1 rounded-lg border border-rose-200">
            {sales.filter((s) => s.status === 'anulada').length} Anuladas
          </span>
        </div>
      </div>

      {/* Control bar: Search + Period Filter + Status Filter */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/90 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por N° de operación (ej: VTA-2026...), producto o fecha..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50/80 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        {/* Date Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-[11px] font-bold text-gray-400 uppercase mr-1">Período:</span>
          {(['all', 'today', '7days', '30days'] as const).map((period) => {
            const labels = {
              all: 'Todo el Historial',
              today: 'Hoy',
              '7days': 'Últimos 7 días',
              '30days': 'Últimos 30 días',
            };
            return (
              <button
                key={period}
                onClick={() => setDateFilter(period)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  dateFilter === period
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {labels[period]}
              </button>
            );
          })}
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'all'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setStatusFilter('confirmada')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'confirmada'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Confirmadas
          </button>
          <button
            onClick={() => setStatusFilter('anulada')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'anulada'
                ? 'bg-rose-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Anuladas
          </button>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200/80 text-gray-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">N° Operación</th>
                <th className="py-3.5 px-4">Fecha y Hora</th>
                <th className="py-3.5 px-4">Artículos</th>
                <th className="py-3.5 px-4 text-right">Importe Total</th>
                <th className="py-3.5 px-4 text-right">Costo Total</th>
                <th className="py-3.5 px-4 text-right">Beneficio Bruto</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <History className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="font-semibold text-gray-600">No se encontraron ventas</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      No hay registros comerciales que coincidan con los filtros aplicados.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const isCancelled = sale.status === 'anulada';
                  const totalUnits = sale.items.reduce((acc, i) => acc + i.quantity, 0);

                  return (
                    <tr
                      key={sale.id}
                      className={`hover:bg-gray-50/70 transition-colors ${
                        isCancelled ? 'bg-rose-50/20 text-gray-400' : ''
                      }`}
                    >
                      {/* Sale ID */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-gray-900 whitespace-nowrap">
                        {sale.id}
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{formatDateTime(sale.timestamp)}</div>
                        {isCancelled && sale.cancelledAt && (
                          <div className="text-[10px] text-rose-600 font-normal">
                            Anulada: {formatDateTime(sale.cancelledAt)}
                          </div>
                        )}
                      </td>

                      {/* Items Summary */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="truncate font-medium text-gray-800">
                          {sale.items.map((i) => `${i.productName} (${i.quantity})`).join(', ')}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {totalUnits} {totalUnits === 1 ? 'unidad' : 'unidades'} en {sale.items.length} {sale.items.length === 1 ? 'artículo' : 'artículos'}
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-gray-900 whitespace-nowrap">
                        <span className={isCancelled ? 'line-through text-gray-400' : ''}>
                          {formatCurrency(sale.totalAmount)}
                        </span>
                      </td>

                      {/* Total Cost */}
                      <td className="py-3.5 px-4 text-right font-mono text-gray-500 whitespace-nowrap">
                        <span className={isCancelled ? 'line-through text-gray-400' : ''}>
                          {formatCurrency(sale.totalCost)}
                        </span>
                      </td>

                      {/* Gross Profit */}
                      <td className="py-3.5 px-4 text-right font-mono whitespace-nowrap">
                        <span
                          className={`font-bold ${
                            isCancelled
                              ? 'line-through text-gray-400'
                              : sale.grossProfit >= 0
                              ? 'text-emerald-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {formatCurrency(sale.grossProfit)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isCancelled ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            Anulada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Confirmada
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View details */}
                          <button
                            onClick={() => setSelectedSaleForDetail(sale)}
                            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Ver detalle del comprobante"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Cancel sale button */}
                          {!isCancelled && (
                            <button
                              onClick={() => setSaleToCancel(sale)}
                              className="flex items-center gap-1 px-2.5 py-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors border border-rose-200"
                              title="Anular venta y restituir unidades"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Anular venta</span>
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

      {/* Sale Detail Modal */}
      {selectedSaleForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-orange-500" />
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Detalle de Operación
                  </h3>
                  <p className="text-xs font-mono text-gray-500">
                    {selectedSaleForDetail.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSaleForDetail(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between text-xs pb-3 border-b border-gray-100">
                <span className="text-gray-500">Fecha y hora:</span>
                <span className="font-semibold text-gray-900">
                  {formatDateTime(selectedSaleForDetail.timestamp)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pb-3 border-b border-gray-100">
                <span className="text-gray-500">Estado de la venta:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                    selectedSaleForDetail.status === 'confirmada'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {selectedSaleForDetail.status.toUpperCase()}
                </span>
              </div>

              {/* Items detail list */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Artículos Vendidos
                </p>
                <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 text-xs overflow-hidden">
                  {selectedSaleForDetail.items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-white space-y-1">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-gray-900">{item.productName}</span>
                        <span className="font-mono font-bold text-gray-900">
                          {formatCurrency(item.subtotalSell)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-gray-500">
                        <span>
                          {item.quantity} u. × {formatCurrency(item.unitSellPrice)} (Venta)
                        </span>
                        <span className="font-mono text-gray-400">
                          Costo hist.: {formatCurrency(item.unitCostPrice)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Economic Totals */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Importe Total (Ingresos):</span>
                  <span className="font-bold font-mono text-gray-900">
                    {formatCurrency(selectedSaleForDetail.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Costo Histórico de Mercadería:</span>
                  <span className="font-mono text-gray-700">
                    {formatCurrency(selectedSaleForDetail.totalCost)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2">
                  <span className="text-gray-900">Beneficio Bruto:</span>
                  <span
                    className={`font-mono ${
                      selectedSaleForDetail.grossProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {formatCurrency(selectedSaleForDetail.grossProfit)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedSaleForDetail(null)}
                className="px-4 py-2 text-xs font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sale Cancellation Confirmation Modal */}
      {saleToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-rose-200 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-rose-50 p-5 border-b border-rose-100 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-950">¿Anular esta venta?</h3>
                <p className="text-xs text-rose-700 mt-0.5 font-mono">{saleToCancel.id}</p>
              </div>
            </div>

            {/* Explanation body */}
            <div className="p-6 space-y-3 text-xs text-gray-700">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  Efectos de la anulación:
                </p>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800">
                  <li>Se reintegrarán automáticamente todas las unidades vendidas al inventario disponible.</li>
                  <li>Esta operación quedará excluida de los ingresos, costos y beneficios mensuales.</li>
                  <li>El registro histórico se conservará permanentemente con estado «Anulada».</li>
                  <li>Una venta anulada no podrá anularse nuevamente.</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-xl p-3 bg-gray-50/50 space-y-1">
                <p className="text-[11px] text-gray-500 uppercase font-bold">Unidades a Restituir:</p>
                <div className="divide-y divide-gray-100 max-h-32 overflow-y-auto">
                  {saleToCancel.items.map((i, idx) => (
                    <div key={idx} className="py-1 flex justify-between text-xs">
                      <span>{i.productName}</span>
                      <span className="font-bold font-mono text-emerald-600">+{i.quantity} u.</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSaleToCancel(null)}
                disabled={isCancelling}
                className="px-4 py-2.5 text-xs font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                {isCancelling ? 'Anulando...' : 'Confirmar Anulación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
