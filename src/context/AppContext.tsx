import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Product, Sale, Movement, CartItem, Section, BackupData } from '../types';
import { dbService } from '../services/db';

interface AppNotification {
  id: string;
  type: 'success' | 'warning' | 'error';
  title?: string;
  message: string;
}

interface AppContextType {
  // Navigation
  currentSection: Section;
  setCurrentSection: (section: Section) => void;
  selectedProductForRestock: Product | null;
  setSelectedProductForRestock: (product: Product | null) => void;

  // Data
  products: Product[];
  activeProducts: Product[];
  sales: Sale[];
  movements: Movement[];
  loading: boolean;

  // Stock Alerts
  lowStockProducts: Product[];
  outOfStockProducts: Product[];
  lowStockCount: number;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => { success: boolean; error?: string };
  updateCartQuantity: (productId: string, quantity: number) => { success: boolean; error?: string };
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartTotalAmount: number;
  cartTotalItemsCount: number;

  // Operations
  createProduct: (data: {
    name: string;
    costPrice: number;
    sellPrice: number;
    initialStock: number;
    minStock: number;
  }) => Promise<Product>;
  updateProduct: (
    id: string,
    updates: { name: string; costPrice: number; sellPrice: number; minStock: number }
  ) => Promise<Product>;
  toggleProductActive: (id: string, active: boolean) => Promise<Product>;
  adjustStock: (productId: string, newStock: number, reason: string) => Promise<Product>;
  restockProduct: (productId: string, quantityToAdd: number, note?: string) => Promise<{ product: Product; movement: Movement }>;
  confirmSale: () => Promise<Sale>;
  cancelSale: (saleId: string) => Promise<Sale>;
  refreshData: () => Promise<void>;
  exportBackup: () => Promise<BackupData>;
  importBackup: (data: any) => Promise<{ success: boolean; message: string; stats: any }>;
  resetToSampleData: () => Promise<void>;

