import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from')?.toUpperCase();
  const to = searchParams.get('to')?.toUpperCase();
  const range = searchParams.get('range');
  
  if (!from || !to || !range) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  // Map ranges to Yahoo Finance parameters
  const rangeMap: Record<string, { range: string, interval: string }> = {
    '1D': { range: '1d', interval: '5m' },
    '7D': { range: '7d', interval: '30m' },
    '1M': { range: '1mo', interval: '1d' },
    '6M': { range: '6mo', interval: '1d' },
    '1Y': { range: '1y', interval: '1d' },
  };

  const config = rangeMap[range] || rangeMap['1M'];

  async function fetchYahooData(symbol: string) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${config.range}&interval=${config.interval}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.chart || !data.chart.result || data.chart.result.length === 0) return null;
    return data.chart.result[0];
  }

  try {
    let resultFromUsdToFrom = null;
    let resultFromUsdToTo = null;
    let directResult = null;

    // Fast path: if USD is involved, we don't need cross rates
    if (from === 'USD') {
      directResult = await fetchYahooData(`USD${to}=X`) || await fetchYahooData(`${to}=X`);
    } else if (to === 'USD') {
      const invData = await fetchYahooData(`USD${from}=X`) || await fetchYahooData(`${from}=X`);
      if (invData) {
        // invert quotes
        directResult = invData;
        directResult.indicators.quote[0].close = directResult.indicators.quote[0].close.map((q: number | null) => q !== null && q !== 0 ? 1 / q : null);
      }
    }

    // Try direct pair first just in case
    if (!directResult && from !== 'USD' && to !== 'USD') {
      directResult = await fetchYahooData(`${from}${to}=X`);
      if (!directResult) {
         // Fallback to cross rates
         const data1 = fetchYahooData(`USD${from}=X`);
         const data2 = fetchYahooData(`USD${to}=X`);
         const [res1, res2] = await Promise.all([data1, data2]);
         
         if (res1 && res2) {
           const ts1 = res1.timestamp || [];
           const ts2 = res2.timestamp || [];
           const q1 = res1.indicators.quote[0].close || [];
           const q2 = res2.indicators.quote[0].close || [];
           
           // Align timestamps (they might slightly differ, so we can use a map or find nearest)
           // For simplicity, we just use ts1 and look up the closest matching ts2
           // Actually, since they are both daily or 15m intervals, timestamps should largely overlap.
           // Let's create a map for res2
           const q2Map = new Map();
           for (let i = 0; i < ts2.length; i++) {
             q2Map.set(ts2[i], q2[i]);
           }

           const newQ = [];
           const newTs = [];
           for (let i = 0; i < ts1.length; i++) {
             const t = ts1[i];
             const val1 = q1[i];
             // find exact or nearest in map. Let's just do exact for now.
             let val2 = q2Map.get(t);
             if (val2 === undefined) {
               // Try to find a nearby point within 1 hour
               for (const [t2, v2] of q2Map.entries()) {
                 if (Math.abs(t2 - t) <= 3600) {
                   val2 = v2;
                   break;
                 }
               }
             }

             if (val1 != null && val2 != null && val1 !== 0) {
               newQ.push(val2 / val1);
               newTs.push(t);
             }
           }
           
           directResult = {
             timestamp: newTs,
             indicators: {
               quote: [{ close: newQ }]
             }
           };
         }
      }
    }

    if (!directResult) {
      return NextResponse.json({ error: 'No data' }, { status: 404 });
    }
    
    const timestamps = directResult.timestamp || [];
    const quotes = directResult.indicators.quote[0].close || [];
    
    const points = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (quotes[i] != null && !isNaN(quotes[i])) {
        const d = new Date(timestamps[i] * 1000);
        let dateStr = '';
        if (range === '1D') dateStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        else if (range === '7D') dateStr = d.toLocaleDateString([], { weekday: 'short', hour: '2-digit' });
        else if (range === '1M') dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        else dateStr = d.toLocaleDateString([], { month: 'short', year: '2-digit' });
        
        points.push({
          date: dateStr,
          timestamp: timestamps[i] * 1000,
          value: quotes[i]
        });
      }
    }
    
    return NextResponse.json({ points });
  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
