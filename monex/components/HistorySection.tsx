import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatNumber } from '@/lib/utils';
import { format } from 'date-fns';
import { ArrowRight, Clock } from 'lucide-react';

interface HistorySectionProps {
  history: any[];
  onSelect: (entry: any) => void;
  onClear: () => void;
}

export function HistorySection({ history, onSelect, onClear }: HistorySectionProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  return (
    <div className="bg-white text-black dark:bg-[#1C1C1E] dark:text-white rounded-[28px] p-6 lg:p-8 flex flex-col shadow-2xl relative overflow-hidden pointer-events-auto max-h-[85vh] overflow-y-auto scrollbar-hide">
      <div className="flex justify-between items-center mb-6 shrink-0 gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black/5 dark:bg-white/10 rounded-full flex items-center justify-center shrink-0">
            <Clock size={20} className="text-black dark:text-white" />
          </div>
          <h3 className="text-[13px] md:text-base font-black uppercase tracking-widest opacity-80">History</h3>
        </div>
        {history.length > 0 && (
          <button 
            onClick={() => setShowClearConfirm(true)}
            className="text-[13px] md:text-base font-black uppercase tracking-widest text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors shrink-0"
          >
            Clear History
          </button>
        )}
      </div>

      <div className="flex flex-col">
        {history.length === 0 ? (
          <p className="text-sm font-medium opacity-50 py-4 text-center">No recent conversions</p>
        ) : (
          history.slice(0, 15).map((item, idx) => (
            <button 
              key={`${item.id}-${idx}`}
              onClick={() => onSelect(item)}
              className="flex flex-col items-start gap-1 py-4 px-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-colors w-full border-b border-black/5 dark:border-white/5 last:border-0"
            >
              <div className="flex items-center justify-between w-full gap-2">
                <span className="text-xl font-black break-words flex-1 text-left">{new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 }).format(item.amount)} {item.from}</span>
                <ArrowRight size={20} className="opacity-70 shrink-0" strokeWidth={3} />
                <span className="text-xl font-black break-words flex-1 text-right">{new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 }).format(item.result)} {item.to}</span>
              </div>
              <span className="text-sm font-bold opacity-50 uppercase tracking-wider mt-1 w-full text-left">
                {item.date ? format(item.date, 'MMM d, yyyy h:mm a') : 'Recently'}
              </span>
            </button>
          ))
        )}
      </div>

      <AnimatePresence>
        {showClearConfirm && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/40 z-[80] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="bg-white text-black dark:bg-[#1C1C1E] dark:text-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl flex flex-col gap-6"
            >
              <div>
                <h3 className="text-2xl font-bold tracking-tight mb-2">Clear History?</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">This action cannot be undone. All your conversion history will be permanently deleted.</p>
              </div>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 transition-colors text-black dark:text-white font-bold py-3.5 rounded-full"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    onClear();
                    setShowClearConfirm(false);
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 transition-colors text-white font-bold py-3.5 rounded-full"
                >
                  Clear
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
