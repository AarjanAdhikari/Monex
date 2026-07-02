import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip as RechartsTooltip } from 'recharts';
import { format, subDays, subMonths, subYears } from 'date-fns';
import { cn, formatNumber } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight } from 'lucide-react';

type TimeFrame = '1D' | '7D' | '1M' | '6M' | '1Y';

interface GraphSectionProps {
  fromCurr: string;
  toCurr: string;
  currentRate: number | null;
  isOffline: boolean;
  theme?: 'light' | 'dark' | 'system';
  onExpand?: (timeframe: '1D' | '7D' | '1M' | '6M' | '1Y') => void;
  refreshTrigger?: number;
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
      <div className="bg-white dark:bg-black shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-white/10 rounded-lg p-3 text-sm flex flex-col gap-1">
        <p className="font-bold text-black dark:text-white">{formatNumber(data.value)} {toCurr}</p>
        <p className="text-xs text-gray-500 font-medium">{dateStr}</p>
      </div>
    );
  }
  return null;
};

export function GraphSection({ fromCurr, toCurr, currentRate, isOffline, theme = 'light', onExpand, refreshTrigger = 0 }: GraphSectionProps) {
  const [timeframe, setTimeframe] = useState<TimeFrame>('1M');
  const [graphData, setGraphData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [hoverData, setHoverData] = useState<any | null>(null);

  useEffect(() => {
    if (!currentRate || !fromCurr || !toCurr) return;

    let mounted = true;
    
    const fetchGraphData = async () => {
      setLoading(true);
      setError(false);
      
      const endDate = new Date();
      let startDate = new Date();
      
      switch (timeframe) {
        case '1D': startDate = subDays(endDate, 2); break; // Frankfurter doesn't have 1D granularity properly
        case '7D': startDate = subDays(endDate, 7); break;
        case '1M': startDate = subMonths(endDate, 1); break;
        case '6M': startDate = subMonths(endDate, 6); break;
        case '1Y': startDate = subYears(endDate, 1); break;
      }

      const startStr = format(startDate, 'yyyy-MM-dd');
      const endStr = format(endDate, 'yyyy-MM-dd');
      
      const cacheKey = `monex_graph_${fromCurr}_${toCurr}_${timeframe}`;
      const cached = localStorage.getItem(cacheKey);
      
      let parsedData: any[] = [];
      let success = false;
      const isForcedRefresh = refreshTrigger > 0;

      // if cached exists, load it instantly
      if (cached && !isForcedRefresh) {
        try {
          parsedData = JSON.parse(cached);
          if (mounted) {
            setGraphData(parsedData);
          }
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
          } else {
             throw new Error("API not ok");
          }
        } catch (e) {
          console.log('Graph fetch error:', e);
          // Fallback to cache if api fails
          if (cached && parsedData.length > 0) {
             success = true;
          }
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
  }, [fromCurr, toCurr, timeframe, currentRate, isOffline, refreshTrigger]);

  const hasData = graphData.length >= 2;
  const firstVal = hasData ? graphData[0].value : currentRate || 0;
  const lastVal = hasData ? graphData[graphData.length - 1].value : currentRate || 0;

  const activeValue = hoverData ? hoverData.value : (currentRate || lastVal);
  const activeDate = hoverData ? hoverData.date : '';

  const change = (currentRate || lastVal) - firstVal;
  const percent = firstVal ? (change / firstVal) * 100 : 0;
  
  const isUp = change > 0;
  const isDown = change < 0;

  const resolvedTheme = typeof document !== 'undefined' 
    ? (document.documentElement.classList.contains('dark') ? 'dark' : 'light') 
    : theme;
    
  const strokeColor = isUp ? "#16a34a" : isDown ? "#dc2626" : (resolvedTheme === 'dark' ? "#ffffff" : "#000000");

  const generateInsight = () => {
    if (!hasData || !firstVal) return null;
    const absPercent = Math.abs(percent);
    
    const maxVal = Math.max(...graphData.map(d => d.value));
    const minVal = Math.min(...graphData.map(d => d.value));
    const volatilityPercent = ((maxVal - minVal) / firstVal) * 100;

    let timeText = '';
    if (timeframe === '1D') timeText = 'today';
    else if (timeframe === '7D') timeText = 'this week';
    else if (timeframe === '1M') timeText = 'this month';
    else if (timeframe === '6M') timeText = 'over the past 6 months';
    else timeText = 'this year';

    if (volatilityPercent > 5 && absPercent < 2) {
      return `${fromCurr} has shown increased volatility against ${toCurr} ${timeText}.`;
    }
    if (absPercent < 0.5) {
      return `${fromCurr} has remained relatively stable against ${toCurr} ${timeText}.`;
    }
    if (isUp) {
       return `${fromCurr} has strengthened slightly against ${toCurr} ${timeText}.`;
    } else {
       return `${fromCurr} has weakened slightly against ${toCurr} ${timeText}.`;
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div 
        onClick={() => onExpand?.(timeframe)}
        className={cn("bg-white dark:bg-[#1C1C1E] rounded-[28px] p-6 lg:p-8 flex-1 flex flex-col min-h-[300px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden", onExpand && "cursor-pointer group hover:bg-gray-50 dark:hover:bg-[#252528] transition-colors")}
      >
      
      {/* Header Info */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">{fromCurr} <ArrowRight size={14} className="opacity-80" strokeWidth={3} /> {toCurr}</h3>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-black dark:text-white transition-all">{formatNumber(activeValue)}</span>
          </div>
        </div>
        
        {hasData && (
          <div className={cn("text-right", isUp ? "text-green-600 dark:text-green-400" : isDown ? "text-red-600 dark:text-red-400" : "text-black dark:text-white")}>
            <p className="text-sm font-bold flex items-center justify-end gap-1">
              {isUp ? '+' : ''}{formatNumber(change)} ({isUp ? '+' : ''}{percent.toFixed(2)}%)
            </p>
            <p className="text-[11px] font-semibold text-gray-400 mt-0.5">{activeDate || 'Latest'}</p>
          </div>
        )}
      </div>

      {/* Graph Area */}
      <div className="flex-1 w-full relative h-[180px]">
        {hasData ? (
          <ResponsiveContainer width="100%" height={180} minWidth={1} minHeight={1} style={{ outline: 'none', border: 'none' }}>
            <LineChart 
              data={graphData} 
              margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
              className="focus:outline-none focus-visible:outline-none"
              onMouseMove={(e: any) => {
                if (e.activePayload) setHoverData(e.activePayload[0].payload);
              }}
              onMouseLeave={() => setHoverData(null)}
              style={{ outline: "none", border: "none" }}
            >
              <XAxis hide={false} axisLine={{ strokeOpacity: 0.1 }} tickLine={false} dataKey="date" tick={{ fontSize: 10, fill: '#888', fontWeight: 500 }} minTickGap={30} dy={10} />
              <YAxis domain={['auto', 'auto']} hide={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888', fontWeight: 500 }} width={55} tickFormatter={(val) => {
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
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: strokeColor }}
                animationDuration={300}
                animationEasing="ease-out"
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-400 font-medium text-[15px]">No trend data available</p>
          </div>
        )}
      </div>

      {/* Time Filters */}
      <div className="flex justify-between items-center mt-6">
        {(['1D', '7D', '1M', '6M', '1Y'] as TimeFrame[]).map((tf) => (
          <button
            key={tf}
            onClick={(e) => {
              e.stopPropagation();
              setTimeframe(tf);
            }}
            className={cn(
              "text-[13px] font-bold px-3 py-1.5 rounded-full transition-all border",
              timeframe === tf 
                ? "bg-gray-200 text-black border-transparent dark:bg-white dark:text-black dark:border-white" 
                : "bg-transparent border-transparent text-gray-400 hover:text-black hover:bg-gray-50 dark:bg-black dark:border-white/10 dark:text-white"
            )}
          >
            {tf}
          </button>
        ))}
      </div>
      
      {isOffline && (
         <p className="absolute bottom-4 right-4 text-[10px] uppercase font-bold text-gray-400">Using saved data</p>
      )}
      </div>

      {hasData && !isOffline && (
        <div className="bg-gray-100 dark:bg-white/10 rounded-full px-6 py-4 md:py-3 flex flex-row items-center gap-3 w-full">
          <div className="flex items-center gap-1.5 opacity-60 shrink-0">
            <div className="w-4 h-4 rounded-full border border-black dark:border-white flex items-center justify-center">
               <span className="text-[10px] font-bold text-black dark:text-white">i</span>
            </div>
            <span className="text-[11px] md:text-[12px] font-bold uppercase tracking-widest text-black dark:text-white mt-0.5 hidden sm:block">Trend Insight</span>
          </div>
          <p className="text-[12px] md:text-[13px] font-medium text-black dark:text-white leading-tight flex-1">
            {generateInsight()}
          </p>
        </div>
      )}
    </div>
  );
}
