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
  Database
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, setDoc } from 'firebase/firestore';

// --- Firebase Global Refs ---
let app, auth, db;
let appId = 'default-app-id';

// --- Helper to Init Firebase ---
const tryInitFirebase = (configStr) => {
  // 1. Try Environment Variable (This Editor)
  try {
    if (typeof __firebase_config !== 'undefined' && __firebase_config) {
       // Check if already initialized to avoid duplicate app errors
       try {
         app = initializeApp(JSON.parse(__firebase_config));
         appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
         auth = getAuth(app);
         db = getFirestore(app);
         return true;
       } catch (e) {
         // App might already exist, try to get instances
         if (!app) {
            console.warn("Env init failed, trying recovery", e);
         }
       }
    }
  } catch(e) {
    // console.log("Environment config not found (expected on Netlify)");
  }

  // 2. Try Manual Config (Passed in or LocalStorage)
  if (!configStr) return false;

  let config = null;
  try {
    // Try standard JSON parse
    config = JSON.parse(configStr);
  } catch (e) {
    // Try relaxed parsing (for when keys aren't quoted)
    try {
      const relaxedJson = configStr.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2": ').replace(/'/g, '"');
      config = JSON.parse(relaxedJson);
    } catch (e2) {
      console.error("Config parsing failed", e2);
      return false;
    }
  }

  if (!config || !config.apiKey) return false;

  try {
    // Use a unique name if default app exists, or just init
    app = initializeApp(config, 'debt-crusher-manual-' + Date.now()); 
    appId = 'manual-setup';
    auth = getAuth(app);
    db = getFirestore(app);
    return true;
  } catch(e) {
    console.error("Firebase manual init failed", e);
    return false;
  }
};

// Attempt initial load from storage
let initialConfigState = false;
try {
  initialConfigState = tryInitFirebase(localStorage.getItem('debt_crusher_firebase_config'));
} catch(e) {
  console.error("Fatal init error", e);
}


// --- UI Components ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-100 p-6 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", className = "", icon: Icon, disabled = false }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100";
  const variants = {
    primary: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200",
    secondary: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200",
    danger: "bg-red-50 hover:bg-red-100 text-red-600 border border-red-100",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-600"
  };
  
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

