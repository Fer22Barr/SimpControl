import React from 'react';
import { Sale } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { CheckCircle2, Printer, X, ShoppingBag } from 'lucide-react';

interface SaleReceiptModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SaleReceiptModal: React.FC<SaleReceiptModalProps> = ({ sale, isOpen, onClose }) => {
  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="bg-emerald-600 text-white p-5 text-center relative print:hidden">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-100 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-2 text-white">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold tracking-tight">¡Venta Confirmada!</h3>
          <p className="text-xs text-emerald-100 mt-0.5">Operación registrada correctamente en inventario</p>
        </div>

        {/* Printable Ticket Receipt Area */}
        <div id="printable-receipt" className="p-6 overflow-y-auto space-y-4 font-sans text-gray-800">
          <div className="text-center border-b border-dashed border-gray-300 pb-4">
            <div className="flex items-center justify-center gap-1.5 font-extrabold text-lg tracking-tight text-gray-900">
              <ShoppingBag className="w-5 h-5 text-orange-500" />
              <span>SimpControl</span>
            </div>
            <p className="text-[11px] text-gray-500 uppercase tracking-widest mt-0.5">Comprobante de Venta</p>
            <div className="mt-2 text-xs text-gray-600 space-y-0.5">
              <p><span className="font-semibold">N° Operación:</span> <span className="font-mono">{sale.id}</span></p>
              <p><span className="font-semibold">Fecha y Hora:</span> {formatDateTime(sale.timestamp)}</p>
            </div>
          </div>

          {/* Items breakdown */}
          <div className="space-y-2 border-b border-dashed border-gray-300 pb-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Detalle de Artículos</p>
            <div className="divide-y divide-gray-100 text-xs">
              {sale.items.map((item, idx) => (
                <div key={idx} className="py-2 flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 leading-tight">{item.productName}</p>
                    <p className="text-gray-500 text-[11px]">
                      {item.quantity} x {formatCurrency(item.unitSellPrice)}
                    </p>
                  </div>
                  <div className="text-right font-semibold text-gray-900">
                    {formatCurrency(item.subtotalSell)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total summary */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Total de unidades:</span>
              <span className="font-semibold text-gray-900">
                {sale.items.reduce((acc, i) => acc + i.quantity, 0)} u.
              </span>
            </div>
            <div className="flex justify-between items-center text-lg font-bold border-t border-gray-200 pt-2 text-gray-900">
              <span>TOTAL:</span>
              <span className="text-orange-600 font-extrabold">{formatCurrency(sale.totalAmount)}</span>
            </div>
          </div>

          <div className="text-center text-[11px] text-gray-400 pt-3 border-t border-dashed border-gray-200">
            ¡Gracias por su compra!
          </div>
        </div>

        {/* Actions footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 text-xs font-semibold transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4 text-gray-600" />
            Imprimir Comprobante
          </button>
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            Nueva Venta
          </button>
        </div>
      </div>
    </div>
  );
};
