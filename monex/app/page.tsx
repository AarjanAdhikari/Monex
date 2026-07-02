'use client';

import React, { useState, useEffect, useRef, UIEvent, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowDownUp, Star, Search, Settings, Clock, BarChart3, WifiOff, X, ChevronDown, ChevronUp, Check, ChevronLeft, Globe, User, Plane, TrendingUp, Briefcase, Laptop, ShoppingBag, Send, Landmark, ArrowUp, ArrowRight, Loader } from 'lucide-react';
import { CURRENCIES } from '@/lib/currencies';
import { useExchangeRates } from '@/hooks/use-exchange-rates';
import { cn, formatNumber, vibrate } from '@/lib/utils';
import { useSettings, AppSettings } from './hooks/use-settings';
import { GraphSection } from '@/components/GraphSection';
import { HistorySection } from '@/components/HistorySection';
import { ExpandedGraphModal } from '@/components/ExpandedGraphModal';

// Helper to deduce continent accurately for grouping
const getContinent = (code: string) => {
  const eur = ['EUR','GBP','CHF','SEK','NOK','DKK','CZK','HUF','PLN','RUB','BGN','HRK','RON','RSD','ALL','BAM','GIP','ISK','MDL','MKD', 'JEP', 'IMP', 'FOK'];
  const sam = ['BRL','ARS','COP','CLP','PEN','VES','UYU','BOB','PYG','GYD','SRD','FKP'];
  const nam = ['USD','CAD','MXN','HTG','JMD','TTD','BBD','BSD','BZD','XCD','PAB','NIO','HNL','SVC','GTQ','CRC','DOP','CUP','ANG','AWG','BMD','KYD'];
  const afr = ['ZAR','NGN','EGP','KES','GHS','TZS','UGX','DZD','MAD','AOA','XAF','XOF','MWK','ZMW','MZN','BWP','NAD','SDG','ETB','SOS','RWF','BIF','CDF','LYD','TND','GNF','SLL','LRD','DJF','ERN','SZL','LSL','MGA','MUR','SCR','CVE','STN','KMF','SHP'];
  const oce = ['AUD','NZD','FJD','PGK','SBD','VUV','WST','TOP','KID','XPF'];
  
  if (eur.includes(code)) return 'Europe';
  if (sam.includes(code)) return 'South America';
  if (nam.includes(code)) return 'North America';
  if (afr.includes(code)) return 'Africa';
  if (oce.includes(code)) return 'Oceania';
  return 'Asia';
};

const UNIQUE_CURRENCIES = Array.from(new Map(CURRENCIES.map(c => [c.code, c])).values())
  .sort((a, b) => a.name.localeCompare(b.name))
  .map(c => ({ ...c, continent: getContinent(c.code) }));

const screenScaleTransition = { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] as const };

const screenVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
  }),
  center: {
    x: 0,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-100%' : '100%',
  }),
};

const CurrencyItem = memo(({ currency, isSelected, onSelect }: { currency: any, isSelected: boolean, onSelect: (code: string) => void }) => {
  return (
    <button
      onClick={() => { vibrate(); onSelect(currency.code); }}
      className={cn(
        "w-full flex items-center justify-between p-4 md:p-5 rounded-full transition-all duration-200 border-2",
        isSelected 
          ? "bg-black text-white shadow-xl border-black active:scale-[0.998]" 
          : "bg-white text-black hover:bg-gray-50 border-gray-100"
      )}
    >
       <div className="flex items-center gap-4">
         <span className={cn(
           "text-3xl w-12 h-12 flex items-center justify-center rounded-full transition-colors",
           currency.code === 'XDR' 
              ? (isSelected ? "bg-white/20 dark:bg-white/10 text-white" : "bg-white text-black border border-gray-100 dark:border-transparent") 
              : (isSelected ? "bg-white/10 dark:bg-black/10" : "bg-gray-100 dark:bg-white/10")
         )}>
           {currency.code === 'XDR' ? (
             <Landmark size={22} className={cn("text-current")} strokeWidth={2.2} />
           ) : (
             <span>{currency.flag}</span>
           )}
         </span>
         <div className="flex flex-col text-left">
           <span className="text-xl font-bold tracking-tight leading-tight">{currency.code}</span>
           <span className={cn(
             "text-sm font-medium transition-colors",
             isSelected ? "text-white/70" : "text-gray-500"
           )}>{currency.name}</span>
         </div>
       </div>
       {isSelected && (
         <motion.div
           initial={{ scale: 0 }}
           animate={{ scale: 1 }}
           className="w-8 h-8 rounded-full bg-white flex items-center justify-center mr-2 shadow-sm"
         >
           <Check size={18} className="text-black" strokeWidth={3} />
         </motion.div>
       )}
    </button>
  );
}, (prev, next) => prev.isSelected === next.isSelected && prev.currency.code === next.currency.code);

CurrencyItem.displayName = "CurrencyItem";

type AppState = 'splash' | 'tagline' | 'onboarding-base' | 'onboarding-usage' | 'onboarding-ready' | 'main';

