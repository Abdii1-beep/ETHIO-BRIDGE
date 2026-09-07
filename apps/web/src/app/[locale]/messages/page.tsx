'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import Shell from '@/components/shell';
import { apiFetch } from '@/lib/api-client';
import { getActiveOrganizationId } from '@/lib/auth';

interface OtherOrgInfo {
  id: string;
  legalName: string;
  tradingName: string | null;
  country: string | null;
  verificationLevel: string;
  preferredLanguage: string;
}

interface SenderInfo {
  userId: string;
  name: string;
  orgId: string;
  orgName: string;
  country: string | null;
  preferredLanguage: string;
}

interface ChatMsg {
  id: string;
  sender: SenderInfo;
  originalLang: string;
  originalText: string;
  translations: Record<string, string>;
  attachmentUrl: string | null;
  createdAt: string;
}

interface ThreadItem {
  id: string;
  type: string;
  referenceId: string | null;
  otherOrg: OtherOrgInfo | null;
  title: string;
  lastMessage: { id: string; originalText: string; originalLang: string; createdAt: string } | null;
  unreadCount: number;
  updatedAt: string;
}

interface MentionsEnvelope {
  conversation: {
    id: string;
    type: string;
    referenceId: string | null;
    updatedAt: string;
    other: OtherOrgInfo | null;
  };
  messages: ChatMsg[];
}

interface DirectoryEntry extends OtherOrgInfo {
  displayName: string;
  businessType: string | null;
}

interface Appointment {
  id: string;
  conversationId: string | null;
  orgAId: string;
  orgBId: string;
  title: string;
  scheduledAt: string;
  durationMins: number;
  meetingUrl: string;
  notes: string | null;
  status: string;
  createdById: string;
  amICreator: boolean;
  counterpart: string;
  otherOrg: OtherOrgInfo | null;
  createdAt: string;
  updatedAt: string;
}

const FLAGS: Record<string, string> = {
  CN: '🇨🇳',
  ET: '🇪🇹',
  US: '🇺🇸',
  GB: '🇬🇧',
  KE: '🇰🇪',
  AE: '🇦🇪',
  IN: '🇮🇳',
  JP: '🇯🇵',
  KR: '🇰🇷',
  DE: '🇩🇪',
  NL: '🇳🇱',
  CA: '🇨🇦',
  AU: '🇦🇺',
};

const flagFor = (code?: string | null) => FLAGS[(code ?? '').toUpperCase()] ?? '🌐';

const langLabel = (code?: string) =>
  (code || 'en').toUpperCase().slice(0, 2) === 'ZH'
    ? 'ZH'
    : (code || 'en').toUpperCase().slice(0, 2) === 'AM'
      ? 'AM'
      : (code || 'en').toUpperCase().slice(0, 2) === 'OM'
        ? 'OM'
        : 'EN';

const detectLang = (text: string): string => {
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
  if (/[\u1200-\u137f]/.test(text)) return 'am';
  return 'en';
};

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });

const formatRelative = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};

const isLive = (updatedAt?: string | null) =>
  !!updatedAt && Date.now() - new Date(updatedAt).getTime() < 90000;

const isImageUrl = (url: string) => /\.(png|jpe?g|gif|webp|svg|avif)(\?.*)?$/i.test(url);

