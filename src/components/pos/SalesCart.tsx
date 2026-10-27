import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { Sale } from '../../types';

interface SalesCartProps {
  onSaleConfirmed: (sale: Sale) => void;
}

export const SalesCart: React.FC<SalesCartProps> = ({ onSaleConfirmed }) => {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartTotalAmount,
    cartTotalItemsCount,
    confirmSale,
  } = useApp();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConfirm = async () => {
    setErrorMessage(null);
    if (cart.length === 0) return;

    // Check client-side first for immediate feedback
    for (const item of cart) {
      if (item.quantity > item.product.currentStock) {
        setErrorMessage(
          `Stock insuficiente. Producto: ${item.product.name}. Disponibles: ${item.product.currentStock}. Solicitadas: ${item.quantity}`
        );
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const sale = await confirmSale();
      onSaleConfirmed(sale);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al confirmar la venta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Carrito de Venta</h2>
            <p className="text-[11px] text-gray-500">
              {cart.length === 0
                ? 'Vacío'
                : `${cart.length} ${cart.length === 1 ? 'artículo' : 'artículos'} (${cartTotalItemsCount} u.)`}
            </p>
          </div>
        </div>

        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="text-[11px] text-gray-400 hover:text-rose-600 transition-colors flex items-center gap-1 font-semibold px-2 py-1 rounded-md hover:bg-rose-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Vaciar
          </button>
        )}
      </div>

      {/* Error alert banner if any */}
      {errorMessage && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Advertencia de Stock</p>
            <p className="mt-0.5 text-[11px] leading-tight">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Cart items list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[220px] max-h-[480px]">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-2 text-gray-400">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-gray-600">No hay productos en el carrito</p>
            <p className="text-[11px] text-gray-400 mt-1 max-w-[200px]">
              Selecciona productos del catálogo para agregarlos a la venta actual.
            </p>
          </div>
        ) : (
          cart.map((item) => {
            const isExceeded = item.quantity > item.product.currentStock;
            return (
              <div
                key={item.product.id}
                className={`p-3 rounded-xl border transition-all ${
                  isExceeded
                    ? 'bg-rose-50/70 border-rose-300'
                    : 'bg-white border-gray-200 hover:border-gray-300 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {item.product.name}
                    </p>
                    <p className="text-[11px] text-gray-500 font-mono">
                      Unitario: {formatCurrency(item.product.sellPrice)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Disponible: {item.product.currentStock} u.
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-gray-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                    title="Quitar producto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Quantity and Subtotal bar */}
                <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg">
                    <button
                      onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                      className="w-6 h-6 rounded bg-white text-gray-700 hover:bg-gray-200 flex items-center justify-center shadow-2xs transition-colors"
                      title="Disminuir"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={item.product.currentStock}
                      value={item.quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) {
                          updateCartQuantity(item.product.id, val);
                        }
                      }}
                      className="w-10 text-center text-xs font-bold bg-transparent text-gray-900 focus:outline-hidden"
                    />
                    <button
                      onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.currentStock}
                      className="w-6 h-6 rounded bg-white text-gray-700 hover:bg-gray-200 flex items-center justify-center shadow-2xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Aumentar"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Subtotal</p>
                    <p className="text-xs font-bold text-gray-900 font-mono">
                      {formatCurrency(item.quantity * item.product.sellPrice)}
                    </p>
                  </div>
                </div>

                {isExceeded && (
                  <p className="text-[10px] font-semibold text-rose-600 mt-2">
                    Supera el stock actual ({item.product.currentStock} disponibles)
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer / Total & Checkout button */}
      <div className="p-4 bg-gray-50 border-t border-gray-200/90 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 font-medium">Total de la venta:</span>
          <span className="text-xl font-extrabold text-gray-900 font-mono tracking-tight">
            {formatCurrency(cartTotalAmount)}
          </span>
        </div>

        <button
          onClick={handleConfirm}
          disabled={cart.length === 0 || isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {isSubmitting ? (
            <span>Procesando venta...</span>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Confirmar Venta</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>

        <p className="text-[10px] text-gray-400 text-center leading-tight">
          La confirmación descuenta automáticamente las existencias del inventario local.
        </p>
      </div>
    </div>
  );
};
