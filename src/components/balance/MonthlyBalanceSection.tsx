import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatPercentage, MONTH_NAMES_ES } from '../../utils/formatters';
import {
  PieChart,
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  Package,
  Award,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
} from 'lucide-react';

export const MonthlyBalanceSection: React.FC = () => {
  const { sales } = useApp();

  // Get list of available years from sales, defaulting to current year
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12

  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(currentYear);
    sales.forEach((s) => {
      const y = new Date(s.timestamp).getFullYear();
      if (!isNaN(y)) yearsSet.add(y);
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [sales, currentYear]);

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);

  // Calculate monthly stats based on confirmed sales in the selected month & year
  const balance = useMemo(() => {
    const targetMonthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

    const monthSales = sales.filter((s) => {
      return s.status === 'confirmada' && (s.monthStr === targetMonthStr || s.dateStr.startsWith(targetMonthStr));
    });

    let totalIncome = 0;
    let totalCost = 0;
    let unitsSold = 0;
    const productStatsMap = new Map<string, { name: string; units: number; revenue: number }>();

    monthSales.forEach((s) => {
      totalIncome += s.totalAmount;
      totalCost += s.totalCost;

      s.items.forEach((item) => {
        unitsSold += item.quantity;
        const prev = productStatsMap.get(item.productId) || {
          name: item.productName,
          units: 0,
          revenue: 0,
        };
        productStatsMap.set(item.productId, {
          name: item.productName,
          units: prev.units + item.quantity,
          revenue: prev.revenue + item.subtotalSell,
        });
      });
    });

    const grossProfit = totalIncome - totalCost;
    const grossMarginPercentage =
      totalIncome > 0 ? (grossProfit / totalIncome) * 100 : null;

    const topProducts = Array.from(productStatsMap.entries())
      .map(([id, data]) => ({
        productId: id,
        productName: data.name,
        units: data.units,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);

    return {
      year: selectedYear,
      month: selectedMonth,
      monthLabel: `${MONTH_NAMES_ES[selectedMonth - 1]} ${selectedYear}`,
      totalIncome,
      totalCost,
      grossProfit,
      grossMarginPercentage,
      unitsSold,
      salesCount: monthSales.length,
      topProducts,
      averageTicket: monthSales.length > 0 ? totalIncome / monthSales.length : 0,
    };
  }, [sales, selectedYear, selectedMonth]);

  return (
    <div className="space-y-6">
      {/* Header & Date Selector */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Balance Mensual</h2>
            <p className="text-xs text-gray-500">
              Análisis financiero comercial por período (solo ventas confirmadas)
            </p>
          </div>
        </div>

        {/* Month & Year Selectors */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer"
          >
            {MONTH_NAMES_ES.map((name, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer"
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* THREE MAIN HERO CARDS: INGRESOS, COSTOS, BENEFICIO BRUTO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: INGRESOS */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              INGRESOS
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="my-4">
            <p className="text-3xl font-extrabold text-gray-900 font-mono tracking-tight">
              {formatCurrency(balance.totalIncome)}
            </p>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              Importe total de las ventas del período
            </p>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
            <span>Operaciones confirmadas:</span>
            <span className="font-bold text-gray-900">{balance.salesCount}</span>
          </div>
        </div>

        {/* Card 2: COSTOS */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              COSTOS
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>

          <div className="my-4">
            <p className="text-3xl font-extrabold text-gray-700 font-mono tracking-tight">
              {formatCurrency(balance.totalCost)}
            </p>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              Costo total histórico de los productos vendidos
            </p>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
            <span>Unidades vendidas:</span>
            <span className="font-bold text-gray-900">{balance.unitsSold} u.</span>
          </div>
        </div>

        {/* Card 3: BENEFICIO BRUTO */}
        <div
          className={`p-6 rounded-2xl border shadow-2xs relative overflow-hidden flex flex-col justify-between transition-colors ${
            balance.grossProfit >= 0
              ? 'bg-emerald-50/60 border-emerald-200/90'
              : 'bg-rose-50/60 border-rose-200/90'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                balance.grossProfit >= 0 ? 'text-emerald-800' : 'text-rose-800'
              }`}
            >
              BENEFICIO BRUTO
            </span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                balance.grossProfit >= 0
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {balance.grossProfit >= 0 ? (
                <ArrowUpRight className="w-5 h-5" />
              ) : (
                <ArrowDownRight className="w-5 h-5" />
              )}
            </div>
          </div>

          <div className="my-4">
            <p
              className={`text-3xl font-extrabold font-mono tracking-tight ${
                balance.grossProfit >= 0 ? 'text-emerald-900' : 'text-rose-900'
              }`}
            >
              {formatCurrency(balance.grossProfit)}
            </p>
            <p
              className={`text-xs mt-1 font-medium ${
                balance.grossProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              Diferencia entre ingresos y costos de mercadería
            </p>
          </div>

          <div className="pt-3 border-t border-emerald-200/60 flex items-center justify-between text-xs">
            <span className={balance.grossProfit >= 0 ? 'text-emerald-800' : 'text-rose-800'}>
              Margen sobre ventas:
            </span>
            <span
              className={`font-mono font-extrabold px-2 py-0.5 rounded ${
                balance.grossMarginPercentage === null
                  ? 'bg-gray-100 text-gray-500'
                  : balance.grossMarginPercentage >= 0
                  ? 'bg-emerald-200/80 text-emerald-900'
                  : 'bg-rose-200/80 text-rose-900'
              }`}
            >
              {formatPercentage(balance.grossMarginPercentage)}
            </span>
          </div>
        </div>
      </div>

      {/* SECONDARY INDICATORS & TOP PRODUCTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Additional Commercial Stats (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Indicadores Adicionales
            </h3>

            <div className="space-y-3 divide-y divide-gray-100 text-xs">
              <div className="pt-2 first:pt-0 flex items-center justify-between">
                <span className="text-gray-500">Margen Bruto Comercial:</span>
                <span className="font-mono font-bold text-gray-900 text-sm">
                  {formatPercentage(balance.grossMarginPercentage)}
                </span>
              </div>

              <div className="pt-2.5 flex items-center justify-between">
                <span className="text-gray-500">Unidades Totales Vendidas:</span>
                <span className="font-mono font-bold text-gray-900 text-sm">
                  {balance.unitsSold} u.
                </span>
              </div>

              <div className="pt-2.5 flex items-center justify-between">
                <span className="text-gray-500">Operaciones Realizadas:</span>
                <span className="font-mono font-bold text-gray-900 text-sm">
                  {balance.salesCount} ventas
                </span>
              </div>

              <div className="pt-2.5 flex items-center justify-between">
                <span className="text-gray-500">Ticket Promedio:</span>
                <span className="font-mono font-bold text-gray-900 text-sm">
                  {formatCurrency(balance.averageTicket)}
                </span>
              </div>
            </div>
          </div>

          {/* Legal / Transparency Disclaimer Note */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-500 flex items-start gap-2.5 leading-relaxed">
            <Info className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
            <p className="italic">
              &ldquo;Los resultados representan beneficios brutos por ventas. No incluyen gastos operativos ni impuestos.&rdquo;
            </p>
          </div>
        </div>

        {/* Top 5 Products of the Period (8 cols) */}
        <div className="lg:col-span-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Productos Más Vendidos del Período
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Ranking de los 5 artículos con mayor rotación en {balance.monthLabel}
                  </p>
                </div>
              </div>
              <span className="text-xs text-gray-400 font-mono">Top 5</span>
            </div>

            <div className="divide-y divide-gray-100">
              {balance.topProducts.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400">
                  No hay ventas registradas en {balance.monthLabel}.
                </div>
              ) : (
                balance.topProducts.map((p, idx) => {
                  const shareOfTotal =
                    balance.totalIncome > 0
                      ? (p.revenue / balance.totalIncome) * 100
                      : 0;

                  return (
                    <div
                      key={p.productId}
                      className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">
                            {p.productName}
                          </p>
                          <p className="text-[11px] text-gray-400 font-mono">
                            {p.units} {p.units === 1 ? 'unidad vendida' : 'unidades vendidas'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-extrabold text-gray-900 font-mono">
                          {formatCurrency(p.revenue)}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium">
                          {shareOfTotal.toFixed(1)}% de las ventas
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
