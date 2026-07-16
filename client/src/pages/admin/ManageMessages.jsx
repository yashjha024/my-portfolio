import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { StatusBadge } from '../../components/admin/StatusBadge.jsx';
import {
  MessageSquare,
  Search,
  Trash2,
  Mail,
  User,
  Clock,
  AlertCircle,
  Loader2,
  Reply,
  Inbox,
  Check,
} from 'lucide-react';

export const ManageMessagesPage = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const endpoint =
        activeTab === 'all' ? '/admin/messages' : `/admin/messages?status=${activeTab}`;
      const res = await api.get(endpoint);
      if (res.data?.success) {
        setMessages(res.data.messages || []);
        if (res.data.messages?.length > 0 && !selectedMessage) {
          setSelectedMessage(res.data.messages[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch admin messages:', err);
      setError('Could not fetch inquiries. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [activeTab]);

  const updateStatus = async (id, newStatus) => {
    try {
      setActionLoading(true);
      const res = await api.put(`/admin/messages/${id}/status`, { status: newStatus });
      if (res.data?.success) {
        setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m)));
        if (selectedMessage && selectedMessage.id === id) {
          setSelectedMessage((prev) => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update message status.');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteMessageItem = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this message?')) return;
    try {
      setActionLoading(true);
      const res = await api.delete(`/admin/messages/${id}`);
      if (res.data?.success) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
        if (selectedMessage?.id === id) {
          const remaining = messages.filter((m) => m.id !== id);
          setSelectedMessage(remaining[0] || null);
        }
      }
    } catch (err) {
      console.error('Error deleting message:', err);
      alert('Failed to delete inquiry.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredMessages = messages.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (m.name && m.name.toLowerCase().includes(q)) ||
      (m.email && m.email.toLowerCase().includes(q)) ||
      (m.subject && m.subject.toLowerCase().includes(q)) ||
      (m.message && m.message.toLowerCase().includes(q))
    );
  });

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'new':
        return 'emerald';
      case 'read':
        return 'indigo';
      case 'replied':
        return 'violet';
      case 'archived':
        return 'slate';
      default:
        return 'slate';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-indigo-400" />
            <h1 className="font-heading text-2xl font-bold tracking-tight text-white">
              Inquiries & Inbox
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            Review and respond to visitor inquiries submitted via the Contact form (`/contact`).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 font-mono text-xs text-slate-400">
            Total Inquiries:{' '}
            <strong className="font-bold text-indigo-400">{messages.length}</strong>
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center">
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 p-1.5">
          {['all', 'new', 'read', 'replied', 'archived'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-3 py-1.5 font-mono text-xs uppercase capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-indigo-600 font-bold text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              {tab === 'all' ? 'All Messages' : tab}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search name, email, subject, keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-10 pr-4 text-sm text-white transition-colors placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <span className="font-mono text-xs uppercase text-slate-400">
            Loading visitor inquiries...
          </span>
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="mx-auto my-6 max-w-md space-y-3 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
            <Inbox className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-white">No Inquiries Found</h3>
          <p className="mx-auto max-w-sm text-xs leading-relaxed text-slate-400">
            {searchQuery
              ? 'No messages matched your search query. Try broadening your keywords.'
              : `There are currently no messages marked as "${activeTab}".`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* Message List Sidebar */}
          <div className="max-h-[680px] space-y-2.5 overflow-y-auto pr-1 lg:col-span-5">
            {filteredMessages.map((m) => {
              const isSelected = selectedMessage?.id === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => {
                    setSelectedMessage(m);
                    if (m.status === 'new') {
                      updateStatus(m.id, 'read');
                    }
                  }}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    isSelected
                      ? 'border-indigo-500/50 bg-indigo-950/40 shadow-md'
                      : 'border-slate-800/80 bg-slate-900/80 hover:border-slate-700 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-bold text-white">{m.name}</span>
                    <StatusBadge status={m.status} variant={getStatusBadgeVariant(m.status)} />
                  </div>
                  <p className="mb-2 truncate font-mono text-xs text-indigo-300">
                    {m.subject || 'General Inquiry'}
                  </p>
                  <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-slate-400">
                    {m.message}
                  </p>
                  <div className="flex items-center justify-between border-t border-slate-800/60 pt-2 font-mono text-[10px] text-slate-500">
                    <span className="truncate">{m.email}</span>
                    <span>{new Date(m.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Message Pane */}
          {selectedMessage ? (
            <div className="sticky top-6 space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl lg:col-span-7">
              <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-800 pb-4 sm:flex-row sm:items-center">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <h2 className="text-lg font-bold tracking-tight text-white">
                      {selectedMessage.subject}
                    </h2>
                    <StatusBadge
                      status={selectedMessage.status}
                      variant={getStatusBadgeVariant(selectedMessage.status)}
                    />
                  </div>
                  <div className="flex items-center gap-4 font-mono text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 font-medium text-slate-300">
                      <User className="h-3.5 w-3.5 text-indigo-400" />
                      {selectedMessage.name}
                    </span>
                    <span className="flex items-center gap-1.5 text-indigo-300">
                      <Mail className="h-3.5 w-3.5" />
                      <a href={`mailto:${selectedMessage.email}`} className="hover:underline">
                        {selectedMessage.email}
                      </a>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject || 'Your Inquiry')}`}
                    onClick={() => updateStatus(selectedMessage.id, 'replied')}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-indigo-500"
                  >
                    <Reply className="h-3.5 w-3.5" /> Reply via Email
                  </a>
                  <button
                    onClick={() => deleteMessageItem(selectedMessage.id)}
                    disabled={actionLoading}
                    className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-2.5 py-2 text-xs text-rose-300 transition-colors hover:bg-rose-500/20"
                    title="Delete Inquiry"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Message Body Content */}
              <div className="whitespace-pre-wrap rounded-xl border border-slate-800/80 bg-slate-950 p-5 font-sans text-sm leading-relaxed text-slate-200">
                {selectedMessage.message}
              </div>

              {/* Status Management Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-4">
                <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                  <span>Received: {new Date(selectedMessage.created_at).toLocaleString()}</span>
                  {selectedMessage.ip_address && (
                    <span className="ml-2 rounded border border-slate-800 bg-slate-950 px-2 py-0.5">
                      IP: {selectedMessage.ip_address}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="mr-1 font-mono text-xs uppercase text-slate-400">
                    Mark Status:
                  </span>
                  {['new', 'read', 'replied', 'archived'].map((st) => (
                    <button
                      key={st}
                      onClick={() => updateStatus(selectedMessage.id, st)}
                      disabled={selectedMessage.status === st || actionLoading}
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-mono text-xs uppercase transition-colors ${
                        selectedMessage.status === st
                          ? 'cursor-not-allowed bg-slate-800 font-bold text-slate-400 opacity-60'
                          : 'border border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      {selectedMessage.status === st && (
                        <Check className="h-3 w-3 text-indigo-400" />
                      )}
                      <span>{st}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-12 text-center text-xs text-slate-500 lg:col-span-7">
              Select an inquiry from the left sidebar to view details and respond.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
