import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  Trash2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Check,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

// Simple, safe lightweight formatter for bot markdown replies
function FormattedMessage({ text }) {
  if (!text) return null;

  // Split into lines
  const lines = text.split('\n');

  return (
    <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed text-slate-800">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Headings
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-black text-slate-900 text-xs sm:text-sm pt-1 border-b border-amber-200/50 pb-0.5">
              {trimmed.replace('### ', '')}
            </h4>
          );
        }

        // Blockquote / Notes
        if (trimmed.startsWith('> ')) {
          return (
            <div
              key={idx}
              className="pl-2.5 py-1 border-l-2 border-amber-500 bg-amber-50/70 rounded-r-md text-[11px] text-amber-900 font-medium my-1"
            >
              {renderFormattedSpans(trimmed.replace('> ', ''))}
            </div>
          );
        }

        // Bullet points
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1">
              <span className="text-amber-500 font-bold text-xs mt-0.5">•</span>
              <span className="flex-1">{renderFormattedSpans(trimmed.slice(2))}</span>
            </div>
          );
        }

        // Numbered list
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1">
              <span className="font-bold text-amber-700 text-[11px] mt-0.5 bg-amber-100/80 px-1.5 rounded">
                {numMatch[1]}
              </span>
              <span className="flex-1">{renderFormattedSpans(numMatch[2])}</span>
            </div>
          );
        }

        return <p key={idx}>{renderFormattedSpans(trimmed)}</p>;
      })}
    </div>
  );
}

// Inline span parser for bold, italics, and markdown links [text](url)
function renderFormattedSpans(text) {
  // Replace links [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const label = match[1];
    const url = match[2];
    parts.push(
      <a
        key={match.index}
        href={url}
        className="text-amber-700 font-bold underline hover:text-amber-800 transition-colors inline-flex items-center gap-0.5"
      >
        {label}
        {url.startsWith('http') && <ExternalLink className="w-2.5 h-2.5 inline" />}
      </a>
    );
    lastIndex = linkRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  // Parse bold **text** in remaining text pieces
  return parts.map((part, pIdx) => {
    if (typeof part !== 'string') return part;

    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((sub, sIdx) => {
      if (sub.startsWith('**') && sub.endsWith('**')) {
        return (
          <strong key={`${pIdx}-${sIdx}`} className="font-bold text-slate-900">
            {sub.slice(2, -2)}
          </strong>
        );
      }
      return sub;
    });
  });
}

const DEFAULT_SUGGESTIONS = [
  '🎓 How do I apply for admissions & scholarships?',
  '📋 How does student verification work?',
  '🧭 Career advice after 12th or degree',
  '🎫 Where can I track my support tickets?',
];

