import { Product, Sale, Movement, CartItem, SaleItem, BackupData } from '../types';
import { generateProductId, generateSaleId, generateMovementId } from '../utils/formatters';
import { INITIAL_SAMPLE_PRODUCTS, INITIAL_SAMPLE_SALES, INITIAL_SAMPLE_MOVEMENTS } from './sampleData';

const DB_NAME = 'SimpControlDB';
const DB_VERSION = 1;

class SimpControlDB {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = request.result;

        // Products Store
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'id' });
          productStore.createIndex('name', 'name', { unique: false });
          productStore.createIndex('active', 'active', { unique: false });
          productStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Sales Store
        if (!db.objectStoreNames.contains('sales')) {
          const salesStore = db.createObjectStore('sales', { keyPath: 'id' });
          salesStore.createIndex('timestamp', 'timestamp', { unique: false });
          salesStore.createIndex('status', 'status', { unique: false });
          salesStore.createIndex('monthStr', 'monthStr', { unique: false });
          salesStore.createIndex('dateStr', 'dateStr', { unique: false });
        }

        // Movements Store
        if (!db.objectStoreNames.contains('movements')) {
          const moveStore = db.createObjectStore('movements', { keyPath: 'id' });
          moveStore.createIndex('productId', 'productId', { unique: false });
          moveStore.createIndex('timestamp', 'timestamp', { unique: false });
          moveStore.createIndex('type', 'type', { unique: false });
        }
      };

      request.onsuccess = async () => {
        const db = request.result;

        // Check if database is brand new and needs initial seed
        try {
          const count = await this.countItems(db, 'products');
          if (count === 0) {
            await this.seedInitialData(db);
          }
        } catch (e) {
          console.warn('SimpControl: could not check product count on init', e);
        }

        resolve(db);
      };

      request.onerror = () => {
        reject(new Error(`Error al abrir IndexedDB: ${request.error?.message || 'Desconocido'}`));
      };
    });

    return this.dbPromise;
  }

  private countItems(db: IDBDatabase, storeName: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const countReq = store.count();
      countReq.onsuccess = () => resolve(countReq.result);
      countReq.onerror = () => reject(countReq.error);
    });
  }

  private seedInitialData(db: IDBDatabase): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['products', 'sales', 'movements'], 'readwrite');
      const prodStore = tx.objectStore('products');
      const salesStore = tx.objectStore('sales');
      const moveStore = tx.objectStore('movements');

      INITIAL_SAMPLE_PRODUCTS.forEach((p) => prodStore.put(p));
      INITIAL_SAMPLE_SALES.forEach((s) => salesStore.put(s));
      INITIAL_SAMPLE_MOVEMENTS.forEach((m) => moveStore.put(m));

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- PRODUCTS ---

  async getProducts(): Promise<Product[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('products', 'readonly');
      const store = tx.objectStore('products');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async getProduct(id: string): Promise<Product | null> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('products', 'readonly');
      const store = tx.objectStore('products');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async createProduct(data: {
    name: string;
    costPrice: number;
    sellPrice: number;
    initialStock: number;
    minStock: number;
  }): Promise<Product> {
    const db = await this.openDB();
    const existing = await this.getProducts();
    const now = new Date();
    const nowIso = now.toISOString();

    const newProduct: Product = {
      id: generateProductId(existing.length),
      name: data.name.trim(),
      costPrice: Math.max(0, data.costPrice),
      sellPrice: Math.max(0, data.sellPrice),
      initialStock: Math.max(0, Math.floor(data.initialStock)),
      currentStock: Math.max(0, Math.floor(data.initialStock)),
      minStock: Math.max(0, Math.floor(data.minStock)),
      createdAt: nowIso,
      updatedAt: nowIso,
      active: true,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(['products', 'movements'], 'readwrite');
      const prodStore = tx.objectStore('products');
      const moveStore = tx.objectStore('movements');

      prodStore.add(newProduct);

      // Record initial inventory movement if initialStock > 0
      if (newProduct.initialStock > 0) {
        const movement: Movement = {
          id: generateMovementId(),
          timestamp: now.getTime(),
          dateISO: nowIso,
          productId: newProduct.id,
          productName: newProduct.name,
          type: 'existencia_inicial',
          quantity: newProduct.initialStock,
          previousStock: 0,
          newStock: newProduct.initialStock,
          reason: 'Inventario inicial',
        };
        moveStore.add(movement);
      }

      tx.oncomplete = () => resolve(newProduct);
      tx.onerror = () => reject(tx.error);
    });
  }

  async updateProduct(
    id: string,
    updates: {
      name: string;
      costPrice: number;
      sellPrice: number;
      minStock: number;
    }
  ): Promise<Product> {
    const db = await this.openDB();
    const existing = await this.getProduct(id);
    if (!existing) {
      throw new Error(`Producto ${id} no encontrado.`);
    }

    const updated: Product = {
      ...existing,
      name: updates.name.trim(),
      costPrice: Math.max(0, updates.costPrice),
      sellPrice: Math.max(0, updates.sellPrice),
      minStock: Math.max(0, Math.floor(updates.minStock)),
      updatedAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('products', 'readwrite');
      const store = tx.objectStore('products');
      const req = store.put(updated);
      req.onsuccess = () => resolve(updated);
      req.onerror = () => reject(req.error);
    });
  }

  async setProductActive(id: string, active: boolean): Promise<Product> {
    const db = await this.openDB();
    const existing = await this.getProduct(id);
    if (!existing) {
      throw new Error(`Producto ${id} no encontrado.`);
    }

    const updated: Product = {
      ...existing,
      active,
      updatedAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('products', 'readwrite');
      const store = tx.objectStore('products');
      const req = store.put(updated);
      req.onsuccess = () => resolve(updated);
      req.onerror = () => reject(req.error);
    });
  }

  // --- STOCK ADJUSTMENT & REPLENISHMENT ---

  async adjustStock(productId: string, newStock: number, reason: string): Promise<Product> {
    if (!reason || !reason.trim()) {
      throw new Error('El motivo del ajuste es obligatorio.');
    }
    if (newStock < 0 || !Number.isInteger(newStock)) {
      throw new Error('La nueva cantidad de existencias debe ser un número entero no negativo.');
    }

    const db = await this.openDB();
    const product = await this.getProduct(productId);
    if (!product) {
      throw new Error(`Producto ${productId} no encontrado.`);
    }

    const previousStock = product.currentStock;
    const diff = Math.abs(newStock - previousStock);
    const now = new Date();
    const nowIso = now.toISOString();

    const updatedProduct: Product = {
      ...product,
      currentStock: newStock,
      updatedAt: nowIso,
    };

    const movement: Movement = {
      id: generateMovementId(),
      timestamp: now.getTime(),
      dateISO: nowIso,
      productId: product.id,
      productName: product.name,
      type: 'ajuste_manual',
      quantity: diff,
      previousStock,
      newStock,
      reason: reason.trim(),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(['products', 'movements'], 'readwrite');
      tx.objectStore('products').put(updatedProduct);
      tx.objectStore('movements').add(movement);

      tx.oncomplete = () => resolve(updatedProduct);
      tx.onerror = () => reject(tx.error);
    });
  }

  async restockProduct(productId: string, quantityToAdd: number, note?: string): Promise<{ product: Product; movement: Movement }> {
    if (quantityToAdd <= 0 || !Number.isInteger(quantityToAdd)) {
      throw new Error('La cantidad a ingresar debe ser un número entero mayor a cero.');
    }

    const db = await this.openDB();
    const product = await this.getProduct(productId);
    if (!product) {
      throw new Error(`Producto ${productId} no encontrado.`);
    }

    const previousStock = product.currentStock;
    const newStock = previousStock + quantityToAdd;
    const now = new Date();
    const nowIso = now.toISOString();

    const updatedProduct: Product = {
      ...product,
      currentStock: newStock,
      updatedAt: nowIso,
    };

    const movement: Movement = {
      id: generateMovementId(),
      timestamp: now.getTime(),
      dateISO: nowIso,
      productId: product.id,
      productName: product.name,
      type: 'ingreso_mercaderia',
      quantity: quantityToAdd,
      previousStock,
      newStock,
      reason: note && note.trim() ? note.trim() : 'Reposición de mercadería',
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(['products', 'movements'], 'readwrite');
      tx.objectStore('products').put(updatedProduct);
      tx.objectStore('movements').add(movement);

      tx.oncomplete = () => resolve({ product: updatedProduct, movement });
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- SALES ---

  async registerSale(cartItems: CartItem[]): Promise<Sale> {
    if (!cartItems || cartItems.length === 0) {
      throw new Error('El carrito de venta está vacío.');
    }

    const db = await this.openDB();

    // Consolidate duplicate products if any in cart
    const consolidatedMap = new Map<string, number>();
    for (const item of cartItems) {
      if (item.quantity <= 0 || !Number.isInteger(item.quantity)) {
        throw new Error(`Cantidad inválida para ${item.product.name}. Debe ser un entero positivo.`);
      }
      const prev = consolidatedMap.get(item.product.id) || 0;
      consolidatedMap.set(item.product.id, prev + item.quantity);
    }

    // Step 1: Pre-verify all stock in a single readonly pass
    const allProducts = await this.getProducts();
    const productMap = new Map<string, Product>();
    allProducts.forEach((p) => productMap.set(p.id, p));

    for (const [prodId, requestedQty] of consolidatedMap.entries()) {
      const p = productMap.get(prodId);
      if (!p) {
        throw new Error(`Producto con ID ${prodId} no existe en catálogo.`);
      }
      if (!p.active) {
        throw new Error(`El producto "${p.name}" está descontinuado y no puede venderse.`);
      }
      if (p.currentStock < requestedQty) {
        throw new Error(
          `Stock insuficiente. Producto: ${p.name}. Disponibles: ${p.currentStock}. Solicitadas: ${requestedQty}`
        );
      }
    }

    // Step 2: Atomic transaction - update stock, add movements, record sale
    const now = new Date();
    const nowIso = now.toISOString();
    const timestamp = now.getTime();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const monthStr = `${yyyy}-${mm}`;
    const saleId = generateSaleId();

    const saleItems: SaleItem[] = [];
    let totalAmount = 0;
    let totalCost = 0;

    const movementsToAdd: Movement[] = [];
    const productsToUpdate: Product[] = [];

    for (const [prodId, requestedQty] of consolidatedMap.entries()) {
      const p = productMap.get(prodId)!;
      const subCost = requestedQty * p.costPrice;
      const subSell = requestedQty * p.sellPrice;

      totalCost += subCost;
      totalAmount += subSell;

      saleItems.push({
        productId: p.id,
        productName: p.name,
        quantity: requestedQty,
        unitCostPrice: p.costPrice,
        unitSellPrice: p.sellPrice,
        subtotalCost: subCost,
        subtotalSell: subSell,
      });

      const previousStock = p.currentStock;
      const newStock = previousStock - requestedQty;

      productsToUpdate.push({
        ...p,
        currentStock: newStock,
        updatedAt: nowIso,
      });

      movementsToAdd.push({
        id: generateMovementId(),
        timestamp,
        dateISO: nowIso,
        productId: p.id,
        productName: p.name,
        type: 'venta',
        quantity: requestedQty,
        previousStock,
        newStock,
        saleId,
      });
    }

    const sale: Sale = {
      id: saleId,
      timestamp,
      dateISO: nowIso,
      dateStr,
      monthStr,
      items: saleItems,
      totalAmount,
      totalCost,
      grossProfit: totalAmount - totalCost,
      status: 'confirmada',
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(['products', 'sales', 'movements'], 'readwrite');
      const prodStore = tx.objectStore('products');
      const salesStore = tx.objectStore('sales');
      const moveStore = tx.objectStore('movements');

      // Update products
      for (const prod of productsToUpdate) {
        prodStore.put(prod);
      }

      // Add movements
      for (const mov of movementsToAdd) {
        moveStore.add(mov);
      }

      // Add sale
      salesStore.add(sale);

      tx.oncomplete = () => resolve(sale);
      tx.onerror = () => reject(tx.error);
    });
  }

  async cancelSale(saleId: string): Promise<Sale> {
    const db = await this.openDB();

    // Retrieve sale
    const sale: Sale | null = await new Promise((resolve, reject) => {
      const tx = db.transaction('sales', 'readonly');
      const req = tx.objectStore('sales').get(saleId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });

    if (!sale) {
      throw new Error(`La venta ${saleId} no fue encontrada.`);
    }

    if (sale.status === 'anulada') {
      throw new Error(`La venta ${saleId} ya se encuentra anulada.`);
    }

    // Retrieve products
    const allProducts = await this.getProducts();
    const productMap = new Map<string, Product>();
    allProducts.forEach((p) => productMap.set(p.id, p));

    const now = new Date();
    const nowIso = now.toISOString();
    const timestamp = now.getTime();

    const movementsToAdd: Movement[] = [];
    const productsToUpdate: Product[] = [];

    // Reintegrate units for ALL items in sale
    for (const item of sale.items) {
      const p = productMap.get(item.productId);
      if (p) {
        const previousStock = p.currentStock;
        const newStock = previousStock + item.quantity;

        productsToUpdate.push({
          ...p,
          currentStock: newStock,
          updatedAt: nowIso,
        });

        movementsToAdd.push({
          id: generateMovementId(),
          timestamp,
          dateISO: nowIso,
          productId: p.id,
          productName: p.name,
          type: 'anulacion_venta',
          quantity: item.quantity,
          previousStock,
          newStock,
          saleId: sale.id,
          reason: `Anulación de venta ${sale.id}`,
        });
      }
    }

    const updatedSale: Sale = {
      ...sale,
      status: 'anulada',
      cancelledAt: nowIso,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(['products', 'sales', 'movements'], 'readwrite');
      const prodStore = tx.objectStore('products');
      const salesStore = tx.objectStore('sales');
      const moveStore = tx.objectStore('movements');

      for (const prod of productsToUpdate) {
        prodStore.put(prod);
      }

      for (const mov of movementsToAdd) {
        moveStore.add(mov);
      }

      salesStore.put(updatedSale);

      tx.oncomplete = () => resolve(updatedSale);
      tx.onerror = () => reject(tx.error);
    });
  }

  async getSales(): Promise<Sale[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sales', 'readonly');
      const store = tx.objectStore('sales');
      const req = store.getAll();
      req.onsuccess = () => {
        const list = req.result || [];
        // Sort newest first
        list.sort((a, b) => b.timestamp - a.timestamp);
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  }

  // --- MOVEMENTS ---

  async getMovements(productId?: string): Promise<Movement[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('movements', 'readonly');
      const store = tx.objectStore('movements');
      const req = store.getAll();
      req.onsuccess = () => {
        let list: Movement[] = req.result || [];
        if (productId) {
          list = list.filter((m) => m.productId === productId);
        }
        list.sort((a, b) => b.timestamp - a.timestamp);
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  }

  // --- BACKUP & RESTORE ---

  async exportBackup(): Promise<BackupData> {
    const [products, sales, movements] = await Promise.all([
      this.getProducts(),
      this.getSales(),
      this.getMovements(),
    ]);

    return {
      version: '1.0.0',
      appName: 'SimpControl',
      exportedAt: new Date().toISOString(),
      products,
      sales,
      movements,
    };
  }

  async importBackup(data: any): Promise<{ success: boolean; message: string; stats: { products: number; sales: number; movements: number } }> {
    // Validate schema
    if (!data || typeof data !== 'object') {
      throw new Error('El archivo no contiene un JSON válido.');
    }
    if (!Array.isArray(data.products) || !Array.isArray(data.sales) || !Array.isArray(data.movements)) {
      throw new Error('Estructura de respaldo incompatible. Faltan productos, ventas o movimientos.');
    }

    // Validate products array items
    for (const p of data.products) {
      if (!p.id || !p.name || typeof p.costPrice !== 'number' || typeof p.sellPrice !== 'number') {
        throw new Error(`Producto inválido detectado: ${p?.name || p?.id || 'sin datos'}.`);
      }
    }

    // Validate sales array items
    for (const s of data.sales) {
      if (!s.id || !Array.isArray(s.items) || typeof s.totalAmount !== 'number') {
        throw new Error(`Registro de venta inválido detectado: ${s?.id || 'sin ID'}.`);
      }
    }

    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(['products', 'sales', 'movements'], 'readwrite');
      const prodStore = tx.objectStore('products');
      const salesStore = tx.objectStore('sales');
      const moveStore = tx.objectStore('movements');

      // Clear existing
      prodStore.clear();
      salesStore.clear();
      moveStore.clear();

      // Put all
      data.products.forEach((p: Product) => prodStore.put(p));
      data.sales.forEach((s: Sale) => salesStore.put(s));
      data.movements.forEach((m: Movement) => moveStore.put(m));

      tx.oncomplete = () => {
        resolve({
          success: true,
          message: 'Base de datos restaurada con éxito.',
          stats: {
            products: data.products.length,
            sales: data.sales.length,
            movements: data.movements.length,
          },
        });
      };

      tx.onerror = () => {
        reject(new Error(`Error al restaurar los datos: ${tx.error?.message || 'Error desconocido'}`));
      };
    });
  }

  async resetToSampleData(): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['products', 'sales', 'movements'], 'readwrite');
      const prodStore = tx.objectStore('products');
      const salesStore = tx.objectStore('sales');
      const moveStore = tx.objectStore('movements');

      prodStore.clear();
      salesStore.clear();
      moveStore.clear();

      INITIAL_SAMPLE_PRODUCTS.forEach((p) => prodStore.put(p));
      INITIAL_SAMPLE_SALES.forEach((s) => salesStore.put(s));
      INITIAL_SAMPLE_MOVEMENTS.forEach((m) => moveStore.put(m));

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async clearAllData(): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['products', 'sales', 'movements'], 'readwrite');
      tx.objectStore('products').clear();
      tx.objectStore('sales').clear();
      tx.objectStore('movements').clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const dbService = new SimpControlDB();
