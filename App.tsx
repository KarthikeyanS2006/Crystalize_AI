import React, { useState, useEffect, useRef } from 'react';
import { Message, AppView, Crystal, CrystalExtractionResponse } from './types';
import { searchAndAnalyze, crystallizeKnowledge } from './services/geminiService';
import { ChatMessage } from './components/ChatMessage';
import { CrystalCard } from './components/CrystalCard';
import { Button } from './components/Button';
import { 
  LayoutGrid, 
  MessageSquare, 
  Search, 
  Database, 
  Menu, 
  X, 
  Send,
  Zap,
  User as UserIcon,
  Trash2,
  LogOut,
  Moon,
  Sun,
  ArrowRight
} from 'lucide-react';

// Unique ID generator
const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  // --- App State ---
  const [userName, setUserName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [view, setView] = useState<AppView>(AppView.CHAT);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [crystallizingId, setCrystallizingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Database State
  const [crystals, setCrystals] = useState<Crystal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // --- Persistence Effects ---

  // Load Settings on Mount
  useEffect(() => {
    const storedName = localStorage.getItem('crystallize_username');
    const storedTheme = localStorage.getItem('crystallize_theme');
    
    if (storedName) setUserName(storedName);
    if (storedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Toggle Dark Mode
  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('crystallize_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('crystallize_theme', 'light');
    }
  };

  // Handle Login
  const handleLogin = () => {
    if (!nameInput.trim()) return;
    setUserName(nameInput.trim());
    localStorage.setItem('crystallize_username', nameInput.trim());
  };

  // Handle Logout
  const handleLogout = () => {
    setUserName(null);
    setMessages([]); // Optionally clear view state
    setCrystals([]); // Optionally clear view state (data is still in local storage)
    localStorage.removeItem('crystallize_username');
  };

  // Load Data when User Changes
  useEffect(() => {
    if (!userName) return;

    const userDbKey = `crystal_db_${userName}`;
    const userChatKey = `crystal_chat_${userName}`;

    const savedCrystals = localStorage.getItem(userDbKey);
    const savedChat = localStorage.getItem(userChatKey);

    if (savedCrystals) {
      try {
        setCrystals(JSON.parse(savedCrystals));
      } catch (e) { console.error("Failed to load DB", e); }
    } else {
      setCrystals([]);
    }

    if (savedChat) {
      try {
        setMessages(JSON.parse(savedChat));
      } catch (e) { console.error("Failed to load Chat", e); }
    } else {
       setMessages([
        {
          id: 'welcome',
          role: 'model',
          text: `Hello **${userName}**! I am **Crystallize AI**. \n\nI can research the web for you and help you build a personal knowledge base. Ask me anything!`,
          timestamp: Date.now(),
        }
      ]);
    }
  }, [userName]); 

  // Save Crystals
  useEffect(() => {
    if (userName) {
      localStorage.setItem(`crystal_db_${userName}`, JSON.stringify(crystals));
    }
  }, [crystals, userName]);

  // Save Chat
  useEffect(() => {
    if (userName) {
      const chatToSave = messages.slice(-50);
      localStorage.setItem(`crystal_chat_${userName}`, JSON.stringify(chatToSave));
    }
  }, [messages, userName]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (view === AppView.CHAT) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, view]);

  // --- Handlers ---

  const handleSendMessage = async () => {
    if (!input.trim() || !userName) return;

    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      text: input,
      timestamp: Date.now(),
    };

    // Optimistic update
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setIsTyping(true);

    // Placeholder for thinking message
    const thinkingId = generateId();
    setMessages(prev => [...prev, {
      id: thinkingId,
      role: 'model',
      text: '',
      timestamp: Date.now(),
      isThinking: true
    }]);

    try {
      // Send history (excluding the thinking placeholder)
      const result = await searchAndAnalyze(userMsg.text, newHistory, userName);
      
      setMessages(prev => prev.map(msg => 
        msg.id === thinkingId ? {
          ...msg,
          text: result.text || "I couldn't find anything on that, sorry.",
          groundingChunks: result.groundingChunks,
          isThinking: false
        } : msg
      ));

    } catch (error) {
      setMessages(prev => prev.map(msg => 
        msg.id === thinkingId ? {
          ...msg,
          text: "I encountered an error accessing the knowledge stream. Please check your connection.",
          isThinking: false
        } : msg
      ));
    } finally {
      setIsTyping(false);
    }
  };

  const handleCrystallize = async (text: string, msgId: string) => {
    const msgIndex = messages.findIndex(m => m.id === msgId);
    let context = "General Knowledge";
    if (msgIndex > 0 && messages[msgIndex - 1].role === 'user') {
      context = messages[msgIndex - 1].text;
    }

    setCrystallizingId(msgId);

    try {
      const data: CrystalExtractionResponse = await crystallizeKnowledge(text, context);
      
      const msg = messages.find(m => m.id === msgId);
      const sourceUrl = msg?.groundingChunks?.[0]?.web?.uri;

      const newCrystal: Crystal = {
        id: generateId(),
        title: data.title,
        content: data.summary,
        keywords: data.keywords,
        category: data.category,
        sourceUrl: sourceUrl,
        createdAt: Date.now()
      };

      setCrystals(prev => [newCrystal, ...prev]);
      setView(AppView.DATABASE);
      
    } catch (error) {
      alert("Failed to crystallize insight. Try again.");
    } finally {
      setCrystallizingId(null);
    }
  };

  const handleDeleteCrystal = (id: string) => {
    setCrystals(prev => prev.filter(c => c.id !== id));
  };

  const handleResetData = () => {
    if (confirm("Are you sure you want to clear all chat history and saved insights?")) {
      setMessages([
        {
          id: 'welcome',
          role: 'model',
          text: `Hello **${userName}**! I am **Crystallize AI**. \n\nI can research the web for you and help you build a personal knowledge base. Ask me anything!`,
          timestamp: Date.now(),
        }
      ]);
      setCrystals([]);
      if (userName) {
        localStorage.removeItem(`crystal_db_${userName}`);
        localStorage.removeItem(`crystal_chat_${userName}`);
      }
    }
  };

  const filteredCrystals = crystals.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase())) ||
    c.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Login View ---
  if (!userName) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 transition-colors duration-300 p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-slate-700">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-brand-100 dark:bg-brand-900/30 rounded-2xl">
              <Zap className="text-brand-600 dark:text-brand-500" size={40} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">Crystallize AI</h1>
          <p className="text-center text-gray-500 dark:text-slate-400 mb-8">Your personal knowledge accumulation engine.</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">What should we call you?</label>
              <input 
                type="text" 
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Enter your name"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none dark:text-white transition-all"
              />
            </div>
            <Button onClick={handleLogin} className="w-full py-3 text-lg group">
              Get Started
              <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          
          <div className="mt-6 flex justify-center">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            >
               {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Main App View ---
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 overflow-hidden font-sans transition-colors duration-300">
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 z-20 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2 text-brand-600 dark:text-brand-500">
          <Zap className="fill-current" size={20} />
          <span className="font-bold text-lg">Crystallize</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-700 dark:text-gray-200">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-10 w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 transform transition-transform duration-300 ease-in-out flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-between border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center space-x-2 text-brand-600 dark:text-brand-500">
            <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg">
              <Zap className="fill-brand-500 text-brand-500" size={24} />
            </div>
            <span className="font-bold text-xl text-gray-800 dark:text-white">Crystallize</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => { setView(AppView.CHAT); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${view === AppView.CHAT ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 font-medium shadow-sm ring-1 ring-brand-200 dark:ring-brand-800' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
          >
            <MessageSquare size={20} />
            <span>Research Chat</span>
          </button>
          <button 
            onClick={() => { setView(AppView.DATABASE); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${view === AppView.DATABASE ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 font-medium shadow-sm ring-1 ring-brand-200 dark:ring-brand-800' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
          >
            <Database size={20} />
            <div className="flex-1 text-left flex justify-between items-center">
              <span>Knowledge Base</span>
              <span className="text-xs bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-slate-200 px-2 py-0.5 rounded-full">{crystals.length}</span>
            </div>
          </button>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-3 px-2 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex-shrink-0 flex items-center justify-center text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
                <UserIcon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{userName}</p>
                <p className="text-xs text-gray-500 dark:text-slate-500 truncate">Local Session</p>
              </div>
            </div>
            <button onClick={toggleTheme} className="p-1.5 text-gray-500 dark:text-slate-400 hover:text-brand-500 transition-colors">
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm"
              title="Logout"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
             <button 
              onClick={handleResetData}
              className="flex items-center justify-center px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 transition-colors text-sm"
              title="Clear all data"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-slate-700">
            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 mb-1">
              <div className="bg-brand-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(crystals.length * 5, 100)}%` }}></div>
            </div>
            <span className="text-xs text-brand-600 dark:text-brand-400 font-medium">{crystals.length} Insights Stored</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full pt-14 md:pt-0 bg-gray-50/50 dark:bg-slate-900/50 transition-colors duration-300">
        
        {view === AppView.CHAT ? (
          /* --- CHAT VIEW --- */
          <>
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4">
              <div className="max-w-4xl mx-auto w-full">
                {messages.map(msg => (
                  <ChatMessage 
                    key={msg.id} 
                    message={msg} 
                    onCrystallize={handleCrystallize}
                    isCrystallizing={crystallizingId === msg.id}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 transition-colors">
              <div className="max-w-4xl mx-auto w-full relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask a question to research..."
                  className={`w-full pl-5 pr-14 py-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-2xl focus:outline-none focus:ring-0 transition-all shadow-sm ${isDarkMode ? 'glow-animation' : 'focus:ring-2 focus:ring-brand-500 focus:bg-white'}`}
                  disabled={isTyping}
                />
                <div className="absolute right-2 top-2">
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!input.trim() || isTyping}
                    className="!rounded-xl !px-3 !py-2"
                  >
                    <Send size={20} />
                  </Button>
                </div>
              </div>
              <p className="text-center text-xs text-gray-400 dark:text-slate-500 mt-2">
                Powered by Crystallize AI with Google Search Grounding
              </p>
               <p className="text-center text-xs text-gray-400 dark:text-slate-500 mt-2">
                Build By Karthikeyan S
              </p>
            </div>
          </>
        ) : (
          /* --- DATABASE VIEW --- */
          <div className="flex-1 overflow-y-auto p-6 md:p-10">
            <div className="max-w-7xl mx-auto w-full">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Crystallized Intelligence</h1>
                  <p className="text-gray-500 dark:text-slate-400 mt-1">Your extracted knowledge, structured and clear.</p>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search crystals..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-full md:w-64 shadow-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500"
                  />
                </div>
              </div>

              {crystals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-gray-300 dark:border-slate-700 transition-colors">
                  <div className="w-16 h-16 bg-brand-50 dark:bg-slate-700 text-brand-400 rounded-full flex items-center justify-center mb-4">
                    <LayoutGrid size={32} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">No Crystals Found</h3>
                  <p className="text-gray-500 dark:text-slate-400 max-w-md mt-2 mb-6">
                    Go to the chat, ask questions, and click "Crystallize Insight" to populate your database.
                  </p>
                  <Button onClick={() => setView(AppView.CHAT)} icon={<MessageSquare size={18} />}>
                    Start Researching
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCrystals.map(crystal => (
                    <div key={crystal.id} className="h-full">
                      <CrystalCard crystal={crystal} onDelete={handleDeleteCrystal} />
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;
