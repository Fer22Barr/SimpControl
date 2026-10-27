import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDateTime, formatDate } from '../../utils/formatters';
import { Movement } from '../../types';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  History,
  CheckCircle2,
  FileJson,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  AlertCircle,
  ShieldCheck,
  Search,
  Filter
} from 'lucide-react';

export const BackupSection: React.FC = () => {
  const {
    products,
    sales,
    movements,
    exportBackup,
    importBackup,
    resetToSampleData,
    addNotification,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'backup' | 'movements'>('backup');

  // Import states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImportData, setPendingImportData] = useState<any | null>(null);
  const [importSummary, setImportSummary] = useState<{
    productsCount: number;
    salesCount: number;
    movementsCount: number;
    exportedAt: string;
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Movements Tab filters
  const [movementSearch, setMovementSearch] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('all');

  // Export JSON file
  const handleExport = async () => {
    try {
      const data = await exportBackup();
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const link = document.createElement('a');
      link.href = url;
      link.download = `simpcontrol-respaldo-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addNotification('success', 'Copia de seguridad descargada exitosamente.');
    } catch (err: any) {
      addNotification('error', 'Error al exportar los datos: ' + err.message);
    }
  };

  // Select file to import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Validation
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('El archivo no tiene formato JSON válido.');
        }
        if (!Array.isArray(parsed.products) || !Array.isArray(parsed.sales) || !Array.isArray(parsed.movements)) {
          throw new Error('Estructura incompatible. El archivo debe contener productos, ventas y movimientos.');
        }

        setPendingImportData(parsed);
        setImportSummary({
          productsCount: parsed.products.length,
          salesCount: parsed.sales.length,
          movementsCount: parsed.movements.length,
          exportedAt: parsed.exportedAt || 'Fecha no especificada',
        });
      } catch (err: any) {
        setImportError(err.message || 'Error al procesar el archivo seleccionado.');
        setPendingImportData(null);
        setImportSummary(null);
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Confirm and Execute Import
  const handleExecuteImport = async () => {
    if (!pendingImportData) return;
    try {
      setIsImporting(true);
      await importBackup(pendingImportData);
      setPendingImportData(null);
      setImportSummary(null);
    } catch (err: any) {
      setImportError(err.message || 'Error al restaurar los datos.');
    } finally {
      setIsImporting(false);
    }
  };

  // Movements filter
  const filteredMovements = useMemo(() => {
    let list = [...movements];

    if (movementTypeFilter !== 'all') {
      list = list.filter((m) => m.type === movementTypeFilter);
    }

    const q = movementSearch.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (m) =>
          m.productName.toLowerCase().includes(q) ||
          m.productId.toLowerCase().includes(q) ||
          (m.reason && m.reason.toLowerCase().includes(q)) ||
          (m.saleId && m.saleId.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [movements, movementTypeFilter, movementSearch]);

  const getMovementBadge = (type: Movement['type']) => {
    switch (type) {
      case 'existencia_inicial':
        return {
          label: 'Existencia Inicial',
          icon: <PlusCircle className="w-3.5 h-3.5 text-blue-600" />,
          color: 'bg-blue-50 text-blue-800 border-blue-200',
        };
      case 'ingreso_mercaderia':
        return {
          label: 'Ingreso / Reposición',
          icon: <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />,
          color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        };
      case 'venta':
        return {
          label: 'Venta',
          icon: <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />,
          color: 'bg-rose-50 text-rose-800 border-rose-200',
        };
      case 'anulacion_venta':
        return {
          label: 'Anulación de Venta',
          icon: <RefreshCw className="w-3.5 h-3.5 text-amber-600" />,
          color: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      case 'ajuste_manual':
        return {
          label: 'Ajuste Manual',
          icon: <AlertCircle className="w-3.5 h-3.5 text-purple-600" />,
          color: 'bg-purple-50 text-purple-800 border-purple-200',
        };
      default:
        return {
          label: type,
          icon: null,
          color: 'bg-gray-100 text-gray-800',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Gestión de Datos y Auditoría
            </h2>
            <p className="text-xs text-gray-500">
              Respaldos JSON y registro histórico de movimientos de inventario
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'backup'
                ? 'bg-white text-gray-900 shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Exportar / Importar
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'movements'
                ? 'bg-white text-gray-900 shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Movimientos ({movements.length})
          </button>
        </div>
      </div>

      {activeTab === 'backup' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: EXPORTAR */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Exportar Datos (JSON)</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Descarga un archivo JSON completo que contiene todos tus productos, precios de costo y venta, existencias actuales, historial íntegro de ventas y auditoría de movimientos.
              </p>

              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80 text-xs text-gray-600 space-y-1">
                <p className="font-semibold text-gray-800">Contenido a exportar:</p>
                <ul className="list-disc list-inside text-[11px] text-gray-500 space-y-0.5">
                  <li>{products.length} productos registrados</li>
                  <li>{sales.length} transacciones de venta</li>
                  <li>{movements.length} movimientos de inventario</li>
                </ul>
              </div>
            </div>

            <button
              onClick={handleExport}
              className="w-full py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Archivo JSON</span>
            </button>
          </div>

          {/* Card 2: IMPORTAR */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Importar Datos (JSON)</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Restaura información desde una copia de seguridad previamente descargada. El sistema validará la estructura antes de aplicar los cambios.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
                id="import-file-input"
              />

              {importError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  Seguridad en la importación:
                </p>
                <p className="text-[11px] text-amber-800 leading-tight">
                  Se requiere confirmación explícita antes de sobrescribir. Si el archivo no es válido, tus datos actuales permanecerán intactos.
                </p>
              </div>
            </div>

            <label
              htmlFor="import-file-input"
              className="w-full py-3 px-4 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs shadow-2xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-gray-600" />
              <span>Seleccionar Archivo JSON</span>
            </label>
          </div>

          {/* Quick Actions / Reset & Sample Data */}
          <div className="md:col-span-2 bg-gray-50 p-5 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Datos de Demostración
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Restaura los productos y transacciones de ejemplo para pruebas de SimpControl
              </p>
            </div>
            <button
              onClick={() => {
                if (window.confirm('¿Deseas restaurar los datos de ejemplo iniciales? Se reemplazarán los datos actuales.')) {
                  resetToSampleData();
                }
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 transition-colors shadow-2xs flex items-center gap-2 shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
              <span>Cargar Datos de Ejemplo</span>
            </button>
          </div>
        </div>
      ) : (
        /* Movements Audit Log Tab */
        <div className="space-y-4">
          {/* Controls */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por producto, motivo o N° de operación..."
                value={movementSearch}
                onChange={(e) => setMovementSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50/80 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            {/* Type selector */}
            <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-gray-400 ml-1" />
              <select
                value={movementTypeFilter}
                onChange={(e) => setMovementTypeFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-hidden cursor-pointer"
              >
                <option value="all">Todos los Tipos</option>
                <option value="venta">Ventas</option>
                <option value="ingreso_mercaderia">Ingresos / Reposiciones</option>
                <option value="ajuste_manual">Ajustes Manuales</option>
                <option value="anulacion_venta">Anulaciones</option>
                <option value="existencia_inicial">Existencias Iniciales</option>
              </select>
            </div>
          </div>

          {/* Movements table */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200/80 text-gray-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Fecha y Hora</th>
                    <th className="py-3 px-4">Producto</th>
                    <th className="py-3 px-4">Tipo de Movimiento</th>
                    <th className="py-3 px-4 text-center">Transición</th>
                    <th className="py-3 px-4 text-right">Variación</th>
                    <th className="py-3 px-4">Motivo / Referencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400">
                        No se encontraron movimientos registrados con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map((m) => {
                      const badge = getMovementBadge(m.type);
                      const change = m.newStock - m.previousStock;

                      return (
                        <tr key={m.id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap font-mono text-gray-600">
                            {formatDateTime(m.timestamp)}
                          </td>
                          <td className="py-3 px-4 font-bold text-gray-900 max-w-xs truncate">
                            <span className="font-mono text-gray-400 font-normal mr-1.5">
                              {m.productId}
                            </span>
                            {m.productName}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${badge.color}`}
                            >
                              {badge.icon}
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap font-mono">
                            <span className="text-gray-400">{m.previousStock}</span>
                            <span className="text-gray-300 mx-1.5">→</span>
                            <span className="font-bold text-gray-900">{m.newStock} u.</span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold">
                            <span
                              className={
                                change > 0
                                  ? 'text-emerald-600'
                                  : change < 0
                                  ? 'text-rose-600'
                                  : 'text-gray-500'
                              }
                            >
                              {change > 0 ? `+${change}` : change} u.
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600 text-[11px]">
                            {m.reason && <p className="italic">{m.reason}</p>}
                            {m.saleId && (
                              <p className="font-mono text-gray-400">Ref: {m.saleId}</p>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Import */}
      {pendingImportData && importSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-amber-300 overflow-hidden flex flex-col">
            <div className="bg-amber-50 p-5 border-b border-amber-200 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-amber-950">
                  Confirmar Importación de Datos
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  Esta acción reemplazará la información actual por la del archivo.
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs text-gray-700">
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-1.5">
                <p className="font-bold text-gray-900">Resumen del archivo a importar:</p>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-gray-500">Productos:</span>{' '}
                    <strong className="text-gray-900">{importSummary.productsCount}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Ventas:</span>{' '}
                    <strong className="text-gray-900">{importSummary.salesCount}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Movimientos:</span>{' '}
                    <strong className="text-gray-900">{importSummary.movementsCount}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Fecha respaldo:</span>{' '}
                    <span className="text-gray-700">{formatDate(importSummary.exportedAt)}</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-gray-500 leading-tight">
                Asegúrate de haber descargado un respaldo de tus datos actuales si deseas conservarlos antes de continuar.
              </p>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setPendingImportData(null);
                  setImportSummary(null);
                }}
                disabled={isImporting}
                className="px-4 py-2.5 text-xs font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isImporting}
                className="px-5 py-2.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4" />
                {isImporting ? 'Restaurando...' : 'Confirmar e Importar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
