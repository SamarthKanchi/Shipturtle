import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Bot, User, Zap, Package, AlertTriangle, DollarSign, RotateCcw } from 'lucide-react';
import api from '../../lib/api';

const SUGGESTED_QUERIES = [
  { label: 'Show all products', icon: Package, query: 'List all products with their prices and stock levels' },
  { label: 'Low stock items', icon: AlertTriangle, query: 'Which products are low in stock (less than 10 units)?' },
  { label: 'Most expensive', icon: DollarSign, query: "What's the most expensive product?" },
  { label: 'Store overview', icon: Zap, query: 'Give me a quick overview of the store — products, vendors, and orders' },
];

/**
 * Lightweight markdown → HTML converter for LLM responses.
 * Handles: headers, bold, italic, inline code, code blocks, lists, and line breaks.
 */
function parseMarkdown(text) {
  if (!text) return '';

  // Escape HTML entities first
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks (``` ... ```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre class="md-codeblock"><code>${code.trim()}</code></pre>`;
  });

  // Process line by line for block-level elements
  const lines = html.split('\n');
  const processed = [];
  let inList = false;
  let listType = null; // 'ul' or 'ol'

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Skip lines inside code blocks (already handled)
    if (line.includes('<pre class="md-codeblock">')) {
      // Find the closing </pre> and pass through
      let block = line;
      while (!block.includes('</pre>') && i + 1 < lines.length) {
        i++;
        block += '\n' + lines[i];
      }
      if (inList) {
        processed.push(`</${listType}>`);
        inList = false;
        listType = null;
      }
      processed.push(block);
      continue;
    }

    // Headers
    const headerMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headerMatch) {
      if (inList) { processed.push(`</${listType}>`); inList = false; listType = null; }
      const level = headerMatch[1].length;
      processed.push(`<h${level} class="md-h${level}">${inlineFormat(headerMatch[2])}</h${level}>`);
      continue;
    }

    // Unordered list items (-, *, +)
    const ulMatch = line.match(/^(\s*)[-*+]\s+(.+)/);
    if (ulMatch) {
      if (!inList || listType !== 'ul') {
        if (inList) processed.push(`</${listType}>`);
        processed.push('<ul class="md-list">');
        inList = true;
        listType = 'ul';
      }
      processed.push(`<li>${inlineFormat(ulMatch[2])}</li>`);
      continue;
    }

    // Ordered list items
    const olMatch = line.match(/^(\s*)\d+[.)]\s+(.+)/);
    if (olMatch) {
      if (!inList || listType !== 'ol') {
        if (inList) processed.push(`</${listType}>`);
        processed.push('<ol class="md-list md-ol">');
        inList = true;
        listType = 'ol';
      }
      processed.push(`<li>${inlineFormat(olMatch[2])}</li>`);
      continue;
    }

    // Close list if we hit a non-list line
    if (inList && line.trim() === '') {
      processed.push(`</${listType}>`);
      inList = false;
      listType = null;
      processed.push('<br/>');
      continue;
    }
    if (inList && !ulMatch && !olMatch) {
      processed.push(`</${listType}>`);
      inList = false;
      listType = null;
    }

    // Empty line → spacer
    if (line.trim() === '') {
      processed.push('<br/>');
      continue;
    }

    // Regular paragraph
    processed.push(`<p class="md-p">${inlineFormat(line)}</p>`);
  }

  if (inList) processed.push(`</${listType}>`);

  return processed.join('');
}

/** Handles inline formatting: bold, italic, code, strikethrough */
function inlineFormat(text) {
  return text
    // Inline code `code`
    .replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>')
    // Bold + italic ***text***
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    // Bold **text**
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic *text* (but not * in lists which are already handled)
    .replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>')
    // Strikethrough ~~text~~
    .replace(/~~(.+?)~~/g, '<del>$1</del>');
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 max-w-[85%]">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
        <Bot size={16} className="text-violet-400" />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-zinc-800/60 border border-white/[0.06]">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-violet-400/70"
              animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, index }) {
  const isUser = message.role === 'user';
  const renderedHtml = useMemo(
    () => (isUser ? null : parseMarkdown(message.content)),
    [message.content, isUser]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''} max-w-[85%] ${isUser ? 'ml-auto' : ''}`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-violet-500'
            : 'bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/30'
        }`}
      >
        {isUser ? <User size={14} className="text-white" /> : <Bot size={16} className="text-violet-400" />}
      </div>

      {/* Bubble */}
      {isUser ? (
        <div className="px-4 py-3 rounded-2xl rounded-tr-md bg-gradient-to-br from-blue-500/90 to-violet-500/90 text-white text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      ) : (
        <div
          className="md-content px-4 py-3 rounded-2xl rounded-tl-md bg-zinc-800/60 border border-white/[0.06] text-zinc-200 text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      )}
    </motion.div>
  );
}

export default function ChatBot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (text) => {
    const userMessage = text || input.trim();
    if (!userMessage || loading) return;

    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/chat', {
        message: userMessage,
        history: newMessages.slice(0, -1), // send previous history, not the new user message
      });

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Something went wrong. Please try again.';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ ${errorMsg}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    inputRef.current?.focus();
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* ─── HEADER ─── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-zinc-100">SyncFlow AI</h1>
            <p className="text-xs text-zinc-500">Ask about your products, inventory & orders</p>
          </div>
        </div>
        {messages.length > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={clearChat}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800/50 hover:bg-zinc-800 border border-white/[0.06] transition-all"
          >
            <RotateCcw size={12} />
            Clear chat
          </motion.button>
        )}
      </div>

      {/* ─── MESSAGES AREA ─── */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {isEmpty ? (
          /* ─── EMPTY STATE ─── */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center h-full text-center"
          >
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/20 flex items-center justify-center mb-6">
              <Sparkles size={36} className="text-violet-400" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-100 mb-2">How can I help you?</h2>
            <p className="text-sm text-zinc-500 mb-8 max-w-md">
              I have access to your entire product catalog, inventory levels, and store data. Ask me anything!
            </p>

            {/* Suggested queries */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              {SUGGESTED_QUERIES.map((sq) => (
                <motion.button
                  key={sq.label}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => sendMessage(sq.query)}
                  className="group flex items-center gap-3 px-4 py-3.5 rounded-xl border border-white/[0.06] bg-zinc-900/50 hover:bg-zinc-800/60 hover:border-violet-500/20 text-left transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/10 to-blue-500/10 flex items-center justify-center group-hover:from-violet-500/20 group-hover:to-blue-500/20 transition-all">
                    <sq.icon size={16} className="text-violet-400" />
                  </div>
                  <span className="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors">{sq.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          /* ─── CONVERSATION ─── */
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} index={i} />
            ))}
            {loading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ─── INPUT AREA ─── */}
      <div className="border-t border-white/[0.06] px-6 py-4 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 p-2 rounded-2xl border border-white/[0.08] bg-zinc-900/60 focus-within:border-violet-500/30 focus-within:ring-1 focus-within:ring-violet-500/10 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about products, stock levels, pricing..."
              rows={1}
              className="flex-1 bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600 resize-none px-2 py-2 max-h-32"
              style={{ minHeight: '36px' }}
              disabled={loading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:from-violet-400 hover:to-blue-400 transition-all flex-shrink-0"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-[11px] text-zinc-600 text-center mt-2">
            Powered by Groq · Responses are based on your live product data
          </p>
        </div>
      </div>
    </div>
  );
}
