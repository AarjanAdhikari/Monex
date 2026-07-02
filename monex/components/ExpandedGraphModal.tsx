import { useState, useEffect } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip as RechartsTooltip } from 'recharts';
import { format } from 'date-fns';
import { cn, formatNumber } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ChevronLeft } from 'lucide-react';

interface Point {
  timestamp: number;
  value: number;
  date: string;
}

interface ExpandedGraphModalProps {
  onClose: () => void;
  fromCurr: string;
  toCurr: string;
  isOffline: boolean;
  theme?: string;
  currentRate?: number;
  initialTimeframe?: '1D' | '7D' | '1M' | '6M' | '1Y';
  refreshTrigger?: number;
  onShowInfo?: () => void;
}

const CustomTooltip = ({ active, payload, toCurr, timeframe }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    let dateStr = data.date;
    if (data.timestamp) {
      const d = new Date(data.timestamp);
      if (timeframe === '1D') dateStr = format(d, 'h:mm a');
      else if (timeframe === '7D') dateStr = format(d, 'EEE');
      else if (timeframe === '1M') dateStr = format(d, 'MMM d');
      else if (timeframe === '6M') dateStr = format(d, 'MMMM');
      else if (timeframe === '1Y') dateStr = format(d, 'MMM yyyy');
    }

    return (
      <div className="bg-white dark:bg-[#1C1C1E] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 dark:border-white/10 rounded-xl p-3 text-sm flex flex-col gap-1 min-w-[120px]">
        <p className="text-gray-500 font-bold text-[11px] uppercase tracking-wider mb-0.5">{dateStr}</p>
        <p className="font-black text-black dark:text-white text-base">{formatNumber(data.value)} {toCurr}</p>
      </div>
    );
  }
  return null;
};

