import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Target, 
  ShieldCheck, 
  PieChart,
  ArrowUp,
  LogOut,
  Users,
  Loader2,
  Share,
  X,
  Copy,
  Smartphone,
  Check,
  AlertTriangle,
  Link as LinkIcon,
  Globe,
  Settings,
  Database,
  Info,
  HelpCircle
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, setDoc } from 'firebase/firestore';

// --- HARDCODED CONFIGURATION (No Setup Screen Needed) ---
const firebaseConfig = {
  apiKey: "AIzaSyCJnzX78jVZQiQQzGgzTyqnzkLxnXeQ6Gs",
  authDomain: "debt-crusher-fdd08.firebaseapp.com",
  projectId: "debt-crusher-fdd08",
  storageBucket: "debt-crusher-fdd08.firebasestorage.app",
  messagingSenderId: "768312858700",
  appId: "1:768312858700:web:512463fe64e980f774bce9",
  measurementId: "G-L2GZ2DSWML"
};

// --- Init Firebase ---
let app, auth, db;
let appId = 'default-app-id';

try {
  // 1. Try Environment Variable (Preview Mode)
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
     app = initializeApp(JSON.parse(__firebase_config));
     appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
  } else {
  // 2. Use Hardcoded Config (Netlify / Mobile)
     app = initializeApp(firebaseConfig);
     appId = 'debt-crusher-live';
  }
  
  if (app) {
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch(e) {
  console.error("Firebase init failed:", e);
}

// --- UI Components ---

const Card = ({ children, className = "", onClick }) => (
  <div onClick={onClick} className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", className = "", icon: Icon, disabled = false, type = "button" }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100";
  
  const variants = {
    primary: "bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-200",
    secondary: "bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 shadow-sm",
    danger: "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-700"
  };
  
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

const InputGroup = ({ label, value, onChange, type = "text", placeholder, prefix }) => (
  <div className="flex flex-col gap-1 w-full">
    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</label>
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
          {prefix}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full bg-white border border-gray-300 rounded-lg py-2.5 ${prefix ? 'pl-9' : 'pl-3'} pr-3 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm placeholder:text-gray-300`}
      />
    </div>
  </div>
);

// --- Chart Component ---
const DebtChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  const height = 200;
  const width = 600;
  const padding = 40;
  
  const maxBalance = Math.max(...data.map(d => Number(d.balance) || 0));
  const months = data.length;
  
  const points = data.map((d, i) => {
    const balance = Number(d.balance) || 0;
    const x = padding + (i / (months - 1)) * (width - padding * 2);
    const y = height - padding - (balance / (maxBalance || 1)) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
          <line 
            key={tick}
            x1={padding} 
            y1={height - padding - tick * (height - padding * 2)} 
            x2={width - padding} 
            y2={height - padding - tick * (height - padding * 2)} 
            stroke="#e2e8f0" 
            strokeWidth="1"
            strokeDasharray="4"
          />
        ))}
        <path d={`M ${padding},${height - padding} L ${points} L ${width - padding},${height - padding} Z`} fill="url(#gradient)" opacity="0.2" />
        <polyline fill="none" stroke="#10b981" strokeWidth="3" points={points} strokeLinecap="round" strokeLinejoin="round" />
        <defs>
          <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
        </defs>
        <text x={padding} y={height - 10} className="text-[10px] fill-gray-400">Now</text>
        <text x={width - padding} y={height - 10} textAnchor="end" className="text-[10px] fill-gray-400">Debt Free</text>
      </svg>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [householdId, setHouseholdId] = useState(() => localStorage.getItem('debt_crusher_household_id') || '');
  const [isJoined, setIsJoined] = useState(!!localStorage.getItem('debt_crusher_household_id'));
  const [loading, setLoading] = useState(true);
  const [joinError, setJoinError] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [activeInfo, setActiveInfo] = useState(null); // 'strategy' | 'snowball_calc' | null
  
  // Data State
  const [data, setData] = useState({
    incomes: [],
    expenses: [],
    debts: [],
    strategy: 'avalanche'
  });

  // 1. Init Logic
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
        if (loading && isJoined) {
            console.warn("Loading timed out, forcing render");
            setLoading(false);
        }
    }, 5000);

    if (app && auth) {
      const initAuth = async () => {
        try {
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                await signInWithCustomToken(auth, __initial_auth_token);
            } else if (!auth.currentUser) {
                await signInAnonymously(auth);
            }
        } catch (error) {
            console.error("Auth error:", error);
            setLoading(false);
        }
      };
      
      initAuth();
      const unsubscribe = onAuthStateChanged(auth, (u) => {
        setUser(u);
        if (isJoined) setLoading(false);
      });
      return () => {
          unsubscribe();
          clearTimeout(safetyTimer);
      };
    } else {
      setLoading(false);
    }
  }, [isJoined]);

  // 2. Data Sync
  useEffect(() => {
    if (!user || !householdId || !isJoined || !db) return;

    setLoading(true);
    const safeId = householdId.replace(/[^a-zA-Z0-9-_]/g, '');
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'households', safeId);

    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      setLoading(false);
      if (snapshot.exists()) {
        const remoteData = snapshot.data();
        setData({
          incomes: remoteData.incomes || [],
          expenses: remoteData.expenses || [],
          debts: remoteData.debts || [],
          strategy: remoteData.strategy || 'avalanche'
        });
      } else {
        const initialData = {
          incomes: [{ id: 1, name: 'Salary 1', amount: 3000 }],
          expenses: [{ id: 1, name: 'Rent', amount: 1200 }],
          debts: [],
          strategy: 'avalanche'
        };
        setDoc(docRef, initialData);
        setData(initialData);
      }
    }, (error) => {
      console.error("Sync error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, householdId, isJoined]);

  // --- Get URL Effect ---
  useEffect(() => {
    try {
      setShareUrl(window.location.href);
    } catch (e) { }
  }, []);

  // --- Actions ---
  const updateStore = async (newData) => {
    // 1. Update Local State Immediately (Optimistic UI)
    // This allows buttons to work immediately even if Auth/DB connection is slow or failing locally
    const mergedData = { ...data, ...newData };
    setData(mergedData);
    
    // 2. Sync to Firebase if connected and authorized
    if (user && householdId && db) {
      const safeId = householdId.replace(/[^a-zA-Z0-9-_]/g, '');
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'households', safeId);
      
      try {
        await setDoc(docRef, mergedData, { merge: true });
      } catch (err) {
        // Silently log error, but keep UI updated
        console.error("Cloud sync failed (Local mode active):", err);
      }
    }
  };

  const joinHousehold = (e) => {
    e.preventDefault();
    const id = e.target.householdName.value.trim();
    if (id.length < 4) {
      setJoinError("Please enter a longer name (at least 4 chars)");
      return;
    }
    setHouseholdId(id);
    localStorage.setItem('debt_crusher_household_id', id);
    setIsJoined(true);
    setLoading(true);
    setJoinError('');
  };

  const leaveHousehold = () => {
    localStorage.removeItem('debt_crusher_household_id');
    setHouseholdId('');
    setIsJoined(false);
    setData({ incomes: [], expenses: [], debts: [], strategy: 'avalanche' });
  };

  const copyToClipboard = () => {
    const textArea = document.createElement("textarea");
    textArea.value = shareUrl;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    } catch (err) {}
    document.body.removeChild(textArea);
  };

  // --- Calculations ---
  const { incomes, expenses, debts, strategy } = data;
  
  const totalIncome = incomes.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const totalMinPayments = debts.reduce((sum, item) => sum + (parseFloat(item.minPayment) || 0), 0);
  const totalDebt = debts.reduce((sum, item) => sum + (parseFloat(item.balance) || 0), 0);
  
  const disposableIncome = totalIncome - totalExpenses;
  const actualAvailableForDebt = Math.max(0, disposableIncome);
  const extraPayment = Math.max(0, actualAvailableForDebt - totalMinPayments);
  const formatMoney = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

  const payoffPlan = useMemo(() => {
    let currentDebts = debts.map(d => ({ 
      ...d,
      balance: parseFloat(d.balance) || 0,
      rate: parseFloat(d.rate) || 0,
      minPayment: parseFloat(d.minPayment) || 0
    }));

    let timeline = [];
    let month = 0;
    let totalInterestPaid = 0;
    const sortDebts = (list) => list.sort((a, b) => strategy === 'avalanche' ? b.rate - a.rate : a.balance - b.balance);

    while (currentDebts.some(d => d.balance > 0) && month < 360) {
      month++;
      let monthlyExtra = extraPayment;
      let monthInterest = 0;

      currentDebts.forEach(debt => {
        if (debt.balance > 0) {
          const interest = debt.balance * (debt.rate / 100 / 12);
          debt.balance += interest;
          monthInterest += interest;
          totalInterestPaid += interest;
        }
      });
      currentDebts = sortDebts(currentDebts);
      currentDebts.forEach(debt => {
        if (debt.balance > 0) {
          const payment = Math.min(debt.balance, debt.minPayment);
          debt.balance -= payment;
          if (debt.balance === 0) {
             monthlyExtra += (debt.minPayment - payment);
             monthlyExtra += payment;
          }
        }
      });
      for (let debt of currentDebts) {
        if (debt.balance > 0 && monthlyExtra > 0) {
          const payment = Math.min(debt.balance, monthlyExtra);
          debt.balance -= payment;
          monthlyExtra -= payment;
        }
      }
      const totalRemaining = currentDebts.reduce((sum, d) => sum + d.balance, 0);
      timeline.push({ month, balance: Math.max(0, totalRemaining), interest: totalInterestPaid });
    }
    return { timeline, totalInterestPaid, months: month };
  }, [debts, extraPayment, strategy]);

  const projectedDate = new Date();
  projectedDate.setMonth(projectedDate.getMonth() + payoffPlan.months);

  // --- Handlers ---
  const addItem = (type) => {
    const currentList = data[type] || [];
    const newItem = { 
        id: Date.now() + Math.random(), 
        name: '', 
        amount: '' 
    };
    const newList = [newItem, ...currentList];
    updateStore({ [type]: newList });
  };
  
  const updateItem = (type, id, field, val) => {
    const currentList = data[type] || [];
    updateStore({ [type]: currentList.map(item => item.id === id ? { ...item, [field]: val } : item) });
  };
  
  const removeItem = (type, id) => {
    const currentList = data[type] || [];
    updateStore({ [type]: currentList.filter(item => item.id !== id) });
  };
  
  const addDebt = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    const currentDebts = data.debts || [];
    const newDebt = { 
      id: Date.now() + Math.random(), 
      name: '',  
      balance: '',
      rate: '', 
      minPayment: '' 
    };
    const newDebtsArray = [newDebt, ...currentDebts];
    updateStore({ debts: newDebtsArray });
  };

  // --- Helpers ---
  const InfoButton = ({ id }) => (
    <button
      onClick={(e) => { e.stopPropagation(); setActiveInfo(id); }}
      className="text-gray-400 hover:text-blue-500 transition-colors ml-1.5 p-1 rounded-full hover:bg-gray-100 align-middle"
      title="Tap for info"
    >
      <HelpCircle size={14} />
    </button>
  );

  // --- RENDER VIEWS ---

  const renderInfoModal = () => {
    if (!activeInfo) return null;
    let title = "";
    let content = null;

    if (activeInfo === 'strategy') {
       title = "Payoff Strategies";
       content = (
         <div className="space-y-4 text-sm text-gray-600">
           <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
             <strong className="block text-indigo-900 mb-1">Avalanche (High Interest)</strong>
             Focuses on the debt with the <strong>highest interest rate</strong> first. This method saves you the most money over time because you eliminate the most expensive loans fastest.
           </div>
           <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
             <strong className="block text-blue-900 mb-1">Snowball (Low Balance)</strong>
             Focuses on the debt with the <strong>lowest balance</strong> first. This gives you quick wins (closing accounts), which helps keep you motivated to keep going.
           </div>
         </div>
       );
    } else if (activeInfo === 'monthly_snowball') {
       title = "What is 'Monthly Snowball'?";
       content = (
         <div className="space-y-3 text-sm text-gray-600">
            <p>This is your <strong>"Free Cash"</strong>—the money left over after paying all your Monthly Expenses and Minimum Debt Payments.</p>
            <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-green-900 font-medium">
               Income - Expenses - Min. Payments = Snowball
            </div>
            <p>We automatically apply this extra cash to your target debt to crush it faster!</p>
         </div>
       );
    }

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setActiveInfo(null)}>
         <Card className="max-w-sm w-full relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
           <button onClick={() => setActiveInfo(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20}/></button>
           <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><Info size={20} className="text-blue-500"/> {title}</h3>
           {content}
         </Card>
      </div>
    );
  };

  const renderShareModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <Card className="max-w-md w-full relative">
        <button onClick={() => setShowShareModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
        <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2"><Smartphone className="text-green-600" /> Get Mobile Link</h3>
        
        {shareUrl.startsWith('blob:') ? (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 items-start">
              <AlertTriangle className="text-amber-600 shrink-0 mt-1" size={24} />
              <div>
                <h4 className="font-bold text-amber-800">Preview Mode Detected</h4>
                <p className="text-sm text-amber-700 mt-1">We cannot automatically detect the public link in this view.</p>
              </div>
            </div>
             <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm text-gray-600">
              <p className="mb-2 font-semibold">Try this workaround:</p>
              <p className="mb-2">Copy the URL from your <strong>browser's address bar</strong> at the very top of the window.</p>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-gray-500 text-sm mb-4">Copy this link and send it to your iPhone (via text, email, or Notes app).</p>
            <div className="flex gap-2">
              <input readOnly value={shareUrl} className="flex-1 bg-gray-100 border border-gray-200 rounded-lg px-3 text-sm text-gray-600 focus:outline-none" />
              <Button onClick={copyToClipboard} variant="secondary">{copySuccess ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}</Button>
            </div>
            <div className="mt-4 text-xs text-gray-400">Once opened in Safari on iPhone: Tap "Share" icon → "Add to Home Screen".</div>
          </div>
        )}
      </Card>
    </div>
  );

  // --- Main Render Flow ---

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center space-y-6">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="text-green-600" size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Welcome to DebtCrusher</h1>
            <p className="text-gray-500 mt-2">Sync your budget with your partner.</p>
          </div>
          
          <form onSubmit={joinHousehold} className="text-left space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Household Name</label>
              <input name="householdName" type="text" placeholder="e.g. SmithFamily2025" className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900" autoComplete="off" onChange={() => setJoinError('')} />
              {joinError ? <p className="text-xs text-red-500">{joinError}</p> : <p className="text-xs text-gray-400">Share this exact name with your partner.</p>}
            </div>
            <Button type="submit" className="w-full justify-center">Join Household</Button>
          </form>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="animate-spin text-green-600" size={32} />
          <p className="text-gray-500 text-sm">Syncing with cloud...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-green-600 p-1.5 rounded-lg"><ShieldCheck className="text-white" size={24} /></div>
              <span className="font-bold text-xl tracking-tight text-gray-800 hidden sm:inline">Debt<span className="text-green-600">Crusher</span></span>
              <span className="sm:hidden font-bold text-xl text-green-600">DC</span>
            </div>
            <nav className="flex gap-1 items-center">
              {[{ id: 'dashboard', label: 'Dash', icon: Target }, { id: 'debts', label: 'Debts', icon: CreditCard }, { id: 'budget', label: 'Budget', icon: DollarSign }].map(item => (
                <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${activeTab === item.id ? 'bg-gray-900 text-white shadow-lg shadow-gray-200' : 'text-gray-500 hover:bg-gray-100'}`}>
                  <item.icon size={16} /><span className="hidden md:inline">{item.label}</span>
                </button>
              ))}
              <div className="w-px h-6 bg-gray-200 mx-1"></div>
              <button onClick={() => setShowShareModal(true)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-gray-100 rounded-full" title="Get Mobile Link"><Share size={18} /></button>
              <button onClick={leaveHousehold} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full" title="Logout"><LogOut size={18} /></button>
            </nav>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        {showShareModal && renderShareModal()}
        {renderInfoModal()}
        
        {/* VIEW RENDERING */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none">
                <div className="flex justify-between items-start mb-4">
                  <div><p className="text-indigo-100 text-sm font-medium">Debt Free Date</p><h2 className="text-3xl font-bold mt-1">{payoffPlan.months >= 360 ? "Never" : projectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2></div>
                  <div className="p-2 bg-white/20 rounded-lg"><Target size={24} className="text-white" /></div>
                </div>
                <div className="text-indigo-100 text-sm">{payoffPlan.months} months to freedom</div>
              </Card>
              <Card>
                <div className="flex justify-between items-start mb-4">
                  <div><p className="text-gray-500 text-sm font-medium">Total Debt</p><h2 className="text-3xl font-bold text-gray-800 mt-1">{formatMoney(totalDebt)}</h2></div>
                  <div className="p-2 bg-red-100 rounded-lg"><TrendingDown size={24} className="text-red-600" /></div>
                </div>
                <div className="text-gray-500 text-sm">Interest: <span className="text-red-600 font-semibold">{formatMoney(payoffPlan.totalInterestPaid)}</span></div>
              </Card>
              <Card>
                <div className="flex justify-between items-start mb-4">
                  <div><p className="text-gray-500 text-sm font-medium flex items-center">Monthly "Snowball" <InfoButton id="monthly_snowball"/></p><h2 className={`text-3xl font-bold mt-1 ${actualAvailableForDebt > totalMinPayments ? 'text-green-600' : 'text-orange-500'}`}>{formatMoney(actualAvailableForDebt)}</h2></div>
                  <div className="p-2 bg-green-100 rounded-lg"><ArrowUp size={24} className="text-green-600" /></div>
                </div>
                <div className="text-gray-500 text-sm">{actualAvailableForDebt > totalMinPayments ? `${formatMoney(extraPayment)} extra/mo` : "Budget too tight"}</div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                 <Card className="h-full">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-1"><TrendingDown size={20} className="text-green-500"/> Payoff Projection <InfoButton id="strategy" /></h3>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                      <button onClick={() => updateStore({ strategy: 'avalanche' })} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${strategy === 'avalanche' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Avalanche</button>
                      <button onClick={() => updateStore({ strategy: 'snowball' })} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${strategy === 'snowball' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Snowball</button>
                    </div>
                  </div>
                  
                  {/* Added inline strategy explanation */}
                  <div className="mb-6 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-600">
                    {strategy === 'avalanche' ? (
                        <p className="flex gap-2"><TrendingDown size={14} className="text-green-600 shrink-0 mt-0.5"/> <span><strong>Avalanche:</strong> Targeting highest interest rate first. This saves the most money on interest over time.</span></p>
                    ) : (
                        <p className="flex gap-2"><Check size={14} className="text-indigo-600 shrink-0 mt-0.5"/> <span><strong>Snowball:</strong> Targeting lowest balance first. This creates quick wins to build momentum.</span></p>
                    )}
                  </div>

                  <div className="aspect-[2/1] w-full"><DebtChart data={[{ balance: totalDebt }, ...payoffPlan.timeline]} /></div>
                </Card>
              </div>
              <div className="lg:col-span-1">
                <Card className="h-full flex flex-col">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><PieChart size={20} className="text-blue-500"/>Monthly Snapshot</h3>
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm"><span className="text-gray-500">Income</span><span className="font-medium text-green-600">+{formatMoney(totalIncome)}</span></div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-green-400 w-full"></div></div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm"><span className="text-gray-500">Expenses</span><span className="font-medium text-gray-700">-{formatMoney(totalExpenses)}</span></div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gray-400" style={{ width: `${Math.min(100, (totalExpenses / totalIncome) * 100)}%` }}></div></div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm"><span className="text-gray-500">Min. Payments</span><span className="font-medium text-red-500">-{formatMoney(totalMinPayments)}</span></div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-red-400" style={{ width: `${Math.min(100, (totalMinPayments / totalIncome) * 100)}%` }}></div></div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Public Link Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><LinkIcon size={16} className="text-gray-400" /> Public Link for Mobile</h3>
              {shareUrl.startsWith('blob:') ? (
                 <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">Unable to detect public URL in this preview. Try copying the URL from your <strong>browser's address bar</strong> instead.</div>
              ) : (
                <div className="flex gap-2 items-center bg-white border border-gray-200 p-2 rounded-lg">
                  <Globe size={16} className="text-gray-400" />
                  <code className="text-xs text-gray-600 flex-1 truncate select-all">{shareUrl}</code>
                  <Button onClick={copyToClipboard} variant="secondary" className="h-8 px-2 py-0 text-xs">{copySuccess ? "Copied" : "Copy"}</Button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'debts' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
              <div><h2 className="text-2xl font-bold text-gray-800">Your Debts</h2></div>
              {/* Passed addDebt directly to onClick, it will receive the event object automatically */}
              <Button onClick={addDebt} icon={Plus}>Add Debt</Button>
            </div>
            <div className="grid gap-4">
              {debts.map((debt) => (
                <Card key={debt.id} className="relative group hover:shadow-md transition-shadow">
                  <button onClick={() => removeItem('debts', debt.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500"><Trash2 size={18} /></button>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div className="col-span-1"><InputGroup label="Name" value={debt.name} placeholder="e.g. Visa" onChange={(e) => updateItem('debts', debt.id, 'name', e.target.value)} /></div>
                    <div className="col-span-1"><InputGroup label="Balance" type="number" prefix="$" value={debt.balance} placeholder="0.00" onChange={(e) => updateItem('debts', debt.id, 'balance', e.target.value)} /></div>
                    <div className="col-span-1"><InputGroup label="Rate (%)" type="number" prefix="%" value={debt.rate} placeholder="15.0" onChange={(e) => updateItem('debts', debt.id, 'rate', e.target.value)} /></div>
                    <div className="col-span-1"><InputGroup label="Min Payment" type="number" prefix="$" value={debt.minPayment} placeholder="50.00" onChange={(e) => updateItem('debts', debt.id, 'minPayment', e.target.value)} /></div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'budget' && (
           <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-gray-800">Monthly Income & Expenses</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center"><h3 className="font-bold text-gray-700 flex items-center gap-2"><DollarSign size={20} className="text-green-500" />Monthly Income</h3><Button variant="ghost" onClick={() => addItem('incomes')} className="text-sm py-1 px-2">+ Add Income</Button></div>
                <div className="space-y-3">{incomes.map((inc) => (<div key={inc.id} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm"><input className="flex-1 bg-transparent font-medium text-gray-700 focus:outline-none placeholder:text-gray-300" placeholder="Source Name" value={inc.name} onChange={(e) => updateItem('incomes', inc.id, 'name', e.target.value)} /><div className="flex items-center gap-2"><span className="text-gray-400 text-sm">$</span><input type="number" className="w-20 bg-slate-50 rounded border border-gray-200 px-2 py-1 text-right text-gray-700 focus:outline-none focus:border-green-500 placeholder:text-gray-300" placeholder="0" value={inc.amount} onChange={(e) => updateItem('incomes', inc.id, 'amount', e.target.value)} /><button onClick={() => removeItem('incomes', inc.id)} className="text-gray-300 hover:text-red-500 ml-2"><Trash2 size={16} /></button></div></div>))}</div>
                <div className="bg-green-50 p-4 rounded-lg flex justify-between items-center border border-green-100"><span className="font-medium text-green-800">Total Income</span><span className="font-bold text-green-700">{formatMoney(totalIncome)}</span></div>
              </div>
              <div className="space-y-4">
                 <div className="flex justify-between items-center"><h3 className="font-bold text-gray-700 flex items-center gap-2"><PieChart size={20} className="text-blue-500" />Monthly Expenses</h3><Button variant="ghost" onClick={() => addItem('expenses')} className="text-sm py-1 px-2">+ Add Item</Button></div>
                 
                 {/* FIX: Added warning tip here */}
                 <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-xs flex gap-2 items-start">
                   <Info size={16} className="shrink-0 mt-0.5" />
                   <span><strong>Tip:</strong> Don't list your debts (like car loans) here. The app automatically deducts your minimum debt payments from your budget.</span>
                 </div>

                 <div className="space-y-3">{expenses.map((expense) => (<div key={expense.id} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm"><input className="flex-1 bg-transparent font-medium text-gray-700 focus:outline-none placeholder:text-gray-300" placeholder="Expense Name" value={expense.name} onChange={(e) => updateItem('expenses', expense.id, 'name', e.target.value)} /><div className="flex items-center gap-2"><span className="text-gray-400 text-sm">$</span><input type="number" className="w-20 bg-slate-50 rounded border border-gray-200 px-2 py-1 text-right text-gray-700 focus:outline-none focus:border-green-500 placeholder:text-gray-300" placeholder="0" value={expense.amount} onChange={(e) => updateItem('expenses', expense.id, 'amount', e.target.value)} /><button onClick={() => removeItem('expenses', expense.id)} className="text-gray-300 hover:text-red-500 ml-2"><Trash2 size={16} /></button></div></div>))}</div>
                 <div className="bg-gray-100 p-4 rounded-lg flex justify-between items-center"><span className="font-medium text-gray-600">Total Expenses</span><span className="font-bold text-gray-800">{formatMoney(totalExpenses)}</span></div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