export default function MessagesPage() {
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [otherOrg, setOtherOrg] = useState<OtherOrgInfo | null>(null);
  const [threadLive, setThreadLive] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [threadBusy, setThreadBusy] = useState(true);
  const [bodyBusy, setBodyBusy] = useState(false);

  const [input, setInput] = useState('');
  const [attachUrl, setAttachUrl] = useState('');
  const [attachOpen, setAttachOpen] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const [newOpen, setNewOpen] = useState(false);
  const [dirQuery, setDirQuery] = useState('');
  const [dirResults, setDirResults] = useState<DirectoryEntry[]>([]);
  const [dirBusy, setDirBusy] = useState(false);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [apptBusy, setApptBusy] = useState(false);
  const [apptPanelOpen, setApptPanelOpen] = useState(false);
  const [apptBusyId, setApptBusyId] = useState<string | null>(null);

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [schTitle, setSchTitle] = useState('');
  const [schWhen, setSchWhen] = useState('');
  const [schDur, setSchDur] = useState(30);
  const [schNotes, setSchNotes] = useState('');
  const [schBusy, setSchBusy] = useState(false);
  const [schError, setSchError] = useState<string | null>(null);

  const orgId = getActiveOrganizationId();
  const locale = useLocale();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const loadThreads = useCallback(async () => {
    const res = await apiFetch<ThreadItem[]>('/conversations');
    if (!res.success || !res.data) {
      setThreadError(res.error?.message ?? 'Could not load conversations.');
      setThreadBusy(false);
      return;
    }
    setThreadError(null);
    setThreads(res.data);
    setThreadBusy(false);
    setSelectedId((prev) => {
      if (prev && res.data!.some((t) => t.id === prev)) return prev;
      return res.data![0]?.id ?? null;
    });
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads, orgId]);

  const loadAppointments = useCallback(async () => {
    const res = await apiFetch<Appointment[]>('/appointments?scope=all');
    if (res.success && res.data) {
      setAppointments(res.data.sort((a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      ));
    }
  }, []);

  useEffect(() => {
    loadAppointments();
    const iv = setInterval(loadAppointments, 30000);
    return () => clearInterval(iv);
  }, [loadAppointments]);

  const setAppointmentStatus = async (id: string, status: string, buttonKey: string) => {
    setApptBusyId(buttonKey);
    const res = await apiFetch(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: { status },
    });
    if (!res.success) {
      setSendError(res.error?.message ?? 'Could not update the meeting.');
    }
    setApptBusyId(null);
    loadAppointments();
  };

  const counterpartFor = (a: Appointment) =>
    a.otherOrg ? `${flagFor(a.otherOrg.country)} ${a.otherOrg.tradingName ?? a.otherOrg.legalName}` : 'Trading partner';

  const scheduleVideo = async () => {
    const counterpartOrgId =
      otherOrg?.id ?? selectedThread?.otherOrg?.id ?? null;
    if (!counterpartOrgId) {
      setSchError('Select a conversation with the organization you want to meet.');
      return;
    }
    if (!schWhen) {
      setSchError('Please pick a date & time.');
      return;
    }
    setSchBusy(true);
    setSchError(null);
    const res = await apiFetch<Appointment>('/appointments', {
      method: 'POST',
      body: {
        counterpartOrgId,
        conversationId: selectedId ?? undefined,
        title: schTitle.trim() || 'Video Discussion',
        scheduledAt: new Date(schWhen).toISOString(),
        durationMins: schDur,
        notes: schNotes.trim() || undefined,
      },
    });
    if (res.success && res.data) {
      setScheduleOpen(false);
      setSchTitle('');
      setSchWhen('');
      setSchNotes('');
      setApptPanelOpen(true);
      loadAppointments();
    } else {
      setSchError(res.error?.message ?? 'Could not schedule the meeting.');
    }
    setSchBusy(false);
  };

  const loadMessages = useCallback(async (conversationId: string) => {
    setBodyBusy(true);
    const res = await apiFetch<MentionsEnvelope>(`/conversations/${conversationId}/messages`);
    if (res.success && res.data) {
      setMessages(res.data.messages);
      setOtherOrg(res.data.conversation.other);
      setThreadLive(isLive(res.data.conversation.updatedAt));
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
    setBodyBusy(false);
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      setOtherOrg(null);
      return;
    }
    loadMessages(selectedId);
    const iv = setInterval(() => {
      loadMessages(selectedId);
    }, 5000);
    const tv = setInterval(() => {
      loadThreads();
    }, 20000);
    return () => {
      clearInterval(iv);
      clearInterval(tv);
    };
  }, [selectedId, loadMessages, loadThreads]);

  useEffect(() => {
    if (!threads.length || !selectedId) return;
    const t = threads.find((x) => x.id === selectedId);
    if (t) setThreadLive(isLive(t.updatedAt));
  }, [threads, selectedId]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    const url = attachUrl.trim();
    if (!text && !url) return;
    setSending(true);
    setSendError(null);
    const res = await apiFetch<ChatMsg>(`/conversations/${selectedId}/messages`, {
      method: 'POST',
      body: {
        text,
        language: text ? detectLang(text) : 'en',
        attachmentUrl: url || undefined,
      },
    });
    if (res.success && res.data) {
      setMessages((prev) => [...prev, res.data!]);
      setInput('');
      setAttachUrl('');
      setAttachOpen(false);
      setThreadLive(true);
      if (scrollRef.current) {
        setTimeout(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }, 60);
      }
    } else {
      setSendError(res.error?.message ?? 'Could not send message.');
    }
    setSending(false);
  };

  const searchDirectory = async (q: string) => {
    setDirQuery(q);
    setDirBusy(true);
    const res = await apiFetch<DirectoryEntry[]>(
      `/organizations/org-directory?q=${encodeURIComponent(q)}&limit=12`,
    );
    if (res.success && res.data) setDirResults(res.data);
    setDirBusy(false);
  };

  const startConversation = async (targetOrgId: string, displayName: string) => {
    const res = await apiFetch<{ id: string }>('/conversations/initiate', {
      method: 'POST',
      body: { targetOrgId, title: `Trading with ${displayName}` },
    });
    if (res.success && res.data) {
      setNewOpen(false);
      setDirQuery('');
      setDirResults([]);
      await loadThreads();
      setSelectedId(res.data.id);
    }
  };

  const translationFor = (msg: ChatMsg): { lang: string; text: string } | null => {
    const translations = msg.translations ?? {};
    if (!Object.keys(translations).length) return null;
    
    const isOwn = msg.sender.orgId === orgId;
    const counterpartLang = otherOrg?.preferredLanguage ?? selectedThread?.otherOrg?.preferredLanguage ?? 'en';
    
    // For incoming messages: show translation in user's preferred language
    if (!isOwn) {
      if (translations[locale]) {
        return { lang: locale, text: translations[locale] };
      }
      // Fallback to first available translation
      const entries = Object.entries(translations);
      if (entries.length > 0) {
        return { lang: entries[0][0], text: entries[0][1] };
      }
    }
    
    // For own messages: show translation in counterpart's language
    if (isOwn) {
      if (translations[counterpartLang]) {
        return { lang: counterpartLang, text: translations[counterpartLang] };
      }
      // Fallback to first available translation that's not the original language
      const entries = Object.entries(translations).filter(([lang]) => lang !== msg.originalLang);
      if (entries.length > 0) {
        return { lang: entries[0][0], text: entries[0][1] };
      }
    }
    
    return null;
  };

  const selectedThread = threads.find((t) => t.id === selectedId) ?? null;

  return (
    <Shell>
      <div className="page-header mb-0">
        <h1 className="page-title">💬 Global Negotiation Room</h1>
        <p className="page-subtitle">
          Real-time multilingual trade messages with automatic translation
        </p>
      </div>

      {/* Video Appointments Panel */}
      <div className="flex items-center justify-between" style={{ margin: '14px 0 0 0', gap: 10, flexWrap: 'wrap' }}>
        <button
          className="btn btn-sm"
          style={{
            background: apptPanelOpen ? 'var(--color-primary)' : 'var(--color-primary-light)',
            color: apptPanelOpen ? '#fff' : 'var(--color-primary)',
            fontWeight: 700,
          }}
          onClick={() => setApptPanelOpen((v) => !v)}
        >
          📹 Video Meetings {appointments.filter((a) => a.status === 'PENDING').length > 0 ? `(${appointments.filter((a) => a.status === 'PENDING').length} pending)` : ''}
        </button>
      </div>

      {apptPanelOpen && (
        <div
          style={{
            marginTop: 10,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: 12,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 10,
          }}
        >
          {appointments.length === 0 ? (
            <div className="empty" style={{ padding: 12, gridColumn: '1 / -1' }}>
              No video meetings yet. Use “📹 Schedule Video” in any conversation to invite a trading
              partner to a live Jitsi room.
            </div>
          ) : (
            appointments.map((a) => {
              const when = new Date(a.scheduledAt);
              const past = when.getTime() < Date.now();
              const upcoming = when.getTime() >= Date.now();
              const accepted = a.status === 'ACCEPTED';
              const pending = a.status === 'PENDING';
              return (
                <div
                  key={a.id}
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 10,
                    padding: '10px 12px',
                    background:
                      a.status === 'DECLINED'
                        ? 'var(--color-danger-light)'
                        : a.status === 'ACCEPTED'
                          ? 'var(--color-success-light)'
                          : pending
                            ? '#fffbeb'
                            : 'var(--color-surface-2)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.title}
                    </span>
                    <span
                      className="badge"
                      style={{
                        fontSize: 9,
                        fontWeight: 800,
                        flexShrink: 0,
                        background:
                          a.status === 'ACCEPTED'
                            ? 'var(--color-success)'
                            : a.status === 'DECLINED' || a.status === 'CANCELLED'
                              ? 'var(--color-danger)'
                              : a.status === 'COMPLETED'
                                ? 'var(--color-primary)'
                                : '#d97706',
                        color: '#fff',
                      }}
                    >
                      {a.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {counterpartFor(a)} · {when.toLocaleDateString()} {when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {a.durationMins}m
                  </div>
                  {a.notes && (
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>{a.notes}</div>
                  )}
                  <div className="flex" style={{ gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                    {pending && !a.amICreator && (
                      <>
                        <button
                          className="btn btn-success btn-sm"
                          disabled={apptBusyId === `a-${a.id}`}
                          onClick={() => setAppointmentStatus(a.id, 'ACCEPTED', `a-${a.id}`)}
                        >
                          Accept
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          disabled={apptBusyId === `d-${a.id}`}
                          onClick={() => setAppointmentStatus(a.id, 'DECLINED', `d-${a.id}`)}
                        >
                          Decline
                        </button>
                      </>
                    )}
                    {(accepted || (upcoming && a.status !== 'DECLINED' && a.status !== 'CANCELLED')) && (
                      <a
                        href={a.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-primary btn-sm"
                        style={{ textDecoration: 'none' }}
                      >
                        ▶ Join Video
                      </a>
                    )}
                    {a.amICreator && (pending || accepted) && (
                      <button
                        className="btn btn-secondary btn-sm"
                        disabled={apptBusyId === `c-${a.id}`}
                        onClick={() => setAppointmentStatus(a.id, 'CANCELLED', `c-${a.id}`)}
                      >
                        Cancel
                      </button>
                    )}
                    {accepted && past && a.status === 'ACCEPTED' && (
                      <button
                        className="btn btn-secondary btn-sm"
                        disabled={apptBusyId === `done-${a.id}`}
                        onClick={() => setAppointmentStatus(a.id, 'COMPLETED', `done-${a.id}`)}
                      >
                        Mark Completed
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      <div
        className="flex gap-0 mt-4"
        style={{ height: 'calc(100vh - 260px)', minHeight: 480 }}
      >
        {/* Thread List */}
        <div
          className="flex-col"
          style={{
            width: 310,
            flexShrink: 0,
            overflowY: 'auto',
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-xl) 0 0 var(--radius-xl)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--color-border)',
              fontWeight: 700,
              fontSize: 13,
              color: 'var(--text-secondary)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>
              CONVERSATIONS ({threads.length})
            </span>
            {threadError && <span style={{ color: 'var(--color-danger)', fontSize: 11 }}>⚠</span>}
          </div>

          {threadBusy ? (
            <div className="empty" style={{ padding: 24 }}>Loading conversations…</div>
          ) : threads.length === 0 ? (
            <div className="empty" style={{ padding: 24 }}>
              No conversations yet — start one with a supplier or buyer.
            </div>
          ) : (
            threads.map((t) => {
              const unread = t.unreadCount ?? 0;
              const live = isLive(t.updatedAt);
              return (
                <div
                  key={t.id}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--color-bg-secondary)',
                    background: t.id === selectedId ? 'var(--color-primary-light)' : 'transparent',
                    borderLeft:
                      t.id === selectedId ? '3px solid var(--color-primary)' : '3px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    position: 'relative',
                  }}
                  onClick={() => setSelectedId(t.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                      <div style={{ position: 'relative' }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: 'var(--color-surface-2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 16,
                          }}
                        >
                          {flagFor(t.otherOrg?.country)}
                        </div>
                        {live && (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 0,
                              right: 0,
                              width: 10,
                              height: 10,
                              background: 'var(--color-success)',
                              border: '2px solid var(--color-surface)',
                              borderRadius: '50%',
                            }}
                          />
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: t.id === selectedId ? 'var(--color-primary)' : 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 140,
                        }}
                      >
                        {t.title ?? t.otherOrg?.legalName ?? 'Trading partner'}
                      </span>
                    </div>
                    {unread > 0 ? (
                      <span
                        style={{
                          background: 'var(--color-primary)',
                          color: '#fff',
                          borderRadius: 999,
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '2px 7px',
                          flexShrink: 0,
                        }}
                      >
                        {unread}
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: live ? 'var(--color-success)' : 'var(--text-tertiary)',
                          flexShrink: 0,
                        }}
                      >
                        {live ? '🟢 LIVE' : formatRelative(t.updatedAt)}
                      </span>
                    )}
                  </div>
                  {t.otherOrg && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span className="badge badge-ethiopia" style={{ fontSize: 10 }}>
                        {flagFor(t.otherOrg.country)} {t.otherOrg.tradingName ?? t.otherOrg.legalName}
                      </span>
                      <span className="badge badge-gray" style={{ fontSize: 9 }}>
                        {langLabel(t.otherOrg.preferredLanguage)}
                      </span>
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--text-tertiary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t.lastMessage?.originalText ?? 'No messages yet'}
                  </div>
                </div>
              );
            })
          )}

          <div style={{ padding: '12px 16px' }}>
            <button
              className="btn btn-secondary btn-sm"
              style={{ width: '100%' }}
              onClick={() => setNewOpen(true)}
            >
              + New Conversation
            </button>
          </div>
        </div>

        {/* Chat Panel */}
        <div
          className="flex-col"
          style={{
            flex: 1,
            background: 'var(--color-surface)',
            borderRadius: '0 var(--radius-xl) var(--radius-xl) 0',
            border: '1px solid var(--color-border)',
            borderLeft: 'none',
            minWidth: 0,
          }}
        >
          {!selectedThread ? (
            <div className="empty" style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
              Select a conversation or start a new one.
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedThread.title ?? 'Trading partner'}
                  </div>
                  <div className="flex gap-2 mt-1" style={{ flexWrap: 'wrap' }}>
                    {otherOrg ? (
                      <span className="badge badge-ethiopia" style={{ fontSize: 10 }}>
                        {flagFor(otherOrg.country)} {otherOrg.tradingName ?? otherOrg.legalName}
                      </span>
                    ) : selectedThread.otherOrg ? (
                      <span className="badge badge-ethiopia" style={{ fontSize: 10 }}>
                        {flagFor(selectedThread.otherOrg.country)}{' '}
                        {selectedThread.otherOrg.tradingName ?? selectedThread.otherOrg.legalName}
                      </span>
                    ) : null}
                    <span className="badge badge-gray" style={{ fontSize: 10 }}>
                      Speaks {langLabel(otherOrg?.preferredLanguage ?? selectedThread.otherOrg?.preferredLanguage ?? 'en')}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 items-center" style={{ flexShrink: 0 }}>
                  <button
                    className={`btn btn-sm ${showTranslation ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setShowTranslation((v) => !v)}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    🌐 Auto-Translate
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => {
                      setScheduleOpen(true);
                      setSchTitle('');
                      setSchWhen('');
                      setSchNotes('');
                      setSchError(null);
                    }}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    📹 Schedule Video
                  </button>
                  <span
                    className="badge"
                    style={{
                      fontSize: 10,
                      color: threadLive ? '#065f46' : 'var(--text-tertiary)',
                      background: threadLive ? 'var(--color-success-light)' : 'var(--color-surface-2)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {threadLive ? '🟢 Live' : '● Offline'}
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div
                ref={scrollRef}
                className="flex-col"
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '20px',
                  gap: 14,
                }}
              >
                {bodyBusy && messages.length === 0 ? (
                  <div className="empty">Loading messages…</div>
                ) : messages.length === 0 ? (
                  <div className="empty">
                    No messages yet — start the negotiation. Your message is automatically
                    translated to {langLabel(selectedThread.otherOrg?.preferredLanguage ?? 'en')} for your counterpart.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.sender.orgId === orgId;
                    const tr = showTranslation ? translationFor(msg) : null;
                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          flexDirection: isOwn ? 'row-reverse' : 'row',
                          alignItems: 'flex-end',
                          gap: 8,
                          maxWidth: '100%',
                        }}
                      >
                        <div
                          className="user-avatar"
                          style={{
                            width: 30,
                            height: 30,
                            fontSize: 11,
                            flexShrink: 0,
                            background: isOwn ? 'var(--color-primary-light)' : 'var(--color-surface-2)',
                          }}
                        >
                          {flagFor(msg.sender.country)}
                        </div>
                        <div
                          className="flex-col"
                          style={{ gap: 3, alignItems: isOwn ? 'flex-end' : 'flex-start', maxWidth: '78%', minWidth: 160 }}
                        >
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                            {isOwn ? 'You' : msg.sender.orgName} · {formatTime(msg.createdAt)}
                            {isOwn ? '' : ` · ${formatRelative(msg.createdAt)}`}
                          </div>
                          <div className={`chat-bubble ${isOwn ? 'own' : ''}`} style={{ maxWidth: '100%' }}>
                            {msg.attachmentUrl && isImageUrl(msg.attachmentUrl) && (
                              <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" style={{ display: 'block', marginBottom: 8 }}>
                                <img
                                  src={msg.attachmentUrl}
                                  alt="attachment"
                                  style={{ maxWidth: 240, maxHeight: 180, borderRadius: 8, objectFit: 'cover' }}
                                />
                              </a>
                            )}
                            {msg.attachmentUrl && !isImageUrl(msg.attachmentUrl) && (
                              <a
                                href={msg.attachmentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="badge badge-gray"
                                style={{ fontSize: 10, marginRight: 6, textDecoration: 'none' }}
                              >
                                📎 {msg.attachmentUrl.split('/').pop() || 'attachment'}
                              </a>
                            )}
                            <div>{msg.originalText}</div>
                            {tr && (
                              <div className="translation-hint">
                                🌐 {langLabel(tr.lang)}: {tr.text}
                              </div>
                            )}
                            {!isOwn && (
                              <span className="badge badge-gray" style={{ fontSize: 9, marginTop: 4 }}>
                                {langLabel(msg.originalLang)}
                              </span>
                            )}
                            {isOwn && msg.originalLang !== 'en' ? (
                              <span className="badge badge-gray" style={{ fontSize: 9, marginTop: 4 }}>
                                {langLabel(msg.originalLang)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Translation footer */}
              <div
                style={{
                  padding: '8px 20px',
                  background: 'var(--color-primary-light)',
                  borderTop: '1px solid var(--color-border)',
                  fontSize: 11,
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                🌐 Real-time translation between{' '}
                {['English', 'Chinese (Simplified)', 'Amharic', 'Afaan Oromo'].join(' ↔ ')} · Powered by
                ETHIO-BRIDGE Translation Engine
              </div>

              {/* Composer */}
              <form
                onSubmit={send}
                style={{
                  padding: '12px 20px',
                  borderTop: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {attachOpen && (
                  <div className="flex gap-2 items-center">
                    <input
                      className="input"
                      style={{ flex: 1, fontSize: 12 }}
                      value={attachUrl}
                      onChange={(e) => setAttachUrl(e.target.value)}
                      placeholder="Paste an attachment URL (image, PDF, catalog…)"
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setAttachOpen(false)}
                    >
                      Done
                    </button>
                  </div>
                )}
                <div className="flex gap-2 items-center">
                  <input
                    className="input"
                    style={{ flex: 1 }}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message — translated automatically for your counterpart..."
                  />
                  <button
                    type="button"
                    className={`btn btn-secondary btn-icon ${attachOpen || attachUrl ? 'btn-primary' : ''}`}
                    title="Attach a document or image (by URL)"
                    onClick={() => setAttachOpen((v) => !v)}
                  >
                    📎
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={sending || (!input.trim() && !attachUrl.trim())}>
                    {sending ? 'Sending…' : 'Send →'}
                  </button>
                </div>
                {sendError && <div className="error-text">{sendError}</div>}
              </form>
            </>
          )}
        </div>
      </div>

      {/* New Conversation Modal */}
      {newOpen && (
        <div className="modal-overlay" onClick={() => setNewOpen(false)}>
          <div
            className="card modal-body"
            onClick={(e) => e.stopPropagation()}
            style={{ width: 420, maxWidth: '94vw' }}
          >
            <h3 style={{ fontSize: 17, marginBottom: 4 }}>+ New Conversation</h3>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 14 }}>
              Search the verified organization directory to start negotiating with a trading
              partner.
            </p>
            <div className="flex gap-2">
              <input
                className="input"
                style={{ flex: 1 }}
                value={dirQuery}
                onChange={(e) => searchDirectory(e.target.value)}
                placeholder="Search by organization name…"
                autoFocus
              />
              {dirBusy && <span style={{ alignSelf: 'center' }}>…</span>}
            </div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
              {dirResults.length === 0 && !dirBusy ? (
                <div className="empty">Type to search organizations.</div>
              ) : (
                dirResults.map((o) => (
                  <div
                    key={o.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      padding: '10px 12px',
                      background: 'var(--color-surface-2)',
                      borderRadius: 10,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {flagFor(o.country)} {o.displayName}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                        {o.businessType ?? 'Company'} · Speaks {langLabel(o.preferredLanguage)}
                      </div>
                    </div>
                    <button
                      className="btn btn-sm btn-primary"
                      style={{ flexShrink: 0 }}
                      onClick={() => startConversation(o.id, o.displayName)}
                    >
                      Chat
                    </button>
                  </div>
                ))
              )}
            </div>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 14, width: '100%' }} onClick={() => setNewOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Schedule Video Meeting Modal */}
      {scheduleOpen && (
        <div className="modal-overlay" onClick={() => setScheduleOpen(false)}>
          <div
            className="card modal-body"
            onClick={(e) => e.stopPropagation()}
            style={{ width: 460, maxWidth: '94vw' }}
          >
            <h3 style={{ fontSize: 17, margin: 0 }}>📹 Schedule Video Meeting</h3>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '4px 0 14px 0' }}>
              With{' '}
              <b>
                {otherOrg?.tradingName ?? otherOrg?.legalName ??
                  selectedThread?.otherOrg?.tradingName ??
                  selectedThread?.otherOrg?.legalName ??
                  'your trading partner'}
              </b>{' '}
              — a live video room link (Jitsi) is created instantly and both sides can join when the
              meeting starts.
            </p>
            {schError && (
              <div style={{ padding: 10, backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>
                {schError}
              </div>
            )}
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Title (optional)
            </label>
            <input
              className="input"
              style={{ width: '100%', marginBottom: 12 }}
              placeholder="e.g. Contract & delivery discussion"
              value={schTitle}
              onChange={(e) => setSchTitle(e.target.value)}
            />
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Date &amp; Time
            </label>
            <input
              type="datetime-local"
              className="input"
              style={{ width: '100%', marginBottom: 12 }}
              value={schWhen}
              min={new Date(Date.now() + 3600 * 1000).toISOString().slice(0, 16)}
              onChange={(e) => setSchWhen(e.target.value)}
            />
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Duration</label>
            <select
              className="input"
              style={{ width: '100%', marginBottom: 12 }}
              value={schDur}
              onChange={(e) => setSchDur(Number(e.target.value))}
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Agenda (optional)
            </label>
            <textarea
              className="input"
              style={{ width: '100%', minHeight: 60, marginBottom: 16 }}
              placeholder="Samples, pricing, samples quality, delivery terms…"
              value={schNotes}
              onChange={(e) => setSchNotes(e.target.value)}
            />
            <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setScheduleOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={scheduleVideo} disabled={schBusy}>
                {schBusy ? 'Scheduling…' : 'Send Meeting Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}