export function ExpandedGraphModal({ onClose, fromCurr, toCurr, isOffline, theme, currentRate, initialTimeframe = '1M', refreshTrigger = 0, onShowInfo }: ExpandedGraphModalProps) {
  const [timeframe, setTimeframe] = useState<'1D' | '7D' | '1M' | '6M' | '1Y'>(initialTimeframe);
  const [graphData, setGraphData] = useState<Point[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [hoverData, setHoverData] = useState<Point | null>(null);
  
  const resolvedTheme = typeof document !== 'undefined' 
    ? (document.documentElement.classList.contains('dark') ? 'dark' : 'light') 
    : theme;

  useEffect(() => {
    let mounted = true;
    
    const fetchGraphData = async () => {
      setLoading(true);
      setError(false);
      setHoverData(null);
      
      const cacheKey = `monex_graph_${fromCurr}_${toCurr}_${timeframe}`;
      const cached = localStorage.getItem(cacheKey);
      let parsedData: Point[] = [];
      let success = false;
      const isForcedRefresh = refreshTrigger > 0;

      if (cached && !isForcedRefresh) {
        try {
          parsedData = JSON.parse(cached);
          if (mounted) setGraphData(parsedData);
        } catch {}
      }

      if (!isOffline) {
        try {
          const res = await fetch(`/api/historical?from=${fromCurr}&to=${toCurr}&range=${timeframe}`);
          if (res.ok) {
            const json = await res.json();
            if (json.points && json.points.length >= 2) {
              parsedData = json.points;
              localStorage.setItem(cacheKey, JSON.stringify(parsedData));
              success = true;
            }
          }
        } catch (e) {
          if (cached && parsedData.length > 0) success = true;
        }
      } else {
        if (cached && parsedData.length > 0) success = true;
      }

      if (mounted) {
        if (success && parsedData.length >= 2) {
          if (currentRate && parsedData.length > 0) {
            const lastPt = parsedData[parsedData.length - 1];
            const todayStr = format(new Date(), 'MMM d');
            if (lastPt.date !== todayStr && lastPt.date !== 'Live') {
              parsedData.push({
                date: 'Live',
                value: currentRate,
                timestamp: Date.now()
              });
            } else {
              parsedData[parsedData.length - 1].value = currentRate;
            }
          }
          setGraphData(parsedData);
        } else {
          setGraphData([]);
          setError(true);
        }
        setLoading(false);
      }
    };

    fetchGraphData();

    return () => { mounted = false; };
  }, [fromCurr, toCurr, timeframe, isOffline, refreshTrigger]);

  const hasData = graphData.length >= 2;
  const firstVal = hasData ? graphData[0].value : (currentRate || 0);
  const lastVal = hasData ? graphData[graphData.length - 1].value : (currentRate || 0);
  const activeValue = hoverData ? hoverData.value : (currentRate || lastVal);
  
  const change = (currentRate || lastVal) - firstVal;
  const percent = firstVal ? (change / firstVal) * 100 : 0;
  const isUp = change > 0;
  const isDown = change < 0;

  const strokeColor = isUp ? "#16a34a" : isDown ? "#dc2626" : (resolvedTheme === 'dark' ? "#ffffff" : "#000000");

  const lastUpdated = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const values = graphData.map(d => d.value);
  const maxVal = values.length > 0 ? Math.max(...values) : null;
  const minVal = values.length > 0 ? Math.min(...values) : null;
  const avgVal = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;

  return (
    <motion.div
       initial={{ x: '100%' }}
       animate={{ x: 0 }}
       exit={{ x: '100%' }}
       transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
       className="fixed inset-0 z-[100] bg-white dark:bg-[#000000] flex flex-col pointer-events-auto"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-center p-6 relative w-full pt-12 md:pt-16">
        <button 
          onClick={onClose}
          className="absolute left-6 w-11 h-11 bg-black/80 dark:bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center transition-opacity hover:opacity-70 active:opacity-50 outline-none shadow-lg"
        >
          <ChevronLeft size={22} className="text-white mr-0.5" strokeWidth={3} />
        </button>
        <h2 className="text-base font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
          {fromCurr} <ArrowRight size={14} className="opacity-80" strokeWidth={3} /> {toCurr}
        </h2>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col px-6 md:px-10 pb-10 w-full max-w-4xl mx-auto h-full overflow-y-auto min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex items-start justify-between min-h-[100px]">
          <div className="flex flex-col">
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-black dark:text-white">
              {activeValue ? formatNumber(activeValue) : '---'}
            </h1>
            {hasData && (
              <p className={cn("text-xl font-bold mt-2", isUp ? "text-green-600 dark:text-green-400" : isDown ? "text-red-600 dark:text-red-400" : "text-black dark:text-white")}>
                {isUp ? '+' : ''}{formatNumber(change)} ({isUp ? '+' : ''}{percent.toFixed(2)}%)
              </p>
            )}
          </div>
        </div>

        <div className="mt-8 mb-8 flex-1 min-h-[300px] h-[350px] max-h-[450px] w-full relative">
          {hasData ? (
             <ResponsiveContainer width="100%" height={350} minWidth={1} minHeight={1} style={{ outline: 'none', border: 'none' }}>
                <LineChart 
                  data={graphData} 
                  margin={{ top: 20, right: 0, left: 0, bottom: 20 }}
                  onMouseMove={(e: any) => {
                    if (e.activePayload) setHoverData(e.activePayload[0].payload);
                  }}
                  onMouseLeave={() => setHoverData(null)}
                  style={{ outline: 'none', border: 'none' }}
                >
                  <XAxis hide={false} axisLine={{ strokeOpacity: 0.1 }} tickLine={false} dataKey="date" tick={{ fontSize: 11, fill: '#888', fontWeight: 500 }} minTickGap={30} dy={15} />
                  <YAxis domain={['auto', 'auto']} hide={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888', fontWeight: 500 }} width={65} tickFormatter={(val) => {
                    if (val >= 1000) return (val/1000).toFixed(1) + 'k';
                    if (val < 0.01) return val.toFixed(5);
                    return val.toFixed(3);
                  }} />
                  <RechartsTooltip 
                    content={<CustomTooltip toCurr={toCurr} timeframe={timeframe} />} 
                    cursor={false} 
                  />
                  <Line 
                    type="linear" 
                    dataKey="value" 
                    stroke={strokeColor} 
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 4, stroke: resolvedTheme === 'dark' ? '#000000' : '#ffffff', fill: strokeColor }}
                    animationDuration={450}
                    animationEasing="ease-out"
                    isAnimationActive={true}
                  />
                </LineChart>
             </ResponsiveContainer>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
               <p className="text-gray-400 font-medium text-lg">{error ? 'No trend data available' : 'Loading...'}</p>
            </div>
          )}
        </div>

        {hasData && maxVal !== null && minVal !== null && avgVal !== null && (
          <div className="grid grid-cols-3 gap-4 mb-8 pt-6">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">High</span>
              <span className="text-lg font-black">{formatNumber(maxVal)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Average</span>
              <span className="text-lg font-black">{formatNumber(avgVal)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Low</span>
              <span className="text-lg font-black">{formatNumber(minVal)}</span>
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-between items-center mx-auto w-full max-w-lg mt-auto mb-8">
          {(['1D', '7D', '1M', '6M', '1Y'] as const).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={cn(
                "py-3 px-3 md:px-5 rounded-full text-sm md:text-base font-bold transition-colors w-full border",
                timeframe === tf 
                  ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white" 
                  : "bg-transparent border-transparent text-gray-400 hover:text-black dark:bg-[#1C1C1E] dark:hover:bg-black dark:border-white/10 dark:text-white"
              )}
            >
              {tf}
            </button>
          ))}
        </div>
        
         <div className="flex flex-col items-center justify-center w-full pb-6">
            <button 
              onClick={onShowInfo}
              className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-2">
                 <div className={cn("w-3 h-3 rounded-full", !isOffline ? "bg-green-500 animate-pulse" : "bg-gray-400")} />
                 <span className="text-sm font-black uppercase tracking-widest opacity-80">
                    {!isOffline ? "LIVE" : "OFFLINE"}
                 </span>
              </div>
              <p className="text-sm font-bold text-gray-400 mt-1.5 opacity-80">
                 {!isOffline ? `Synced at ${lastUpdated}` : "Using saved data"}
              </p>
            </button>
            <p className="text-[13px] font-semibold text-gray-400 mt-4 text-center max-w-[320px]">
              Exchange rates are for informational purposes only and may differ from actual provider rates.
            </p>
         </div>
      </div>
    </motion.div>
  );
}