export default function MonexApp() {
  const [appState, setAppState] = useState<AppState>('splash');
  const [direction, setDirection] = useState<number>(1);
  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [taglineAnimated, setTaglineAnimated] = useState(false);

  const navigate = (next: AppState, dir: number) => {
    setDirection(dir);
    setAppState(next);
  };

  useEffect(() => {
    // Only run this sequence on initial load
    const timer1 = setTimeout(() => {
      navigate('tagline', 1);
    }, 3000); // 3s splash
    return () => {
      clearTimeout(timer1);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black overflow-hidden w-full relative">
      <AnimatePresence mode="sync" custom={direction}>
        {appState === 'splash' && <SplashScreen key="splash" direction={direction} />}
        {appState === 'tagline' && 
          <TaglineScreen 
            key="tagline" 
            direction={direction}
            alreadyAnimated={taglineAnimated}
            onCompleteAnimation={() => { setTaglineAnimated(true); }}
            onNext={() => navigate('onboarding-base', 1)} 
          />
        }
        {appState === 'onboarding-base' && 
          <OnboardingBaseScreen 
            key="onboard-base" 
            direction={direction}
            onBack={() => navigate('tagline', -1)} 
            onSelect={(code) => { 
              setBaseCurrency(code);
              try {
                const s = localStorage.getItem('monex_settings');
                const parsed = s ? JSON.parse(s) : {};
                parsed.defaultBaseCurrency = code;
                localStorage.setItem('monex_settings', JSON.stringify(parsed));
                // Update specific from/to storage as well if a fresh user
                localStorage.setItem('monex_from', code);
              } catch {}
              navigate('onboarding-usage', 1); 
            }} 
          />
        }
        {appState === 'onboarding-usage' && 
          <OnboardingUsageScreen 
            key="onboard-usage" 
            direction={direction}
            onBack={() => navigate('onboarding-base', -1)} 
            onNext={() => navigate('onboarding-ready', 1)} 
          />
        }
        {appState === 'onboarding-ready' && 
          <OnboardingReadyScreen 
            key="onboard-ready" 
            direction={direction}
            onComplete={() => {
              localStorage.setItem('monex_has_visited', 'true');
              localStorage.setItem('monex_just_onboarded', 'true');
              navigate('main', 1);
            }} 
          />
        }
        {appState === 'main' && 
          <MainScreen 
            key="main" 
            direction={direction}
            initialFrom={baseCurrency} 
          />
        }
      </AnimatePresence>

      <AnimatePresence>
        {(appState === 'onboarding-base' || appState === 'onboarding-usage') && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-12 left-0 right-0 z-[60] flex justify-center items-center gap-2 pointer-events-none"
          >
             <div className={cn("h-1.5 rounded-full bg-black dark:bg-white transition-all duration-500", appState === 'onboarding-base' ? "w-12" : "w-8 opacity-20")}></div>
             <div className={cn("h-1.5 rounded-full bg-black dark:bg-white transition-all duration-500", appState === 'onboarding-usage' ? "w-12" : "w-8 opacity-20")}></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SplashScreen({ direction }: { direction: number }) {
  return (
    <motion.div
      variants={screenVariants}
      custom={direction}
      initial="enter"
      animate="center"
      exit="exit"
      transition={screenScaleTransition}
      className="w-full min-h-screen flex items-center justify-center bg-white absolute inset-0 z-50"
    >
      <motion.div
        initial={{ backgroundPosition: "150% 0" }}
        animate={{ backgroundPosition: "-50% 0" }}
        transition={{ duration: 3, ease: "linear" }}
        className="text-6xl md:text-8xl font-bold tracking-[0.15em] uppercase bg-[length:200%_100%] bg-clip-text text-transparent"
        style={{
          backgroundImage: `linear-gradient(110deg, #000 40%, rgba(255,255,255,0.95) 50%, #000 60%)`,
        }}
      >
        MONEX
      </motion.div>
    </motion.div>
  );
}

function TaglineScreen({ direction, alreadyAnimated, onCompleteAnimation, onNext }: { direction: number, alreadyAnimated: boolean, onCompleteAnimation: () => void, onNext: () => void }) {
  const text = "Money, simplified.";
  
  useEffect(() => {
    if (!alreadyAnimated) {
      const timer = setTimeout(() => {
        onCompleteAnimation();
      }, 7200); // Wait until AFTER all animations finish to flag as complete
      return () => clearTimeout(timer);
    }
  }, [alreadyAnimated, onCompleteAnimation]);

  return (
    <motion.div
      variants={screenVariants}
      custom={direction}
      initial="enter"
      animate="center"
      exit="exit"
      transition={screenScaleTransition}
      className="w-full min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center absolute inset-0 z-40 overflow-hidden"
    >
      <div className="flex-1 flex items-center justify-center w-full relative">
        {/* Logo Animation */}
        <div className="absolute flex flex-col items-center justify-center pointer-events-none w-full" style={{ bottom: 'calc(50% + 4.5rem)' }}>
          <motion.div
            initial={alreadyAnimated ? { opacity: 1, x: 0 } : { opacity: 0, x: -80 }}
            animate={{ opacity: 1, x: 0 }}
            transition={alreadyAnimated ? { duration: 0 } : { duration: 1.0, delay: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
            className="flex items-center justify-center relative z-10"
          >
            <ArrowRight size={56} strokeWidth={3.5} className="text-black dark:text-white" />
          </motion.div>
          <motion.div
            initial={alreadyAnimated ? { opacity: 1, x: 0 } : { opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            transition={alreadyAnimated ? { duration: 0 } : { duration: 1.0, delay: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
            className="flex items-center justify-center -mt-[8px] relative z-0"
          >
            <ArrowRight size={56} strokeWidth={3.5} className="text-black dark:text-white rotate-180" />
          </motion.div>
        </div>

        {/* Fixed string layout to prevent font-shaking via layout thrashing */}
        <div className="text-[11.5vw] sm:text-6xl md:text-7xl lg:text-8xl font-medium tracking-tighter w-full text-black flex flex-nowrap justify-center py-4 overflow-visible leading-none whitespace-pre relative items-baseline">
          {text.split('').map((char, index) => (
            <span key={index} className="inline-block relative overflow-visible">
              <motion.span
                initial={alreadyAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={alreadyAnimated ? { duration: 0 } : {
                  duration: 0.8,
                  delay: 0.8 + index * 0.247,
                  ease: [0.2, 0.8, 0.2, 1]
                }}
                className="inline-block will-change-transform will-change-opacity antialiased render-crispEDGE"
              >
                {char}
              </motion.span>
            </span>
          ))}
        </div>
      </div>
      
      <div className="absolute w-full bottom-0 left-0 px-6 md:px-10 pb-12 pb-safe flex justify-center pointer-events-none">
        <motion.button
          onClick={onNext}
          initial={alreadyAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={alreadyAnimated ? { duration: 0 } : { duration: 0.8, ease: [0.2, 0.8, 0.2, 1], delay: 6.2 }}
          className="w-full max-w-xl flex items-center justify-center gap-3 py-6 bg-black text-white text-[24px] font-bold rounded-full pointer-events-auto shadow-2xl will-change-transform will-change-opacity"
        >
          <span>Get Started</span>
          <ArrowRight size={28} strokeWidth={3} className="mt-0.5" />
        </motion.button>
      </div>
    </motion.div>
  );
}

function OnboardingBaseScreen({ direction, onSelect, onBack, isSelectorMode = false }: { direction: number, onSelect: (code: string) => void, onBack: () => void, isSelectorMode?: boolean }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [collapsedContinents, setCollapsedContinents] = useState<Record<string, boolean>>({});
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // Show scroll to top only when within 20px of the bottom
    setShowScrollTop(scrollHeight - scrollTop <= clientHeight + 20);
  };

  const toggleContinent = (continent: string) => {
    setCollapsedContinents(prev => ({ ...prev, [continent]: !prev[continent] }));
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleSelect = (code: string) => {
    if (isSelectorMode) {
      onSelect(code);
    } else {
      setSelected(prev => prev === code ? null : code);
    }
  };

  // Only exact relevance checks
  const filtered = UNIQUE_CURRENCIES.filter(c => {
    if (!search) return true;
    const lowerSearch = search.toLowerCase().trim();
    return c.code.toLowerCase() === lowerSearch || c.name.toLowerCase().includes(lowerSearch);
  });

  const grouped = filtered.reduce((acc, curr) => {
    if (!acc[curr.continent]) acc[curr.continent] = [];
    acc[curr.continent].push(curr);
    return acc;
  }, {} as Record<string, typeof UNIQUE_CURRENCIES>);

  const continentsOrder = ['Asia', 'Europe', 'Africa', 'North America', 'South America', 'Oceania'];

  const selectorVariants = {
    enter: { y: '100%' },
    center: { y: 0 },
    exit: { y: '100%' }
  };

  return (
    <motion.div
      variants={isSelectorMode ? selectorVariants : screenVariants}
      custom={direction}
      initial="enter"
      animate="center"
      exit="exit"
      transition={isSelectorMode ? { type: "spring", damping: 28, stiffness: 260 } : screenScaleTransition}
      className={cn("w-full min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col absolute inset-0", isSelectorMode ? "z-[70] fixed" : "z-40 absolute")}
    >
      <div className="w-full shrink-0 flex items-center justify-center relative pt-6 h-20 mb-4 px-6 md:px-10 max-w-5xl mx-auto">
        {isSelectorMode && (
          <button 
            onClick={onBack}
            className="absolute left-6 md:left-10 z-50 w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center pointer-events-auto hover:opacity-80 transition-opacity cursor-pointer"
          >
            <X size={20} strokeWidth={2.5} className="text-white dark:text-black" />
          </button>
        )}
      </div>

      <div className="px-6 md:px-10 shrink-0 max-w-3xl mx-auto w-full flex flex-col items-center">
        <h2 className="text-[2.2rem] md:text-5xl font-bold tracking-tight mb-6 text-center text-black dark:text-white">
          {isSelectorMode ? "Select currency" : "Choose your base currency"}
        </h2>
        <div className="relative w-full max-w-xl">
          <Search size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black dark:group-focus-within:text-black transition-colors" />
          <input 
            type="text" 
            placeholder="Search countries"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus={false}
            className="w-full bg-white dark:bg-white rounded-full py-4 pl-14 pr-12 text-lg font-medium outline-none border border-gray-200 dark:border-transparent shadow-sm focus:border-black dark:focus:border-black focus:ring-1 focus:ring-black dark:focus:ring-black transition-all text-black dark:text-black placeholder:text-gray-400 dark:placeholder:text-gray-400"
          />
          {search.length > 0 && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black dark:hover:text-white transition-colors"
            >
              <X size={22} />
            </button>
          )}
        </div>
      </div>
      
      <div onScroll={handleScroll} className="flex-1 overflow-y-auto px-6 md:px-10 pb-36 max-w-3xl mx-auto w-full scrollbar-hide" ref={scrollRef}>
        <div className="max-w-xl mx-auto">
          {continentsOrder.map(continent => {
            const items = grouped[continent];
            if (!items || items.length === 0) return null;
            const isCollapsed = collapsedContinents[continent];
            
            return (
              <div key={continent} className="mb-6 last:mb-0">
                <button 
                  onClick={() => toggleContinent(continent)}
                  className="flex items-center justify-between w-full py-2 hover:opacity-70 transition-opacity px-4 md:px-5"
                >
                  <h3 className="text-[17px] font-bold text-black dark:text-white flex items-center gap-2 tracking-wide" style={{ fontVariant: 'small-caps' }}>
                    {continent.toLowerCase()} <span><Globe size={18} className="text-black dark:text-white" /></span>
                  </h3>
                  {isCollapsed ? <ChevronDown size={20} className="text-black dark:text-white" /> : <ChevronUp size={20} className="text-black dark:text-white" />}
                </button>
                
                {!isCollapsed && (
                  <div className="pt-3 flex flex-col gap-3">
                    {items.map(currency => (
                      <CurrencyItem 
                        key={currency.code} 
                        currency={currency} 
                        isSelected={selected === currency.code} 
                        onSelect={handleToggleSelect} 
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-lg">
               No currency matches found.
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selected && !isSelectorMode && (
          <motion.div 
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="absolute bottom-0 left-0 w-full p-8 pb-12 pb-safe flex justify-center bg-gradient-to-t from-[#F9F9F9] via-[#F9F9F9] to-transparent pointer-events-none"
          >
            <button
              onClick={() => onSelect(selected)}
              className="flex items-center justify-center gap-3 px-[18%] md:px-20 py-6 bg-black text-white text-[24px] font-bold rounded-full w-[90%] sm:w-auto pointer-events-auto"
            >
              <span>Continue</span>
              <ArrowRight size={28} strokeWidth={3} className="mt-0.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showScrollTop && (
          <motion.button 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 w-12 h-12 rounded-full bg-black dark:bg-white flex items-center justify-center pointer-events-auto shadow-sm"
          >
            <ChevronUp className="text-white dark:text-black" size={24} strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function OnboardingUsageScreen({ direction, onNext, onBack }: { direction: number, onNext: () => void, onBack: () => void }) {
  const options = [
    { id: "Personal use", icon: User },
    { id: "Travel", icon: Plane },
    { id: "Trading", icon: TrendingUp },
    { id: "Business", icon: Briefcase },
    { id: "Freelancing", icon: Laptop },
    { id: "Shopping", icon: ShoppingBag },
    { id: "Remittance", icon: Send },
    { id: "Investing", icon: Landmark }
  ];
  const [selected, setSelected] = useState<string[]>([]);

  const handleToggleSelect = (opt: string) => {
    setSelected(prev => prev.includes(opt) ? prev.filter(p => p !== opt) : [...prev, opt]);
  };

  return (
    <motion.div
      variants={screenVariants}
      custom={direction}
      initial="enter"
      animate="center"
      exit="exit"
      transition={screenScaleTransition}
      className="w-full min-h-screen flex flex-col bg-white dark:bg-black text-black dark:text-white absolute inset-0 z-40"
    >
      <div className="w-full shrink-0 flex items-center justify-center relative pt-6 h-20 mb-4 px-6 md:px-10 max-w-5xl mx-auto">
        <button 
          onClick={onBack}
          className="absolute left-6 md:left-10 z-50 w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center pointer-events-auto hover:opacity-80 transition-opacity"
        >
          <ChevronLeft className="text-white dark:text-black" size={24} strokeWidth={2.5} />
        </button>
      </div>

      <div className="px-6 md:px-10 shrink-0 max-w-3xl mx-auto w-full flex flex-col items-center">
        <h2 className="text-[2.2rem] md:text-5xl font-bold tracking-tight mb-8 text-center text-black dark:text-white">What do you use most?</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-36 max-w-3xl mx-auto w-full scrollbar-hide">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          {options.map(opt => {
            const isSelected = selected.includes(opt.id);
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => handleToggleSelect(opt.id)}
                className={cn(
                  "flex items-center justify-between p-4 md:p-5 rounded-full transition-all duration-300",
                  isSelected 
                    ? "bg-black dark:bg-white text-white dark:text-black shadow-lg" 
                    : "bg-white dark:bg-black text-black dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 border border-gray-100 dark:border-white/10"
                )}
              >
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "w-12 h-12 flex items-center justify-center rounded-full transition-colors shrink-0",
                    isSelected ? "bg-white/10 dark:bg-black/10" : "bg-gray-100 dark:bg-white/10"
                  )}>
                    <Icon size={22} className={isSelected ? "text-white dark:text-black" : "text-black dark:text-white"} strokeWidth={2.2} />
                  </span>
                  <span className="text-xl font-bold tracking-tight">{opt.id}</span>
                </div>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-8 h-8 rounded-full bg-white dark:bg-black flex items-center justify-center shrink-0 shadow-sm mr-2"
                  >
                    <Check size={18} className="text-black dark:text-white" strokeWidth={3} />
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div 
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="absolute bottom-0 left-0 w-full p-8 pb-12 pb-safe flex justify-center bg-gradient-to-t from-[#F9F9F9] via-[#F9F9F9] to-transparent pointer-events-none"
          >
            <button
              onClick={() => onNext()}
              className="flex items-center justify-center gap-3 px-[18%] md:px-20 py-6 bg-black text-white text-[24px] font-bold rounded-full w-[90%] sm:w-auto pointer-events-auto"
            >
              <span>Continue</span>
              <ArrowRight size={28} strokeWidth={3} className="mt-0.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function OnboardingReadyScreen({ direction, onComplete }: { direction: number, onComplete: () => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setExiting(true), 1400);
    const timer2 = setTimeout(onComplete, 1800);
    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, [onComplete]);

  return (
    <motion.div
      variants={screenVariants}
      custom={direction}
      initial="enter"
      animate="center"
      exit="exit"
      transition={screenScaleTransition}
      className="w-full min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black text-black dark:text-white px-6 text-center absolute inset-0 z-40"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={exiting ? { opacity: 0, y: 40, scale: 0.95 } : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: exiting ? 0.4 : 0.8, delay: exiting ? 0 : 0.2, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <div className="ios-spinner mb-8 scale-110">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="spinner-blade w-[1.5px] h-[7px] bg-black rounded-full" style={{ position: 'absolute', left: '50%', transform: `rotate(${i * 30}deg) translate(0, -180%)`, animation: 'iosSpinnerFade 1.2s linear infinite', animationDelay: `-${1.2 - i * 0.1}s` }}></div>
          ))}
        </div>
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">You&apos;re ready.</h2>
        <p className="text-xl md:text-2xl font-medium text-gray-500 tracking-tight">Fast, accurate conversions. Instantly.</p>
      </motion.div>
    </motion.div>
  );
}

function MainScreen({ direction, initialFrom = "USD" }: { direction: number, initialFrom?: string }) {
  const { settings, updateSetting, loaded: settingsLoaded } = useSettings();
  const [amount, setAmount] = useState<string>("1");
  const [fromCurr, setFromCurr] = useState(initialFrom);
  const [toCurr, setToCurr] = useState("USD");
  const [showSelector, setShowSelector] = useState<'from' | 'to' | 'settings_base' | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [showExpandedGraph, setShowExpandedGraph] = useState<'1D' | '7D' | '1M' | '6M' | '1Y' | null>(null);
  const [history, setHistory] = useState<{ id: string, from: string, to: string, amount: number, result: number, date: number }[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Use offlineMode setting to pass to useExchangeRates if supported, otherwise just use it
  const { rates, loading, error, isOffline, lastUpdated, convert, refresh } = useExchangeRates(fromCurr, settings.offlineMode);

  const numericAmount = parseFloat(amount.replace(/,/g, '')) || 0;
  const convertedResult = convert(numericAmount, toCurr);
  const [swapRotation, setSwapRotation] = useState(0);
  
  // Pull-to-refresh state
  const [startY, setStartY] = useState<number | null>(null);
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const onTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY <= 0 && !isRefreshing) {
      setStartY(e.touches[0].clientY);
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startY !== null && !isRefreshing) {
      const y = e.touches[0].clientY;
      const dist = y - startY;
      if (dist > 0 && window.scrollY <= 0) {
        setPullY(Math.min(dist * 0.5, 100));
      } else {
        setPullY(0);
      }
    }
  };
  const onTouchEnd = async () => {
    if (pullY > 60 && !isRefreshing) {
      setIsRefreshing(true);
      await refresh();
      setRefreshTrigger(prev => prev + 1);
      setIsRefreshing(false);
    }
    setStartY(null);
    setPullY(0);
  };
  
  // Formatters
  const formatInputWithCommas = (val: string) => {
    const numericPart = val.replace(/[^\d.]/g, '');
    const parts = numericPart.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  // Load history and main state
  useEffect(() => {
    if (!settingsLoaded || isLoaded) return;
    try {
      const savedHistory = localStorage.getItem('monex_history');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (savedHistory) setHistory(JSON.parse(savedHistory));
      
      if (settings.rememberLastUsed) {
        const savedAmount = localStorage.getItem('monex_amount');
        const savedFrom = localStorage.getItem('monex_from');
        const savedTo = localStorage.getItem('monex_to');
        
        // Only load saved state if the user hasn't explicitly just completed onboarding with a new currency.
        // During init, initialFrom is the choice from onboarding.
        const isFreshOnboarding = localStorage.getItem('monex_just_onboarded');
        
        if (isFreshOnboarding === 'true') {
           setFromCurr(initialFrom);
           setToCurr("USD"); // As requested, fix to USD.
           localStorage.removeItem('monex_just_onboarded');
        } else {
           if (savedAmount) setAmount(savedAmount);
           if (savedFrom) setFromCurr(savedFrom);
           if (savedTo) setToCurr(savedTo);
        }
      } else {
        setFromCurr(settings.defaultBaseCurrency);
        setToCurr("USD");
      }
    } catch {}
    setIsLoaded(true);
  }, [settingsLoaded, settings.rememberLastUsed, settings.defaultBaseCurrency, initialFrom, isLoaded]);

  // Save main state on change
  useEffect(() => {
    if (!isLoaded || !settings.rememberLastUsed) return;
    try {
      localStorage.setItem('monex_amount', amount);
      localStorage.setItem('monex_from', fromCurr);
      localStorage.setItem('monex_to', toCurr);
    } catch {}
  }, [amount, fromCurr, toCurr, isLoaded, settings.rememberLastUsed]);

  // Save to history debounced
  useEffect(() => {
    if (!settings.saveHistory) return;
    if (numericAmount > 0 && convertedResult !== null && fromCurr !== toCurr) {
      const timer = setTimeout(() => {
        const entry = {
          id: Date.now().toString(),
          from: fromCurr,
          to: toCurr,
          amount: numericAmount,
          result: convertedResult,
          date: Date.now()
        };
        setHistory(prev => {
          // don't duplicate identical consecutive entries
          if (prev.length > 0 && prev[0].from === entry.from && prev[0].to === entry.to && prev[0].amount === entry.amount) return prev;
          const newHist = [entry, ...prev].slice(0, 50); // Keep last 50
          try { localStorage.setItem('monex_history', JSON.stringify(newHist)); } catch {}
          return newHist;
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericAmount, convertedResult, fromCurr, toCurr]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    let cleanVal = rawVal.replace(/[^\d.]/g, '');
    if ((cleanVal.match(/\./g) || []).length > 1) return;
    if (cleanVal.length > 1 && cleanVal.startsWith('0') && !cleanVal.startsWith('0.')) {
      cleanVal = cleanVal.replace(/^0+/, '');
      if (cleanVal === '') cleanVal = '0';
    }
    setAmount(formatInputWithCommas(cleanVal));
  };

  const handleSwap = () => {
    vibrate();
    setFromCurr(toCurr);
    setToCurr(fromCurr);
    setSwapRotation(prev => prev + 180);
  };

  // Prevent zooming on inputs in iOS but keeping things accessible
  return (
    <motion.div
      key="main"
      variants={screenVariants}
      custom={direction}
      initial="enter"
      animate="center"
      exit="exit"
      transition={screenScaleTransition}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="absolute inset-0 z-40 w-[100vw] overflow-x-hidden min-h-screen flex flex-col bg-white dark:bg-black overflow-y-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] relative"
    >
      {/* Pull down indicator overlay */}
      <motion.div 
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: isRefreshing ? 20 : pullY - 40, opacity: pullY > 10 || isRefreshing ? 1 : 0 }}
        transition={isRefreshing ? { type: 'spring', damping: 20, stiffness: 300 } : { duration: 0 }}
        className="absolute top-0 left-0 w-full flex items-center justify-center pointer-events-none z-50 pt-safe"
      >
        <div className="bg-white dark:bg-[#1C1C1E] shadow-lg rounded-full p-2.5">
          <Loader size={24} className={cn("text-black dark:text-white", isRefreshing ? "animate-spin" : "")} style={{ transform: `rotate(${pullY * 4}deg)` }} />
        </div>
      </motion.div>
      <div className="flex-1 w-full max-w-5xl mx-auto pt-6 px-6 md:px-10 pb-10 relative min-h-screen flex flex-col pointer-events-auto">
        {/* Header */}
        <header className="h-20 flex items-center justify-between border-b border-gray-50 dark:border-transparent pb-4 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold tracking-tighter uppercase">MONEX</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex gap-4 text-sm font-semibold text-gray-400">
              <span className="text-black dark:text-white">Converter</span>
              <span>Markets</span>
              <span>Alerts</span>
            </div>
            <button onClick={() => setShowSettings(true)} className="w-10 h-10 rounded-full bg-transparent flex items-center justify-center cursor-pointer">
              <Settings size={28} className="text-gray-900 dark:text-white transition-colors" />
            </button>
          </div>
        </header>

        {/* Offline Badge Mobile Fallback */}
        {isOffline && (
          <div className="lg:hidden flex items-center gap-2 mb-4 text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950 px-3 py-1.5 rounded-full w-fit">
            <WifiOff size={14} />
            Offline Mode
          </div>
        )}

        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:py-6">
          <section className="col-span-1 lg:col-span-7 flex flex-col justify-center gap-2">
            {/* FROM CARD */}
            <div className="bg-black text-white dark:bg-white dark:text-black rounded-[28px] p-6 lg:p-8 shadow-2xl relative transition-transform overflow-hidden">
              <div className="flex justify-between items-center sm:items-start flex-col sm:flex-row gap-4">
                <div className="flex-1 flex flex-col items-center sm:items-start group">
                  <p className="text-[13px] uppercase tracking-[0.2em] font-bold opacity-50 mb-3 w-full text-center sm:text-left">Convert From</p>
                  <button 
                    onClick={() => setShowSelector('from')}
                    className="flex flex-col items-center sm:items-start cursor-pointer w-fit group-hover:opacity-80 transition-opacity"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-4xl font-bold tracking-tight">{fromCurr}</span>
                      <ChevronDown size={20} className="text-gray-500 group-hover:text-white dark:group-hover:text-black transition-colors" />
                    </div>
                    <p className="text-[13px] font-normal opacity-80 mt-2 w-full text-center sm:text-left">{CURRENCIES.find(c => c.code === fromCurr)?.name}</p>
                  </button>
                </div>
                <div className="w-full sm:w-1/2 flex justify-start sm:justify-end">
                  <input 
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="0"
                    className="w-full bg-transparent sm:text-right text-5xl md:text-7xl font-light tracking-tighter outline-none placeholder:text-white/20 dark:placeholder:text-black/20 select-text"
                  />
                </div>
              </div>
            </div>

            {/* SWAP BUTTON */}
            <div className="flex justify-center -my-8 lg:-my-10 relative z-20">
              <button 
                onClick={handleSwap}
                className="w-14 h-14 lg:w-16 lg:h-16 bg-white dark:bg-black border-[3px] border-black dark:border-white rounded-full flex items-center justify-center shadow-xl group cursor-pointer"
              >
                <motion.div 
                  animate={{ rotate: swapRotation }} 
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="w-full h-full flex items-center justify-center cursor-pointer"
                >
                  <ArrowDownUp size={22} className="text-black dark:text-white" />
                </motion.div>
              </button>
            </div>

            {/* TO CARD */}
            <div className="bg-black text-white dark:bg-white dark:text-black rounded-[28px] p-6 lg:p-8 shadow-2xl overflow-hidden">
              <div className="flex justify-between items-center sm:items-start flex-col sm:flex-row gap-4">
                <div className="flex-1 flex flex-col items-center sm:items-start group">
                  <p className="text-[13px] uppercase tracking-[0.2em] font-bold opacity-50 mb-3 w-full text-center sm:text-left">Convert To</p>
                  <button 
                    onClick={() => setShowSelector('to')}
                    className="flex flex-col items-center sm:items-start cursor-pointer w-fit group-hover:opacity-80 transition-opacity"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-4xl font-bold tracking-tight">{toCurr}</span>
                      <ChevronDown size={20} className="text-gray-500 group-hover:text-white dark:group-hover:text-black transition-colors" />
                    </div>
                    <p className="text-[13px] font-normal opacity-80 mt-2 w-full text-center sm:text-left">{CURRENCIES.find(c => c.code === toCurr)?.name}</p>
                  </button>
                </div>
                <div className="w-full sm:w-1/2 flex justify-start sm:justify-end overflow-x-auto scrollbar-hide">
                  <p className="text-5xl md:text-7xl font-light tracking-tighter whitespace-nowrap select-text sm:text-right">
                    {convertedResult !== null ? formatNumber(convertedResult) : '--'}
                  </p>
                </div>
              </div>
            </div>

            {/* QUICK AMOUNTS */}
            <div className="flex gap-3 mt-6 lg:mt-10 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6 lg:mx-0 lg:px-0">
              {[1, 10, 50, 100, 500, 1000].map(val => (
                <button
                  key={val}
                  onClick={() => setAmount(formatInputWithCommas(val.toString()))}
                  className={cn(
                    "px-6 lg:px-8 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-colors flex-shrink-0 border",
                    parseFloat(amount.replace(/,/g, '')) === val
                      ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-lg shadow-black/20" 
                      : "bg-gray-50 dark:bg-black border-gray-100 dark:border-white/10 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                  )}
                >
                  {new Intl.NumberFormat('en-US').format(val)}
                </button>
              ))}
            </div>
          </section>

          <section className="col-span-1 lg:col-span-5 flex flex-col gap-6">
            {/* Live Market Rate */}
            <div className="bg-gray-50 dark:bg-white/5 rounded-full px-8 py-6 border border-gray-100 dark:border-white/10 flex flex-col justify-center min-h-[128px]">
              <div className="flex justify-between items-center mb-1">
                <button 
                  onClick={() => { vibrate(); setShowInfoPopup(true); }}
                  className="text-[12px] lg:text-[13px] font-black uppercase tracking-widest text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                >
                  Live Market Rate
                </button>
                <div className="flex items-center gap-2">
                  {!isOffline && <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>}
                  <button 
                    onClick={() => { vibrate(); setShowInfoPopup(true); }}
                    className={cn("text-xs font-bold hover:opacity-70 transition-opacity", isOffline ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400")}
                  >
                    {isOffline ? 'Offline' : 'LIVE'}
                  </button>
                </div>
              </div>
              <button 
                onClick={() => { vibrate(); setShowInfoPopup(true); }}
                className="text-[26px] lg:text-[34px] font-bold tracking-tight text-left whitespace-nowrap overflow-hidden text-ellipsis hover:opacity-80 transition-opacity w-full"
              >
                1 {fromCurr} = {rates[toCurr] ? formatNumber(rates[toCurr]) : '--'} {toCurr}
              </button>
              <p className="text-sm text-gray-400 font-medium truncate mt-0.5">
                {isOffline ? 'Using saved exchange data' : 
                  `LIVE • Synced at ${lastUpdated ? lastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}`}
              </p>
            </div>

            {/* Realtime Graph */}
            <GraphSection 
              fromCurr={fromCurr} 
              toCurr={toCurr} 
              currentRate={rates[toCurr] || null} 
              isOffline={isOffline} 
              theme={settings.theme}
              onExpand={(tf) => setShowExpandedGraph(tf)}
              refreshTrigger={refreshTrigger}
            />

            {/* History Link */}
            <button 
              onClick={() => setShowHistory(true)}
              className="w-full bg-gray-50 text-gray-900 dark:bg-white/5 dark:text-white rounded-full px-6 py-5 md:px-8 md:py-6 flex items-center shadow-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition-colors group text-left border border-gray-100 dark:border-white/5 gap-4"
            >
              <div className="w-12 h-12 bg-black/5 dark:bg-white/10 rounded-full flex items-center justify-center shrink-0">
                <Clock size={24} className="text-black dark:text-white" />
              </div>
              <div className="flex flex-col flex-1 min-w-0 pr-2">
                <div className="flex items-center justify-between w-full">
                  <p className="text-base md:text-lg font-black tracking-tight uppercase opacity-80 leading-tight">History</p>
                  <div className="text-[10px] md:text-xs font-black bg-black text-white dark:bg-white dark:text-black px-4 py-2 md:px-5 md:py-2 rounded-full shadow-md group-hover:scale-105 transition-all uppercase tracking-widest shrink-0 ml-2">
                    VIEW ALL
                  </div>
                </div>
                <p className="text-xs md:text-sm font-bold text-gray-400 mt-0.5 whitespace-nowrap">
                   View past conversions
                </p>
              </div>
            </button>
          </section>
        </main>
      </div>

      {/* Currency Selector Modal */}
      <AnimatePresence>
        {showSelector && (
          <OnboardingBaseScreen 
            key="selector"
            direction={1} 
            onBack={() => setShowSelector(null)} 
            onSelect={(code) => {
              if (showSelector === 'from') {
                setFromCurr(code);
                updateSetting('defaultBaseCurrency', code);
              }
              else if (showSelector === 'to') setToCurr(code);
              else if (showSelector === 'settings_base') {
                updateSetting('defaultBaseCurrency', code);
                setFromCurr(code);
              }
              setShowSelector(null);
            }} 
            isSelectorMode={true}
          />
        )}
        {showHistory && (
          <HistoryModal 
            key="history"
            onClose={() => setShowHistory(false)} 
            history={history} 
            onRestore={(h) => {
              setFromCurr(h.from);
              setToCurr(h.to);
              setAmount(h.amount.toString());
              setShowHistory(false);
            }}
            onClear={() => {
              setHistory([]);
              localStorage.removeItem('monex_history');
            }}
          />
        )}
        {showExpandedGraph && (
          <ExpandedGraphModal
            key="expanded_graph"
            onClose={() => setShowExpandedGraph(null)}
            initialTimeframe={showExpandedGraph}
            fromCurr={fromCurr}
            toCurr={toCurr}
            isOffline={isOffline}
            theme={settings.theme}
            currentRate={rates[toCurr] || undefined}
            refreshTrigger={refreshTrigger}
            onShowInfo={() => { vibrate(); setShowInfoPopup(true); }}
          />
        )}

        <AnimatePresence>
          {showInfoPopup && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 bg-black/40 z-[110] flex items-center justify-center p-6"
              onClick={() => setShowInfoPopup(false)}
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                exit={{ scale: 0.95, opacity: 0 }} 
                onClick={(e) => e.stopPropagation()}
                className="bg-white text-black dark:bg-[#1C1C1E] dark:text-white w-full max-w-sm rounded-[2rem] p-6 lg:p-8 shadow-2xl flex flex-col gap-4 text-center items-center"
              >
                <div className="w-12 h-12 bg-black/5 dark:bg-white/10 rounded-full flex items-center justify-center mb-2">
                  <Check size={24} className="text-black dark:text-white" />
                </div>
                <h3 className="text-xl font-bold tracking-tight">Market Data</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base leading-relaxed">
                  Rates update automatically every 30 minutes using official exchange data.
                </p>
                <button 
                  onClick={() => setShowInfoPopup(false)}
                  className="mt-4 w-full bg-black text-white dark:bg-white dark:text-black font-bold py-3.5 rounded-full hover:scale-105 transition-transform"
                >
                  Got it
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {showSettings && (
          <SettingsModal 
            key="settings"
            onClose={() => setShowSettings(false)} 
            settings={settings}
            updateSetting={updateSetting}
            showBaseSelector={() => setShowSelector('settings_base')}
            resetHistory={() => {
              setHistory([]);
              try { localStorage.removeItem('monex_history'); } catch {}
            }}
          />
        )}
      </AnimatePresence>

    </motion.div>
  );
}

function SettingsModal({ onClose, settings, updateSetting, showBaseSelector, resetHistory }: { onClose: () => void, settings: AppSettings, updateSetting: any, showBaseSelector: () => void, resetHistory: () => void }) {
  const [subscreen, setSubscreen] = useState<null | 'privacy' | 'terms'>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isDeviceOffline, setIsDeviceOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  useEffect(() => {
    const handleOnline = () => setIsDeviceOffline(false);
    const handleOffline = () => setIsDeviceOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const handleAlertToggle = async () => {
    if (!settings.rateAlerts) {
       updateSetting('rateAlerts', true);
       if (typeof window !== 'undefined' && 'Notification' in window) {
         try {
           await Notification.requestPermission();
         } catch (e) {
           console.log('Notification permission error', e);
         }
       }
    } else {
      updateSetting('rateAlerts', false);
    }
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
      className="fixed inset-0 bg-white dark:bg-black dark:text-white z-[60] flex flex-col"
    >
      <div className="flex-1 w-full max-w-5xl mx-auto pt-6 px-6 md:px-10 pb-10 relative min-h-screen flex flex-col">
        <header className="h-20 flex items-center gap-4 border-b border-gray-50 dark:border-transparent pb-4 mb-4 shrink-0">
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
            <ChevronLeft size={24} strokeWidth={2.5} className="text-white dark:text-black" />
          </button>
          <span className="text-2xl font-bold tracking-tighter uppercase dark:text-white">SETTINGS</span>
        </header>

        <div className="flex-1 overflow-y-auto pb-safe scrollbar-hide">
          <div className="space-y-8 pb-6 w-full max-w-lg mx-auto">
          {/* Currency Preferences */}
          <section>
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest px-6 mb-3">Currency Preferences</h3>
            <div className="bg-gray-50 dark:bg-white/5 rounded-[48px] px-8 py-7 space-y-5">
              <button onClick={showBaseSelector} className="w-full flex items-center justify-between group">
                <span className="font-semibold text-lg dark:text-white">Default Base Currency</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white bg-black dark:bg-white dark:text-black px-3 py-1 rounded-full group-hover:scale-105 transition-transform">{settings.defaultBaseCurrency}</span>
                </div>
              </button>
              <div className="h-[1px] bg-gray-100 dark:bg-white/10 w-full" />
              <div className="flex items-center justify-between cursor-pointer" onClick={() => updateSetting('rememberLastUsed', !settings.rememberLastUsed)}>
                <span className="font-semibold text-lg dark:text-white">Remember last used</span>
                <Toggle checked={settings.rememberLastUsed} />
              </div>
            </div>
          </section>

          {/* Data Mode */}
          <section>
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest px-6 mb-3">Data Mode</h3>
            <div className="bg-gray-50 dark:bg-white/5 rounded-[48px] px-8 py-7 flex flex-col gap-6">
              <div className="flex items-center justify-between pointer-events-none">
                <div className="flex flex-col pr-4">
                   <span className="font-semibold text-lg dark:text-white">Offline Mode</span>
                   <span className="text-[13px] text-gray-500 font-medium mt-0.5 tracking-tight">{isDeviceOffline ? "Active - You are offline" : "Automatically enables when offline"}</span>
                </div>
                <Toggle checked={isDeviceOffline} disabled={true} />
              </div>
              
              <div className="w-full h-[1px] bg-gray-200 dark:bg-white/10"></div>
              
              <div className="flex items-center justify-between cursor-pointer" onClick={() => updateSetting('haptics', !settings.haptics)}>
                <div className="flex flex-col pr-4">
                   <span className="font-semibold text-lg dark:text-white">Micro Haptics</span>
                   <span className="text-[13px] text-gray-500 font-medium mt-0.5 tracking-tight">Subtle vibrations on interactions</span>
                </div>
                <Toggle checked={settings.haptics} />
              </div>
            </div>
          </section>

          {/* History */}
          <section>
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest px-6 mb-3">History</h3>
            <div className="bg-gray-50 dark:bg-white/5 rounded-[48px] px-8 py-7 space-y-5">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => updateSetting('saveHistory', !settings.saveHistory)}>
                <span className="font-semibold text-lg dark:text-white">Save History</span>
                <Toggle checked={settings.saveHistory} />
              </div>
              <div className="h-[1px] bg-gray-100 dark:bg-white/10 w-full" />
              <button className="w-full text-left text-lg font-semibold text-red-500 hover:text-red-600 transition-colors" onClick={() => setShowClearConfirm(true)}>Clear all history</button>
            </div>
          </section>

          {/* Alerts */}
          <section>
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest px-6 mb-3">Alerts</h3>
            <div className="bg-gray-50 dark:bg-white/5 rounded-full px-8 py-5">
              <div className="flex items-center justify-between cursor-pointer" onClick={handleAlertToggle}>
                <div className="flex flex-col pr-4">
                   <span className="font-semibold text-lg dark:text-white">Rate Alerts</span>
                </div>
                <Toggle checked={settings.rateAlerts} />
              </div>
            </div>
          </section>

          {/* Theme */}
          <section>
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest px-4 mb-3">Theme</h3>
            <div className="bg-gray-50 dark:bg-white/5 rounded-full p-2 flex gap-2 relative">
              <button 
                onClick={() => {
                  updateSetting('theme', 'light');
                }} 
                className={cn("flex-1 py-3 text-center rounded-full font-bold text-lg transition-colors relative z-10", settings.theme === 'light' ? "text-white" : "text-gray-400 hover:text-black dark:hover:text-white")}
              >
                Light
                {settings.theme === 'light' && (
                  <motion.div layoutId="theme-slider" transition={{ duration: 0.15 }} className="absolute inset-0 bg-black shadow-sm rounded-full -z-10" />
                )}
              </button>
              <button 
                onClick={() => {
                  updateSetting('theme', 'dark');
                }} 
                className={cn("flex-1 py-3 text-center rounded-full font-bold text-lg transition-colors relative z-10", settings.theme === 'dark' ? "text-black" : "text-gray-400 hover:text-black dark:hover:text-white")}
              >
                Dark
                {settings.theme === 'dark' && (
                  <motion.div layoutId="theme-slider" transition={{ duration: 0.15 }} className="absolute inset-0 bg-white shadow-sm rounded-full -z-10" />
                )}
              </button>
            </div>
          </section>

          {/* Legal */}
          <section>
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest px-4 mb-3">Legal</h3>
            <div className="bg-gray-50 dark:bg-white/5 rounded-[32px] px-6 py-5 space-y-5">
              <button onClick={() => setSubscreen('privacy')} className="w-full flex items-center justify-between text-left group gap-2">
                <span className="font-semibold text-lg dark:text-white transition-all underline decoration-dotted decoration-gray-400 dark:decoration-gray-600 hover:decoration-blue-500 hover:text-blue-500 decoration-2 underline-offset-4">Privacy Policy</span>
              </button>
              <div className="h-[1px] bg-gray-100 dark:bg-white/10 w-full" />
              <button onClick={() => setSubscreen('terms')} className="w-full flex items-center justify-between text-left group gap-2">
                <span className="font-semibold text-lg dark:text-white transition-all underline decoration-dotted decoration-gray-400 dark:decoration-gray-600 hover:decoration-blue-500 hover:text-blue-500 decoration-2 underline-offset-4">Terms of Service</span>
              </button>
            </div>
          </section>

           {/* About */}
          <section className="text-center flex flex-col items-center pt-2 pb-0">
            <h3 className="text-[1.35rem] font-black uppercase tracking-tighter text-black dark:text-white mb-0.5">MONEX</h3>
            <p className="text-[13px] uppercase font-bold tracking-widest text-gray-400 mt-2 max-w-[200px]">Built for fast currency conversion</p>
            <p className="text-xs font-bold text-gray-400 mt-6 pt-4 border-t border-gray-100 dark:border-white/10 w-full text-center max-w-[250px]">Exchange data powered by Frankfurter API.</p>
            <p className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 mt-3 text-center max-w-[320px]">
              Exchange rates are for informational purposes only and may differ from actual provider rates.
            </p>
          </section>
        </div>
      </div>
      </div>

      <AnimatePresence>
        {subscreen === 'privacy' && <LegalScreen key="privacy" title="Privacy Policy" onBack={() => setSubscreen(null)} />}
        {subscreen === 'terms' && <LegalScreen key="terms" title="Terms of Service" onBack={() => setSubscreen(null)} />}
        
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
                    resetHistory();
                    setShowClearConfirm(false);
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 transition-colors text-white font-bold py-3.5 rounded-full"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Toggle({ checked, disabled = false }: { checked: boolean, disabled?: boolean }) {
  return (
    <div className={cn("w-12 h-6 rounded-full p-1 transition-colors flex items-center", checked ? "bg-black dark:bg-white" : "bg-gray-300 dark:bg-gray-600", disabled ? "opacity-30" : "")}>
      <div className={cn("w-4 h-4 bg-white dark:bg-black rounded-full transition-transform", checked ? "translate-x-6" : "translate-x-0")} />
    </div>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}

const LEGAL_DICTIONARY: Record<string, { title: string; def: string }> = {
  "Mid-Market Rate": { title: "Mid-Market Rate", def: "The average exchange rate between global buy and sell prices." },
  "Market Fluctuation": { title: "Market Fluctuation", def: "The natural up and down changes in currency value that happen continuously during market hours." },
  "Cached Data": { title: "Cached Data", def: "Previously saved exchange information stored on your device for faster access." },
  "Offline Mode": { title: "Offline Mode", def: "A feature that allows the app to function using previously saved rates when you have no internet connection." },
  "API": { title: "API", def: "Application Programming Interface—a bridge that allows our application to securely request data from a provider." },
  "Exchange Source": { title: "Exchange Source", def: "The trusted financial market API, such as Frankfurter, from which we obtain raw currency conversion data." },
  "Currency Pair": { title: "Currency Pair", def: "The quotation of the relative value of a currency unit against another (e.g., USD to EUR)." },
  "Favorites": { title: "Favorites", def: "Your personally selected list of prioritized currencies for quick access." },
  "Local Storage": { title: "Local Storage", def: "A web technology that saves basic settings directly on your device rather than sending them to a server." },
  "Third-Party Provider": { title: "Third-Party Provider", def: "An external service partner that securely supplies data or infrastructure, such as the Frankfurter API for rates." },
  "Rate Alert": { title: "Rate Alert", def: "A user-enabled notification indicating that a requested currency threshold has been reached." },
};

const InteractiveWord = ({ word, onClick, active }: { word: string, onClick: (w: string) => void, active: boolean }) => {
  return (
    <span 
      onClick={(e) => { e.stopPropagation(); onClick(word); }} 
      className={cn("underline decoration-dotted underline-offset-4 cursor-pointer font-bold transition-colors", active ? "text-blue-500 decoration-blue-500" : "decoration-gray-400 dark:decoration-gray-600 hover:text-blue-500")}
    >
      {word}
    </span>
  );
};

function LegalScreen({ title, onBack }: { title: string, onBack: () => void }) {
  const [activeWord, setActiveWord] = useState<string | null>(null);

  const popWord = () => setActiveWord(null);

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
      className="fixed inset-0 bg-white dark:bg-black dark:text-white z-[70] flex flex-col pt-safe"
    >
      <div className="flex-1 w-full max-w-5xl mx-auto pt-6 px-6 md:px-10 pb-10 relative min-h-screen flex flex-col">
        <header className="h-20 flex items-center gap-4 border-b border-gray-50 dark:border-transparent pb-4 mb-4 shrink-0">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
            <X size={20} strokeWidth={2.5} className="text-white dark:text-black" />
          </button>
          <span className="text-2xl font-bold tracking-tighter uppercase dark:text-white">{title}</span>
        </header>

        <div className="flex-1 overflow-y-auto pt-0 pb-10 max-w-3xl mx-auto w-full prose prose-lg dark:prose-invert leading-relaxed scrollbar-hide text-lg">
          <p className="font-bold text-sm tracking-widest uppercase opacity-50 mb-8 mt-0">Last Updated: May 13, 2026</p>
          
          {title === "Privacy Policy" ? (
            <>
              <p className="mb-6">
                MONEX is designed with privacy as a foundational principle. We believe your financial queries and preferences belong to you.
              </p>

              <h3 className="font-bold text-xl mb-2 mt-4">1. Data Collection</h3>
              <ul className="list-disc pl-5 mb-6 space-y-2">
                <li>We do not require account creation to use the application.</li>
                <li>We do not sell personal data, nor do we track you across the internet.</li>
                <li>We do not collect banking credentials or access personal financial accounts.</li>
              </ul>

              <h3 className="font-bold text-xl mb-2 mt-4">2. Local Storage</h3>
              <p className="mb-2">The application may locally store the following data on your device for performance and convenience:</p>
              <ul className="list-disc pl-5 mb-6 space-y-2">
                <li>Selected currencies and theme preferences.</li>
                <li>Your <InteractiveWord word="Favorites" onClick={setActiveWord} active={activeWord === 'Favorites'} /> and recent conversion history.</li>
                <li><InteractiveWord word="Cached Data" onClick={setActiveWord} active={activeWord === 'Cached Data'} /> to enable <InteractiveWord word="Offline Mode" onClick={setActiveWord} active={activeWord === 'Offline Mode'} />.</li>
              </ul>
              <p className="mb-6">
                This information remains locally on your device via browser <InteractiveWord word="Local Storage" onClick={setActiveWord} active={activeWord === 'Local Storage'} /> and is not retained on our servers.
              </p>

              <h3 className="font-bold text-xl mb-2 mt-4">3. Third-Party Services</h3>
              <p className="mb-6">
                Exchange rate data is sourced from a <InteractiveWord word="Third-Party Provider" onClick={setActiveWord} active={activeWord === 'Third-Party Provider'} />, the Frankfurter API. When fetching rates, your IP address is processed temporarily by this provider to fulfill the request. If notifications are enabled, they are used strictly for optional, user-selected <InteractiveWord word="Rate Alert" onClick={setActiveWord} active={activeWord === 'Rate Alert'} /> messages.
              </p>
            </>
          ) : (
            <>
              <p className="mb-6">
                Welcome to MONEX. These Terms of Service clarify the intent, limitations, and acceptable use of our application. Please review them carefully.
              </p>

              <h3 className="font-bold text-xl mb-2 mt-4">1. Informational Purpose</h3>
              <ul className="list-disc pl-5 mb-6 space-y-2">
                <li>MONEX is an informational currency conversion application.</li>
                <li>We do not provide banking, trading, or payment processing services.</li>
                <li>MONEX does not hold user funds or execute transactions.</li>
                <li>The application does not constitute financial, investment, trading, tax, or legal advice.</li>
              </ul>

              <h3 className="font-bold text-xl mb-2 mt-4">2. Exchange Rates and Estimates</h3>
              <ul className="list-disc pl-5 mb-6 space-y-2">
                <li>Exchange rates displayed are informational estimates, often based on a <InteractiveWord word="Mid-Market Rate" onClick={setActiveWord} active={activeWord === 'Mid-Market Rate'} />.</li>
                <li>Rates may vary significantly from actual provider, real-world market, ATM, or bank rates due to fees and <InteractiveWord word="Market Fluctuation" onClick={setActiveWord} active={activeWord === 'Market Fluctuation'} />.</li>
                <li>You must independently verify prevailing rates before executing any financial decisions.</li>
                <li><InteractiveWord word="Offline Mode" onClick={setActiveWord} active={activeWord === 'Offline Mode'} /> displays previously <InteractiveWord word="Cached Data" onClick={setActiveWord} active={activeWord === 'Cached Data'} />, which may not reflect current market conditions.</li>
              </ul>

              <h3 className="font-bold text-xl mb-2 mt-4">3. Limitation of Liability</h3>
              <p className="mb-6">
                MONEX is not responsible for any financial losses or damages caused by trading decisions, market fluctuations, communication delays, <InteractiveWord word="API" onClick={setActiveWord} active={activeWord === 'API'} /> outages, or data inaccuracies provided by an <InteractiveWord word="Exchange Source" onClick={setActiveWord} active={activeWord === 'Exchange Source'} />.
              </p>

              <h3 className="font-bold text-xl mb-2 mt-4">4. Usage and Evolution</h3>
              <p className="mb-6">
                You agree to use MONEX lawfully. Features and available <InteractiveWord word="Currency Pair" onClick={setActiveWord} active={activeWord === 'Currency Pair'} /> options may evolve over time without notice. Continued use implies understanding of these informational limits.
              </p>
            </>
          )}
        </div>
      </div>
      
      <AnimatePresence>
        {activeWord && (
          <motion.div
            key="tooltip-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center p-4 backdrop-blur-sm z-[90] cursor-pointer"
            style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}
            onClick={popWord}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/10 rounded-[28px] p-6 max-w-sm w-full shadow-[0_20px_60px_rgb(0,0,0,0.15)] flex flex-col gap-3 relative overflow-hidden cursor-default pointer-events-auto"
            >
              <h4 className="text-xl font-bold dark:text-white uppercase tracking-tight opacity-90">{LEGAL_DICTIONARY[activeWord]?.title || activeWord}</h4>
              <p className="text-[15px] text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
                {LEGAL_DICTIONARY[activeWord]?.def || "Definition not found."}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function HistoryModal({ onClose, history, onRestore, onClear }: { onClose: () => void, history: any[], onRestore: (h: any) => void, onClear: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 backdrop-blur-sm p-4 sm:p-6"
    >
      <div className="absolute inset-0 z-0" onClick={onClose} />
      
      <motion.div
        initial={{ y: 200, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 200, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-md relative z-10 mx-auto mb-safe"
      >
        <button 
          onClick={onClose} 
          className="absolute -top-14 right-0 w-10 h-10 bg-black dark:bg-white flex items-center justify-center transition-colors shadow-lg pointer-events-auto cursor-pointer rounded-full"
        >
          <X size={20} strokeWidth={2.5} className="text-white dark:text-black" />
        </button>
        <HistorySection history={history} onSelect={onRestore} onClear={onClear} />
      </motion.div>
    </motion.div>
  );
}