export default function EduChatbot({
  showWhatsApp = true,
  whatsAppNumber = '918660609247',
  whatsAppMessage = 'Hi Educarrus! I need help with academic guidance.',
}) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredOrb, setHoveredOrb] = useState(null); // 'whatsapp' | 'edubot' | null
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Hello ${user?.fullName ? user.fullName.split(' ')[0] : 'there'}! 👋 I am **EduBot**, your Educarrus Real-Time AI Assistant.\n\nAsk me anything about scholarship guidance, college admissions, student document verification, or tracking support tickets!`,
      createdAt: new Date().toISOString(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [customApiKey] = useState(() => {
    return localStorage.getItem('educarrus_gemini_api_key') || '';
  });
  const [serverKeyStatus, setServerKeyStatus] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Check backend Gemini status on mount
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.get('/chat/status');
        if (res.data?.success) {
          setServerKeyStatus(res.data.data.isGeminiConfigured);
        }
      } catch {
        // Backend offline or route pending
      }
    };
    fetchStatus();
  }, []);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, messages]);

  // Clear chat
  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        text: 'Chat history cleared. How can I assist you with the Educarrus platform today?',
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  // Submit message
  const handleSendMessage = async (textToSend) => {
    const text = (typeof textToSend === 'string' ? textToSend : inputValue).trim();
    if (!text || isLoading) return;

    const userMsgId = 'msg-' + Date.now();
    const newMsg = {
      id: userMsgId,
      role: 'user',
      text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Build history for backend
      const historyPayload = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await api.post('/chat', {
        message: text,
        history: historyPayload,
        apiKey: customApiKey || undefined,
        userContext: user
          ? {
              fullName: user.fullName,
              email: user.email,
              role: user.role,
            }
          : undefined,
      });

      if (res.data?.success && res.data.data?.reply) {
        const botReply = res.data.data.reply;
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot-' + Date.now(),
            role: 'assistant',
            text: botReply,
            isGemini: res.data.data.isGeminiActive,
            createdAt: new Date().toISOString(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot-err-' + Date.now(),
            role: 'assistant',
            text: 'I encountered an unexpected issue retrieving that answer. Please try again or check the [Help & Support](/userdashboard?tab=support) desk.',
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot-err-' + Date.now(),
          role: 'assistant',
          text: `⚠️ Error communicating with EduBot: ${err.friendlyMessage || err.message || 'Please check your connection and try again.'}`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const isGeminiEnabled = Boolean(customApiKey || serverKeyStatus);

  // Clean and prepare WhatsApp link
  const cleanNumber = (whatsAppNumber || '').replace(/[^0-9]/g, '');
  const finalNumber = cleanNumber.length === 10 ? `91${cleanNumber}` : cleanNumber;
  const whatsappUrl = `https://wa.me/${finalNumber}?text=${encodeURIComponent(
    whatsAppMessage
  )}`;

  // Coordinated Collision & Bound Physics Configuration
  const collisionTimes = [0, 0.32, 0.44, 0.48, 0.54, 0.68, 0.82, 1];

  // WhatsApp Orb (Left) Animation:
  // Bound by gravitational force, perpetually colliding and rebounding
  const whatsAppAnimate = !showWhatsApp
    ? {}
    : isOpen
    ? { x: -30, y: 0, scaleX: 1, scaleY: 1, rotate: 0 }
    : hoveredOrb
    ? { x: -32, y: [0, -3, 0], scaleX: 1.05, scaleY: 1.05, rotate: 0 }
    : {
        x: [-36, -18, -6, -2, -32, -44, -32, -36],
        y: [0, -3, -1, 0, 3, 4, -2, 0],
        scaleX: [0.96, 1.10, 1.18, 0.76, 1.22, 0.88, 1.04, 0.96],
        scaleY: [1.04, 0.90, 0.84, 1.28, 0.80, 1.14, 0.96, 1.04],
        rotate: [0, -4, -8, -14, 8, -4, 2, 0],
      };

  // EduBot Orb (Right) Animation:
  // Symmetric collision partner bound by the same invisible force
  const eduBotAnimate = !showWhatsApp
    ? {
        y: isOpen ? 0 : [0, -10, 0],
        boxShadow: isOpen
          ? '0 10px 25px -5px rgba(15, 23, 42, 0.4)'
          : [
              '0 10px 25px -4px rgba(245, 158, 11, 0.45), 0 4px 6px -4px rgba(245, 158, 11, 0.2)',
              '0 20px 35px -4px rgba(245, 158, 11, 0.7), 0 8px 10px -4px rgba(245, 158, 11, 0.35)',
              '0 10px 25px -4px rgba(245, 158, 11, 0.45), 0 4px 6px -4px rgba(245, 158, 11, 0.2)',
            ],
      }
    : isOpen
    ? { x: 30, y: 0, scaleX: 1, scaleY: 1, rotate: 0 }
    : hoveredOrb
    ? { x: 32, y: [0, 3, 0], scaleX: 1.05, scaleY: 1.05, rotate: 0 }
    : {
        x: [36, 18, 6, 2, 32, 44, 32, 36],
        y: [0, 3, 1, 0, -3, -4, 2, 0],
        scaleX: [0.96, 1.10, 1.18, 0.76, 1.22, 0.88, 1.04, 0.96],
        scaleY: [1.04, 0.90, 0.84, 1.28, 0.80, 1.14, 0.96, 1.04],
        rotate: [0, 4, 8, 14, -8, 4, -2, 0],
      };

  // Central Collision Flash & Shockwave
  const shockwaveTimes = [0, 0.44, 0.47, 0.51, 0.57, 0.68, 0.82, 1];
  const shockwaveAnimate =
    !showWhatsApp || isOpen || hoveredOrb
      ? { scale: 0, opacity: 0 }
      : {
          scale: [0, 0, 0.3, 2.0, 2.6, 0, 0, 0],
          opacity: [0, 0, 0.95, 0.8, 0, 0, 0, 0],
        };

  return (
    <>
      {/* 1. Bound Floating Support Cluster (WhatsApp + AI Chatbot Colliding & Orbiting in a Circle) */}
      <div
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center justify-center select-none pointer-events-none"
        style={{ width: showWhatsApp ? '170px' : 'auto', height: showWhatsApp ? '170px' : '76px' }}
      >
        {/* Circular Orbital Tracks (Cosmic gravitational event horizons) */}
        {showWhatsApp && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Outer Orbit Path */}
            <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-full border border-dashed border-amber-400/25 animate-pulse" />
            {/* Inner Core Gravitational Ring */}
            <div className="w-22 h-22 rounded-full border border-dotted border-emerald-400/25" />
          </div>
        )}

        {/* 360° Circular Orbital Revolving Rig (Carries the pair in continuous circular orbit) */}
        <motion.div
          className="relative flex items-center justify-center w-full h-full pointer-events-none"
          animate={
            isOpen || hoveredOrb
              ? { rotate: 0 }
              : { rotate: [0, 360] }
          }
          transition={
            isOpen || hoveredOrb
              ? { duration: 0.5, ease: 'easeOut' }
              : { duration: 5.2, repeat: Infinity, ease: 'linear' }
          }
        >
          {/* Invisible / Semi-Visible Force Tether (Magnetic Flux & Plasma Beam) */}
          {showWhatsApp && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
              viewBox="0 0 170 170"
            >
              <defs>
                <linearGradient id="forceTetherGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#25D366" stopOpacity="0.85" />
                  <stop offset="50%" stopColor="#F59E0B" stopOpacity="1" />
                  <stop offset="100%" stopColor="#FFB52E" stopOpacity="0.85" />
                </linearGradient>
                <filter id="glowTether" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Upper magnetic flux arc */}
              <motion.path
                d="M 49 85 Q 85 62 121 85"
                fill="none"
                stroke="url(#forceTetherGrad)"
                strokeWidth="2.5"
                filter="url(#glowTether)"
                animate={
                  isOpen || hoveredOrb
                    ? { opacity: 0.3 }
                    : {
                        opacity: [0.3, 0.85, 1, 0.4, 0.9, 0.3],
                        strokeWidth: [2, 3.5, 4.5, 1.8, 3, 2],
                      }
                }
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Lower magnetic flux arc */}
              <motion.path
                d="M 49 85 Q 85 108 121 85"
                fill="none"
                stroke="url(#forceTetherGrad)"
                strokeWidth="2.5"
                filter="url(#glowTether)"
                animate={
                  isOpen || hoveredOrb
                    ? { opacity: 0.3 }
                    : {
                        opacity: [0.3, 0.85, 1, 0.4, 0.9, 0.3],
                        strokeWidth: [2, 3.5, 4.5, 1.8, 3, 2],
                      }
                }
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Central laser core connecting their masses */}
              <motion.line
                x1="49"
                y1="85"
                x2="121"
                y2="85"
                stroke="url(#forceTetherGrad)"
                strokeDasharray="4 3"
                strokeWidth="2"
                animate={
                  isOpen || hoveredOrb
                    ? { opacity: 0.4 }
                    : {
                        opacity: [0.4, 0.85, 1, 0.3, 0.75, 0.4],
                        strokeDashoffset: [0, -24],
                      }
                }
                transition={{ duration: 1.3, repeat: Infinity, ease: 'linear' }}
              />
            </svg>
          )}

          {/* Collision Impact Spark & Shockwave Burst */}
          {showWhatsApp && (
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-full flex items-center justify-center z-10"
              animate={shockwaveAnimate}
              transition={
                isOpen || hoveredOrb
                  ? { duration: 0.2 }
                  : {
                      duration: 2.6,
                      repeat: Infinity,
                      times: shockwaveTimes,
                      ease: 'easeOut',
                    }
              }
              style={{
                width: 44,
                height: 44,
                background:
                  'radial-gradient(circle, rgba(251,191,36,0.95) 0%, rgba(37,211,102,0.85) 45%, rgba(255,255,255,0) 70%)',
                boxShadow:
                  '0 0 25px 6px rgba(251, 191, 36, 0.85), 0 0 15px 4px rgba(37, 211, 102, 0.65)',
              }}
            >
              <Zap className="w-5 h-5 text-amber-100 fill-amber-200 drop-shadow animate-ping" />
            </motion.div>
          )}

          {/* Left Orb: WhatsApp Verification Button */}
          {showWhatsApp && (
            <motion.a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => setHoveredOrb('whatsapp')}
              onMouseLeave={() => setHoveredOrb(null)}
              animate={whatsAppAnimate}
              transition={
                isOpen
                  ? { duration: 0.3 }
                  : hoveredOrb
                  ? { y: { duration: 2, repeat: Infinity, ease: 'easeInOut' } }
                  : {
                      duration: 2.6,
                      repeat: Infinity,
                      times: collisionTimes,
                      ease: 'linear',
                    }
              }
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.92 }}
              className="pointer-events-auto relative z-20 w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-[#128C7E] via-[#25D366] to-[#25D366] text-white flex items-center justify-center border-2 border-emerald-200/90 cursor-pointer shadow-xl transition-shadow hover:shadow-emerald-500/50"
              aria-label="Chat on WhatsApp with Educarrus Support"
            >
              {!isOpen && (
                <span className="absolute -inset-1 rounded-full bg-[#25D366] opacity-30 animate-ping pointer-events-none" />
              )}

              {/* Counter-rotation wrapper: Keeps icon & badge perfectly upright while orbiting */}
              <motion.div
                animate={
                  isOpen || hoveredOrb
                    ? { rotate: 0 }
                    : { rotate: [0, -360] }
                }
                transition={
                  isOpen || hoveredOrb
                    ? { duration: 0.5, ease: 'easeOut' }
                    : { duration: 5.2, repeat: Infinity, ease: 'linear' }
                }
                className="relative flex items-center justify-center w-full h-full"
              >
                {/* WhatsApp SVG Icon */}
                <svg
                  viewBox="0 0 24 24"
                  className="w-6 h-6 sm:w-7 sm:h-7 fill-current text-white drop-shadow-md z-10"
                  aria-hidden="true"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>

                {/* Verified Badge */}
                <span
                  className="absolute -top-1 -left-1 w-4.5 h-4.5 rounded-full bg-white flex items-center justify-center shadow-md border border-emerald-300 z-20"
                  title="Verified Support"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366]" />
                </span>
              </motion.div>
            </motion.a>
          )}

          {/* Right Orb: EduBot AI Advisor Button */}
          <motion.button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            onMouseEnter={() => setHoveredOrb('edubot')}
            onMouseLeave={() => setHoveredOrb(null)}
            animate={eduBotAnimate}
            transition={
              isOpen
                ? { duration: 0.3 }
                : hoveredOrb
                ? { y: { duration: 2, repeat: Infinity, ease: 'easeInOut' } }
                : !showWhatsApp
                ? {
                    y: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' },
                    boxShadow: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' },
                  }
                : {
                    duration: 2.6,
                    repeat: Infinity,
                    times: collisionTimes,
                    ease: 'linear',
                  }
            }
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.92 }}
            className="pointer-events-auto relative z-20 w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-300 text-slate-950 flex items-center justify-center border-2 border-amber-200/90 cursor-pointer shadow-xl transition-shadow hover:shadow-amber-500/50"
            aria-label={isOpen ? 'Close Educarrus AI Chatbot' : 'Open Educarrus AI Chatbot'}
          >
            {/* Animated floating outer halo waves */}
            {!isOpen && (
              <span className="absolute -inset-1 rounded-full bg-amber-400 opacity-30 animate-ping pointer-events-none" />
            )}

            {/* Counter-rotation wrapper: Keeps bot face & badges upright while orbiting */}
            <motion.div
              animate={
                isOpen || hoveredOrb
                  ? { rotate: 0 }
                  : { rotate: [0, -360] }
              }
              transition={
                isOpen || hoveredOrb
                  ? { duration: 0.5, ease: 'easeOut' }
                  : { duration: 5.2, repeat: Infinity, ease: 'linear' }
              }
              className="relative flex items-center justify-center w-full h-full"
            >
              {isOpen ? (
                <X className="w-6 h-6 text-slate-950 transition-transform rotate-90" />
              ) : (
                <div className="relative flex items-center justify-center">
                  <Bot className="w-6 h-6 sm:w-7 sm:h-7 text-slate-950 transition-transform group-hover:scale-110" />
                  <Sparkles
                    className="w-3 h-3 text-amber-950 absolute -top-1 -left-1 animate-spin"
                    style={{ animationDuration: '6s' }}
                  />
                  <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
                </div>
              )}
            </motion.div>
          </motion.button>
        </motion.div>

        {/* Tooltip Badges on Hover (Static above the circular cluster) */}
        <AnimatePresence>
          {hoveredOrb === 'whatsapp' && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.9 }}
              className="absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none z-30 bg-slate-900/95 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg border border-emerald-500/40 whitespace-nowrap flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
              Chat on WhatsApp
            </motion.div>
          )}
          {hoveredOrb === 'edubot' && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.9 }}
              className="absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none z-30 bg-slate-900/95 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg border border-amber-500/40 whitespace-nowrap flex items-center gap-1.5"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              Ask EduBot AI
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Interactive Chatbot Pop-up Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-24 sm:bottom-26 right-3 sm:right-6 z-50 w-[calc(100vw-24px)] sm:w-[420px] max-w-[440px] h-[580px] max-h-[82vh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden backdrop-blur-md"
          >
            {/* Pop-up Header */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white p-4 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 flex items-center justify-center text-slate-950 shadow-md">
                  <Bot className="w-5 h-5" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-950 rounded-full" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-sm text-white tracking-tight flex items-center gap-1.5">
                      EduBot AI
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-950 uppercase tracking-wider">
                        Online
                      </span>
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                    {isGeminiEnabled ? 'Powered by Google Gemini' : 'Educarrus Realtime Assistant'}
                  </p>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center gap-1">
                {/* Clear Chat */}
                <button
                  type="button"
                  onClick={handleClearChat}
                  title="Clear conversation"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
              {messages.map((m) => {
                const isUser = m.role === 'user';
                return (
                  <div
                    key={m.id}
                    className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {!isUser && (
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-bold shrink-0 mt-0.5 shadow-xs">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 shadow-xs ${
                        isUser
                          ? 'bg-slate-950 text-white rounded-tr-xs'
                          : 'bg-white border border-slate-200/80 rounded-tl-xs'
                      }`}
                    >
                      {isUser ? (
                        <p className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap">
                          {m.text}
                        </p>
                      ) : (
                        <FormattedMessage text={m.text} />
                      )}
                      <div
                        className={`text-[9px] mt-1.5 flex items-center gap-1.5 ${
                          isUser ? 'text-slate-400 justify-end' : 'text-slate-400'
                        }`}
                      >
                        <span>
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {!isUser && m.isGemini && (
                          <span className="font-bold text-amber-600 flex items-center gap-0.5">
                            • <Sparkles className="w-2.5 h-2.5" /> Gemini Flash
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing / Loading Indicator */}
              {isLoading && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-amber-400 flex items-center justify-center text-slate-950 shrink-0 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-3.5 shadow-xs flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="text-xs text-slate-400 ml-1 font-medium">EduBot is thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Chips */}
            {messages.length <= 2 && (
              <div className="px-4 py-2 bg-slate-100/70 border-t border-slate-200/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-amber-500" /> Quick:
                </span>
                {DEFAULT_SUGGESTIONS.map((sugg, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(sugg)}
                    className="text-[11px] font-semibold text-slate-700 bg-white hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 border border-slate-200 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer shrink-0 shadow-2xs"
                  >
                    {sugg}
                  </button>
                ))}
              </div>
            )}

            {/* Chat Input Footer */}
            <div className="p-3 bg-white border-t border-slate-200 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about admissions, verification, courses..."
                  disabled={isLoading}
                  className="flex-1 px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-amber-500 focus:bg-white text-xs sm:text-sm text-slate-900 transition-colors disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  className="w-10 h-10 rounded-2xl bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-amber-400 font-bold flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm shrink-0"
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 px-1">
                <span>Educarrus Real-Time AI Advisor</span>
                <span className="flex items-center gap-1 font-medium">
                  {isGeminiEnabled ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Gemini Active
                    </span>
                  ) : (
                    <span>Built-in Knowledge Engine</span>
                  )}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