  // Notifications
  notifications: AppNotification[];
  addNotification: (type: 'success' | 'warning' | 'error', message: string, title?: string) => void;
  dismissNotification: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSection, setCurrentSection] = useState<Section>('inicio');
  const [selectedProductForRestock, setSelectedProductForRestock] = useState<Product | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const addNotification = useCallback(
    (type: 'success' | 'warning' | 'error', message: string, title?: string) => {
      const id = `${Date.now()}-${Math.random()}`;
      setNotifications((prev) => [...prev, { id, type, title, message }]);

      // Auto dismiss after 5 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 5000);
    },
    []
  );

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const [prods, sles, movs] = await Promise.all([
        dbService.getProducts(),
        dbService.getSales(),
        dbService.getMovements(),
      ]);
      setProducts(prods);
      setSales(sles);
      setMovements(movs);

      // Also reconcile current cart against fresh stock levels
      setCart((prevCart) => {
        return prevCart
          .map((item) => {
            const freshProd = prods.find((p) => p.id === item.product.id);
            if (!freshProd || !freshProd.active || freshProd.currentStock === 0) {
              return null;
            }
            return {
              product: freshProd,
              quantity: Math.min(item.quantity, freshProd.currentStock),
            };
          })
          .filter((item): item is CartItem => item !== null && item.quantity > 0);
      });
    } catch (err: any) {
      console.error('Error refreshing data from IndexedDB:', err);
      addNotification('error', 'Error al leer datos locales: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  // Initial load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Active products
  const activeProducts = useMemo(() => {
    return products.filter((p) => p.active);
  }, [products]);

  // Stock alerts
  const lowStockProducts = useMemo(() => {
    return activeProducts.filter((p) => p.currentStock > 0 && p.currentStock <= p.minStock);
  }, [activeProducts]);

  const outOfStockProducts = useMemo(() => {
    return activeProducts.filter((p) => p.currentStock === 0);
  }, [activeProducts]);

  const lowStockCount = useMemo(() => {
    return lowStockProducts.length + outOfStockProducts.length;
  }, [lowStockProducts.length, outOfStockProducts.length]);

  // Cart calculations
  const cartTotalAmount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity * item.product.sellPrice, 0);
  }, [cart]);

  const cartTotalItemsCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  // Add to cart with strict stock validation
  const addToCart = useCallback(
    (product: Product, quantity: number = 1): { success: boolean; error?: string } => {
      if (!product.active) {
        const error = `El producto "${product.name}" está inactivo.`;
        addNotification('warning', error);
        return { success: false, error };
      }

      if (product.currentStock <= 0) {
        const error = `Producto agotado. No hay unidades disponibles de "${product.name}".`;
        addNotification('error', error);
        return { success: false, error };
      }

      const existingCartItem = cart.find((i) => i.product.id === product.id);
      const currentCartQty = existingCartItem ? existingCartItem.quantity : 0;
      const requestedTotal = currentCartQty + quantity;

      if (requestedTotal > product.currentStock) {
        const error = `Stock insuficiente. Producto: ${product.name}. Disponibles: ${product.currentStock}. Solicitadas: ${requestedTotal}`;
        addNotification('warning', error);
        return { success: false, error };
      }

      setCart((prev) => {
        const index = prev.findIndex((i) => i.product.id === product.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            quantity: updated[index].quantity + quantity,
          };
          return updated;
        } else {
          return [...prev, { product, quantity }];
        }
      });

      addNotification('success', `Se agregó ${quantity} unidad(es) de "${product.name}" a la venta.`);
      return { success: true };
    },
    [cart, addNotification]
  );

  const updateCartQuantity = useCallback(
    (productId: string, quantity: number): { success: boolean; error?: string } => {
      const item = cart.find((i) => i.product.id === productId);
      if (!item) return { success: false, error: 'Producto no encontrado en el carrito.' };

      if (quantity <= 0) {
        setCart((prev) => prev.filter((i) => i.product.id !== productId));
        return { success: true };
      }

      if (quantity > item.product.currentStock) {
        const error = `Stock insuficiente. Producto: ${item.product.name}. Disponibles: ${item.product.currentStock}. Solicitadas: ${quantity}`;
        addNotification('warning', error);
        return { success: false, error };
      }

      setCart((prev) =>
        prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
      );
      return { success: true };
    },
    [cart, addNotification]
  );

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Atomic Confirm Sale
  const confirmSale = useCallback(async (): Promise<Sale> => {
    try {
      if (cart.length === 0) {
        throw new Error('El carrito está vacío. Agregue productos antes de confirmar.');
      }

      const sale = await dbService.registerSale(cart);
      clearCart();
      await refreshData();
      addNotification(
        'success',
        `Venta ${sale.id} registrada exitosamente por un total de $ ${sale.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}.`,
        'Venta Confirmada'
      );
      return sale;
    } catch (err: any) {
      addNotification('error', err.message || 'Error al procesar la venta.', 'No se pudo completar la venta');
      throw err;
    }
  }, [cart, clearCart, refreshData, addNotification]);

  // Atomic Cancel Sale
  const cancelSale = useCallback(
    async (saleId: string): Promise<Sale> => {
      try {
        const sale = await dbService.cancelSale(saleId);
        await refreshData();
        addNotification(
          'success',
          `Venta ${saleId} anulada correctamente. Se reintegraron los productos al stock disponible.`,
          'Venta Anulada'
        );
        return sale;
      } catch (err: any) {
        addNotification('error', err.message || 'Error al anular la venta.');
        throw err;
      }
    },
    [refreshData, addNotification]
  );

  // Products CRUD
  const createProduct = useCallback(
    async (data: {
      name: string;
      costPrice: number;
      sellPrice: number;
      initialStock: number;
      minStock: number;
    }) => {
      try {
        const newProduct = await dbService.createProduct(data);
        await refreshData();
        addNotification('success', `Producto "${newProduct.name}" creado con código ${newProduct.id}.`);
        return newProduct;
      } catch (err: any) {
        addNotification('error', err.message || 'Error al crear producto.');
        throw err;
      }
    },
    [refreshData, addNotification]
  );

  const updateProduct = useCallback(
    async (
      id: string,
      updates: { name: string; costPrice: number; sellPrice: number; minStock: number }
    ) => {
      try {
        const prod = await dbService.updateProduct(id, updates);
        await refreshData();
        addNotification('success', `Producto "${prod.name}" actualizado correctamente.`);
        return prod;
      } catch (err: any) {
        addNotification('error', err.message || 'Error al actualizar producto.');
        throw err;
      }
    },
    [refreshData, addNotification]
  );

  const toggleProductActive = useCallback(
    async (id: string, active: boolean) => {
      try {
        const prod = await dbService.setProductActive(id, active);
        await refreshData();
        addNotification(
          'success',
          `Producto "${prod.name}" ${active ? 'reactivado' : 'descontinuado'}.`
        );
        return prod;
      } catch (err: any) {
        addNotification('error', err.message || 'Error al cambiar estado del producto.');
        throw err;
      }
    },
    [refreshData, addNotification]
  );

  const adjustStock = useCallback(
    async (productId: string, newStock: number, reason: string) => {
      try {
        const prod = await dbService.adjustStock(productId, newStock, reason);
        await refreshData();
        addNotification('success', `Existencias de "${prod.name}" ajustadas a ${newStock} unidades.`);
        return prod;
      } catch (err: any) {
        addNotification('error', err.message || 'Error al realizar el ajuste de inventario.');
        throw err;
      }
    },
    [refreshData, addNotification]
  );

  const restockProduct = useCallback(
    async (productId: string, quantityToAdd: number, note?: string) => {
      try {
        const res = await dbService.restockProduct(productId, quantityToAdd, note);
        await refreshData();
        addNotification(
          'success',
          `Se ingresaron ${quantityToAdd} unidades de "${res.product.name}". Nuevo stock: ${res.product.currentStock} unidades.`
        );
        return res;
      } catch (err: any) {
        addNotification('error', err.message || 'Error al ingresar mercadería.');
        throw err;
      }
    },
    [refreshData, addNotification]
  );

  const exportBackup = useCallback(async () => {
    return dbService.exportBackup();
  }, []);

  const importBackup = useCallback(
    async (data: any) => {
      try {
        const res = await dbService.importBackup(data);
        await refreshData();
        addNotification('success', `Copia de seguridad restaurada con éxito.`);
        return res;
      } catch (err: any) {
        addNotification('error', err.message || 'Error al importar datos.');
        throw err;
      }
    },
    [refreshData, addNotification]
  );

  const resetToSampleData = useCallback(async () => {
    try {
      await dbService.resetToSampleData();
      await refreshData();
      addNotification('success', 'Datos de ejemplo restaurados exitosamente.');
    } catch (err: any) {
      addNotification('error', err.message || 'Error al resetear datos.');
      throw err;
    }
  }, [refreshData, addNotification]);

  const value = {
    currentSection,
    setCurrentSection,
    selectedProductForRestock,
    setSelectedProductForRestock,
    products,
    activeProducts,
    sales,
    movements,
    loading,
    lowStockProducts,
    outOfStockProducts,
    lowStockCount,
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartTotalAmount,
    cartTotalItemsCount,
    createProduct,
    updateProduct,
    toggleProductActive,
    adjustStock,
    restockProduct,
    confirmSale,
    cancelSale,
    refreshData,
    exportBackup,
    importBackup,
    resetToSampleData,
    notifications,
    addNotification,
    dismissNotification,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