const InputGroup = ({ label, value, onChange, type = "text", placeholder, prefix }) => (
  <div className="flex flex-col gap-1 w-full">
    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</label>
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {prefix}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 ${prefix ? 'pl-9' : 'pl-3'} pr-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all`}
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
  
  const maxBalance = Math.max(...data.map(d => d.balance));
  const months = data.length;
  
  const points = data.map((d, i) => {
    const x = padding + (i / (months - 1)) * (width - padding * 2);
    const y = height - padding - (d.balance / maxBalance) * (height - padding * 2);
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
        <text x={padding} y={height - 10} className="text-[10px] fill-slate-400">Now</text>
        <text x={width - padding} y={height - 10} textAnchor="end" className="text-[10px] fill-slate-400">Debt Free</text>
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
  const [manualLink, setManualLink] = useState('');
  
  // App Config State
  const [isConfigured, setIsConfigured] = useState(initialConfigState);
  const [configInput, setConfigInput] = useState('');
  
  // Data State
  const [data, setData] = useState({
    incomes: [],
    expenses: [],
    debts: [],
    strategy: 'avalanche'
  });

  // 1. Init Logic
  useEffect(() => {
    // If we have an app, start auth
    if (isConfigured && app) {
      const initAuth = async () => {
        // Try to auth
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
           // We are in the editor
           await signInWithCustomToken(auth, __initial_auth_token);
        } else {
           // We are on Netlify/Web
           await signInAnonymously(auth);
        }
      };
      
      initAuth();
      const unsubscribe = onAuthStateChanged(auth, (u) => {
        setUser(u);
        if (!isJoined) setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false); // Stop loading if we are just waiting for config
    }
  }, [isConfigured, isJoined]);

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
  }, [user, householdId, isJoined, isConfigured]);

  // --- Get URL Effect ---
  useEffect(() => {
    try {
      const savedLink = localStorage.getItem('debt_crusher_manual_link');
      if (savedLink) {
        setShareUrl(savedLink);
      } else {
        setShareUrl(window.location.href);
      }
    } catch (e) {
      setShareUrl(window.location.href);
    }
  }, []);

  // --- Actions ---
  const updateStore = async (newData) => {
    if (!user || !householdId || !db) return;
    const safeId = householdId.replace(/[^a-zA-Z0-9-_]/g, '');
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'households', safeId);
    setData(prev => ({ ...prev, ...newData }));
    await setDoc(docRef, { ...data, ...newData }, { merge: true });
  };

  const handleConfigSubmit = (e) => {
    e.preventDefault();
    if (tryInitFirebase(configInput)) {
      localStorage.setItem('debt_crusher_firebase_config', configInput);
      setIsConfigured(true);
      window.location.reload(); // Reload to ensure clean init
    } else {
      alert("Invalid Configuration. Please check that you copied the entire code block correctly.");
    }
  };

  const resetConfig = () => {
    localStorage.removeItem('debt_crusher_firebase_config');
    window.location.reload();
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
    setJoinError('');
  };

  const leaveHousehold = () => {
    localStorage.removeItem('debt_crusher_household_id');
    setHouseholdId('');
    setIsJoined(false);
    setData({ incomes: [], expenses: [], debts: [], strategy: 'avalanche' });
  };

  const saveManualLink = () => {
    if (manualLink && manualLink.startsWith('http')) {
      localStorage.setItem('debt_crusher_manual_link', manualLink);
      setShareUrl(manualLink);
      setManualLink('');
    } else {
      alert("Please enter a valid URL starting with http");
    }
  };

  const clearManualLink = () => {
    localStorage.removeItem('debt_crusher_manual_link');
    setShareUrl(window.location.href);
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
  const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const totalMinPayments = debts.reduce((sum, item) => sum + item.minPayment, 0);
  const totalDebt = debts.reduce((sum, item) => sum + item.balance, 0);
  const disposableIncome = totalIncome - totalExpenses;
  const actualAvailableForDebt = Math.max(0, disposableIncome);
  const extraPayment = Math.max(0, actualAvailableForDebt - totalMinPayments);
  const formatMoney = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

  const payoffPlan = useMemo(() => {
    let currentDebts = debts.map(d => ({ ...d }));
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
  const addItem = (type, defaultItem) => {
    const newVal = prompt(`Name for new ${type}:`);
    const amountVal = parseFloat(prompt(`Monthly Amount:`));
    if (newVal && !isNaN(amountVal)) {
      const newList = [...data[type], { id: Date.now(), name: newVal, amount: amountVal, ...defaultItem }];
      updateStore({ [type]: newList });
    }
  };
  const updateItem = (type, id, field, val) => updateStore({ [type]: data[type].map(item => item.id === id ? { ...item, [field]: val } : item) });
  const removeItem = (type, id) => updateStore({ [type]: data[type].filter(item => item.id !== id) });
  const addDebt = () => updateStore({ debts: [...debts, { id: Date.now(), name: 'New Debt', balance: 1000, rate: 10, minPayment: 50 }] });

  // --- RENDER VIEWS ---

  const renderShareModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <Card className="max-w-md w-full relative">
        <button onClick={() => setShowShareModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20} /></button>
        <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2"><Smartphone className="text-emerald-600" /> Get Mobile Link</h3>
        
        {shareUrl.startsWith('blob:') ? (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 items-start">
              <AlertTriangle className="text-amber-600 shrink-0 mt-1" size={24} />
              <div>
                <h4 className="font-bold text-amber-800">Preview Mode Detected</h4>
                <p className="text-sm text-amber-700 mt-1">We cannot automatically detect the public link in this view.</p>
              </div>
            </div>
             <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm text-slate-600">
              <p className="mb-2 font-semibold">Try this workaround:</p>
              <p className="mb-2">Copy the URL from your <strong>browser's address bar</strong> at the very top of the window.</p>
            </div>
            <div className="pt-2 border-t border-slate-100">
               <label className="text-xs font-semibold text-slate-500 mb-1 block">Or, paste the link here to save it:</label>
               <div className="flex gap-2">
                 <input placeholder="https://..." value={manualLink} onChange={(e) => setManualLink(e.target.value)} className="flex-1 border border-slate-300 rounded px-2 text-sm" />
                 <Button onClick={saveManualLink} variant="secondary" className="px-3 py-1">Save</Button>
               </div>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-slate-500 text-sm mb-4">Copy this link and send it to your iPhone (via text, email, or Notes app).</p>
            <div className="flex gap-2">
              <input readOnly value={shareUrl} className="flex-1 bg-slate-100 border border-slate-200 rounded-lg px-3 text-sm text-slate-600 focus:outline-none" />
              <Button onClick={copyToClipboard} variant="secondary">{copySuccess ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}</Button>
            </div>
            <div className="mt-2 text-center"><button onClick={clearManualLink} className="text-xs text-slate-400 hover:underline">Reset Link</button></div>
            <div className="mt-4 text-xs text-slate-400">Once opened in Safari on iPhone: Tap "Share" icon → "Add to Home Screen".</div>
          </div>
        )}
      </Card>
    </div>
  );

  const renderConfigView = () => (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center space-y-6">
        <div className="bg-slate-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Database className="text-slate-500" size={32} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Setup Database</h1>
          <p className="text-slate-500 mt-2">To run this app on Netlify or your own host, you need to connect your own Firebase.</p>
        </div>
        
        <div className="text-left bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-600 space-y-2">
          <p>1. Go to <a href="https://console.firebase.google.com" target="_blank" className="text-emerald-600 underline">console.firebase.google.com</a></p>
          <p>2. Create a project (it's free).</p>
          <p>3. Go to Project Settings and copy the <code>firebaseConfig</code> JSON object.</p>
        </div>

        <form onSubmit={handleConfigSubmit} className="text-left space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Firebase Config JSON</label>
            <textarea 
              rows={6}
              value={configInput}
              onChange={(e) => setConfigInput(e.target.value)}
              placeholder='{"apiKey": "...", "authDomain": "...", ...}' 
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-xs"
            />
          </div>
          <Button className="w-full justify-center">Save & Connect</Button>
        </form>
      </Card>
    </div>
  );

  // --- Main Render Flow ---

  if (!isConfigured) {
    return renderConfigView();
  }

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center space-y-6">
          <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="text-emerald-600" size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Welcome to DebtCrusher</h1>
            <p className="text-slate-500 mt-2">Sync your budget with your partner.</p>
          </div>
          
          <form onSubmit={joinHousehold} className="text-left space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Household Name</label>
              <input name="householdName" type="text" placeholder="e.g. SmithFamily2025" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" autoComplete="off" onChange={() => setJoinError('')} />
              {joinError ? <p className="text-xs text-red-500">{joinError}</p> : <p className="text-xs text-slate-400">Share this exact name with your partner.</p>}
            </div>
            <Button className="w-full justify-center">Join Household</Button>
          </form>
          {/* Show a reset button for config only if not using default env */}
          <button onClick={resetConfig} className="text-xs text-slate-400 hover:text-red-500 mt-4 flex items-center gap-1 mx-auto">
            <Settings size={12} /> Reset Database Config
          </button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="animate-spin text-emerald-600" size={32} />
          <p className="text-slate-500 text-sm">Syncing with cloud...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-600 p-1.5 rounded-lg"><ShieldCheck className="text-white" size={24} /></div>
              <span className="font-bold text-xl tracking-tight text-slate-800 hidden sm:inline">Debt<span className="text-emerald-600">Crusher</span></span>
              <span className="sm:hidden font-bold text-xl text-emerald-600">DC</span>
            </div>
            <nav className="flex gap-1 items-center">
              {[{ id: 'dashboard', label: 'Dash', icon: Target }, { id: 'debts', label: 'Debts', icon: CreditCard }, { id: 'budget', label: 'Budget', icon: DollarSign }].map(item => (
                <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${activeTab === item.id ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}>
                  <item.icon size={16} /><span className="hidden md:inline">{item.label}</span>
                </button>
              ))}
              <div className="w-px h-6 bg-slate-200 mx-1"></div>
              <button onClick={() => setShowShareModal(true)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded-full" title="Get Mobile Link"><Share size={18} /></button>
              <button onClick={leaveHousehold} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full" title="Logout"><LogOut size={18} /></button>
            </nav>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        {showShareModal && renderShareModal()}
        
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
                  <div><p className="text-slate-500 text-sm font-medium">Total Debt</p><h2 className="text-3xl font-bold text-slate-800 mt-1">{formatMoney(totalDebt)}</h2></div>
                  <div className="p-2 bg-red-100 rounded-lg"><TrendingDown size={24} className="text-red-600" /></div>
                </div>
                <div className="text-slate-500 text-sm">Interest: <span className="text-red-600 font-semibold">{formatMoney(payoffPlan.totalInterestPaid)}</span></div>
              </Card>
              <Card>
                <div className="flex justify-between items-start mb-4">
                  <div><p className="text-slate-500 text-sm font-medium">Monthly "Snowball"</p><h2 className={`text-3xl font-bold mt-1 ${actualAvailableForDebt > totalMinPayments ? 'text-emerald-600' : 'text-orange-500'}`}>{formatMoney(actualAvailableForDebt)}</h2></div>
                  <div className="p-2 bg-emerald-100 rounded-lg"><ArrowUp size={24} className="text-emerald-600" /></div>
                </div>
                <div className="text-slate-500 text-sm">{actualAvailableForDebt > totalMinPayments ? `${formatMoney(extraPayment)} extra/mo` : "Budget too tight"}</div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                 <Card className="h-full">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><TrendingDown size={20} className="text-emerald-500"/> Payoff Projection</h3>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                      <button onClick={() => updateStore({ strategy: 'avalanche' })} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${strategy === 'avalanche' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Avalanche</button>
                      <button onClick={() => updateStore({ strategy: 'snowball' })} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${strategy === 'snowball' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Snowball</button>
                    </div>
                  </div>
                  <div className="aspect-[2/1] w-full"><DebtChart data={[{ balance: totalDebt }, ...payoffPlan.timeline]} /></div>
                </Card>
              </div>
              <div className="lg:col-span-1">
                <Card className="h-full flex flex-col">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><PieChart size={20} className="text-blue-500"/>Monthly Snapshot</h3>
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm"><span className="text-slate-500">Income</span><span className="font-medium text-emerald-600">+{formatMoney(totalIncome)}</span></div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-400 w-full"></div></div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm"><span className="text-slate-500">Expenses</span><span className="font-medium text-slate-700">-{formatMoney(totalExpenses)}</span></div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-slate-400" style={{ width: `${Math.min(100, (totalExpenses / totalIncome) * 100)}%` }}></div></div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm"><span className="text-slate-500">Min. Payments</span><span className="font-medium text-red-500">-{formatMoney(totalMinPayments)}</span></div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-red-400" style={{ width: `${Math.min(100, (totalMinPayments / totalIncome) * 100)}%` }}></div></div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Public Link Footer */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><LinkIcon size={16} className="text-slate-400" /> Public Link for Mobile</h3>
              {shareUrl.startsWith('blob:') ? (
                 <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">Unable to detect public URL in this preview. Try copying the URL from your <strong>browser's address bar</strong> instead.</div>
              ) : (
                <div className="flex gap-2 items-center bg-white border border-slate-200 p-2 rounded-lg">
                  <Globe size={16} className="text-slate-400" />
                  <code className="text-xs text-slate-600 flex-1 truncate select-all">{shareUrl}</code>
                  <Button onClick={copyToClipboard} variant="secondary" className="h-8 px-2 py-0 text-xs">{copySuccess ? "Copied" : "Copy"}</Button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'debts' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
              <div><h2 className="text-2xl font-bold text-slate-800">Your Debts</h2></div>
              <Button onClick={addDebt} icon={Plus}>Add Debt</Button>
            </div>
            <div className="grid gap-4">
              {debts.map((debt) => (
                <Card key={debt.id} className="relative group hover:shadow-md transition-shadow">
                  <button onClick={() => removeItem('debts', debt.id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500"><Trash2 size={18} /></button>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div className="col-span-1"><InputGroup label="Name" value={debt.name} onChange={(e) => updateItem('debts', debt.id, 'name', e.target.value)} /></div>
                    <div className="col-span-1"><InputGroup label="Balance" type="number" prefix="$" value={debt.balance} onChange={(e) => updateItem('debts', debt.id, 'balance', parseFloat(e.target.value) || 0)} /></div>
                    <div className="col-span-1"><InputGroup label="Rate (%)" type="number" prefix="%" value={debt.rate} onChange={(e) => updateItem('debts', debt.id, 'rate', parseFloat(e.target.value) || 0)} /></div>
                    <div className="col-span-1"><InputGroup label="Min Payment" type="number" prefix="$" value={debt.minPayment} onChange={(e) => updateItem('debts', debt.id, 'minPayment', parseFloat(e.target.value) || 0)} /></div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'budget' && (
           <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-800">Income & Expenses</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center"><h3 className="font-bold text-slate-700 flex items-center gap-2"><DollarSign size={20} className="text-emerald-500" />Income</h3><Button variant="ghost" onClick={() => addItem('incomes', {})} className="text-sm py-1 px-2">+ Add Income</Button></div>
                <div className="space-y-3">{incomes.map((inc) => (<div key={inc.id} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm"><input className="flex-1 bg-transparent font-medium text-slate-700 focus:outline-none" value={inc.name} onChange={(e) => updateItem('incomes', inc.id, 'name', e.target.value)} /><div className="flex items-center gap-2"><span className="text-slate-400 text-sm">$</span><input type="number" className="w-20 bg-slate-50 rounded border border-slate-200 px-2 py-1 text-right text-slate-700 focus:outline-none focus:border-emerald-500" value={inc.amount} onChange={(e) => updateItem('incomes', inc.id, 'amount', parseFloat(e.target.value) || 0)} /><button onClick={() => removeItem('incomes', inc.id)} className="text-slate-300 hover:text-red-500 ml-2"><Trash2 size={16} /></button></div></div>))}</div>
                <div className="bg-emerald-50 p-4 rounded-lg flex justify-between items-center border border-emerald-100"><span className="font-medium text-emerald-800">Total Income</span><span className="font-bold text-emerald-700">{formatMoney(totalIncome)}</span></div>
              </div>
              <div className="space-y-4">
                 <div className="flex justify-between items-center"><h3 className="font-bold text-slate-700 flex items-center gap-2"><PieChart size={20} className="text-blue-500" />Expenses</h3><Button variant="ghost" onClick={() => addItem('expenses', {})} className="text-sm py-1 px-2">+ Add Item</Button></div>
                 <div className="space-y-3">{expenses.map((expense) => (<div key={expense.id} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm"><input className="flex-1 bg-transparent font-medium text-slate-700 focus:outline-none" value={expense.name} onChange={(e) => updateItem('expenses', expense.id, 'name', e.target.value)} /><div className="flex items-center gap-2"><span className="text-slate-400 text-sm">$</span><input type="number" className="w-20 bg-slate-50 rounded border border-slate-200 px-2 py-1 text-right text-slate-700 focus:outline-none focus:border-emerald-500" value={expense.amount} onChange={(e) => updateItem('expenses', expense.id, 'amount', parseFloat(e.target.value) || 0)} /><button onClick={() => removeItem('expenses', expense.id)} className="text-slate-300 hover:text-red-500 ml-2"><Trash2 size={16} /></button></div></div>))}</div>
                 <div className="bg-slate-100 p-4 rounded-lg flex justify-between items-center"><span className="font-medium text-slate-600">Total Expenses</span><span className="font-bold text-slate-800">{formatMoney(totalExpenses)}</span></div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
