import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { initializeLogbook } from '../lib/logbookInit';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import DayForm from './DayForm';
import DayView from './DayView';
import { ArrowLeft, Loader2, Calendar, CheckCircle2, Clock, Eye } from 'lucide-react';
import '../calendar.css';

export default function CalendarGrid({ session, isViewer }) {
  const [entries, setEntries] = useState([]);
  const [allEntries, setAllEntries] = useState([]);
  const [userIds, setUserIds] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState(null);

  useEffect(() => {
    fetchEntries();
  }, [session]);

  const fetchEntries = async () => {
    setLoading(true);

    if (isViewer) {
      // Viewer: fetch ALL logbook entries (from all students)
      const { data, error } = await supabase
        .from('logbook_entries')
        .select('*')
        .order('date', { ascending: true });
      if (!error && data) {
        setAllEntries(data);
        const uniqueUsers = [...new Set(data.map(e => e.user_id))];
        setUserIds(uniqueUsers);
        if (uniqueUsers.length > 0) {
          setSelectedUserId(uniqueUsers[0]);
          setEntries(data.filter(e => e.user_id === uniqueUsers[0]));
        } else {
          setEntries([]);
        }
      }
    } else {
      // Student: auto initialize then fetch own entries
      await initializeLogbook(session.user.id);
      const { data, error } = await supabase
        .from('logbook_entries')
        .select('*')
        .eq('user_id', session.user.id)
        .order('date', { ascending: true });
      if (!error && data) setEntries(data);
    }
    setLoading(false);
  };

  const handleUserChange = (e) => {
    const uid = e.target.value;
    setSelectedUserId(uid);
    setEntries(allEntries.filter(entry => entry.user_id === uid));
    setSelectedEntry(null);
  };

  const handleUpdate = (updatedEntry) => {
    setEntries(entries.map(e => e.id === updatedEntry.id ? updatedEntry : e));
    setSelectedEntry(updatedEntry);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <Loader2 className="spin" size={32} color="var(--green-500)" />
      </div>
    );
  }

  // Group entries by month
  const groupedByMonth = entries.reduce((acc, entry) => {
    const d = parseISO(entry.date);
    const key = format(d, 'MMMM yyyy', { locale: id });
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  if (selectedEntry) {
    const dayIndex = entries.findIndex(e => e.id === selectedEntry.id);
    return (
      <div className="expanded-view">
        <button 
          className="btn-back-text" 
          onClick={() => setSelectedEntry(null)}
          style={{ 
            background: 'none', border: 'none', padding: '0 0 1rem 0', 
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem', 
            color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, 
            cursor: 'pointer', textDecoration: 'none'
          }}
        >
          <ArrowLeft size={16} /> Kembali ke Kalender
        </button>
        {isViewer
          ? <DayView entry={selectedEntry} dayIndex={dayIndex} />
          : <DayForm entry={selectedEntry} dayIndex={dayIndex} onUpdate={handleUpdate} session={session} />
        }
      </div>
    );
  }

  const filledCount = entries.filter(e => !e.is_holiday && (e.activity?.trim() !== '' || e.description?.trim() !== '')).length;
  const totalDays = 80;
  const progressPct = Math.round((filledCount / totalDays) * 100);
  const remainingDays = totalDays - filledCount;
  
  // Calculate dash offset for SVG circle. Full circle is ~326.7.
  const dashOffset = 326.7 - (326.7 * (progressPct / 100));

  return (
    <>
      {/* Viewer Mode Banner */}
      {isViewer && (
        <div className="viewer-banner">
          <div className="viewer-banner-left">
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'rgba(245,158,11,0.2)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Eye size={18} color="#92400e" />
            </div>
            <div>
              <div style={{ color: '#92400e', fontSize: '0.85rem', fontWeight: 700, marginBottom: '2px' }}>
                Mode Monitoring Dosen Pembimbing
              </div>
              <div style={{ color: '#b45309', fontSize: '0.78rem', fontWeight: 500 }}>
                Anda sedang memantau logbook tim magang KMH - PT Kerinci Merangin Hidro
              </div>
            </div>
          </div>
          


          <div className="viewer-profile">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
               <div style={{ color: '#92400e', fontSize: '0.75rem', fontWeight: 700, lineHeight: 1.2 }}>
                 Renaldi Yulvianda, M.Kom.
               </div>
               <div style={{ color: '#b45309', fontSize: '0.65rem', fontWeight: 600 }}>
                 Dosen Pembimbing
               </div>
            </div>
            <img 
              src="/dosen.png" 
              alt="Foto Dosen" 
              style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(245,158,11,0.5)' }} 
            />
          </div>
        </div>
      )}
      <div className="hero">
        <div>
          <div className="hero-eyebrow">
            <div className="hero-eyebrow-dot"></div>
            Sistem Digital
          </div>
          <h1 className="hero-title">
            Logbook Digital<br />
            <span>PT Kerinci Merangin Hidro</span>
          </h1>
          <div className="hero-meta">
            <div className="hero-meta-item">Senin - Sabtu</div>
            <div className="hero-sep"></div>
            <div className="hero-meta-item">PT Kerinci Merangin Hidro</div>
            <div className="hero-sep"></div>
            <div className="hero-meta-item">3 Ags - 3 Nov 2026</div>
          </div>
        </div>
        <div className="ring-wrap">
          <div className="ring-svg-wrap">
            <svg viewBox="0 0 120 120">
              <defs>
                <linearGradient id="rGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--green-400)" />
                  <stop offset="100%" stopColor="var(--gold-400)" />
                </linearGradient>
              </defs>
              <circle className="ring-track" cx="60" cy="60" r="52" />
              <circle className="ring-prog" cx="60" cy="60" r="52" style={{ strokeDashoffset: dashOffset }} />
            </svg>
            <div className="ring-center">
              <div className="ring-pct">{progressPct}%</div>
              <div className="ring-sub">PROGRESS</div>
            </div>
          </div>
          <div className="ring-info">
            <strong>{filledCount}</strong> dari <strong>{totalDays}</strong> hari terisi
          </div>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon"><Clock size={18} /></div>
          <div className="stat-value">{remainingDays}</div>
          <div className="stat-label">HARI TERSISA</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><CheckCircle2 size={18} /></div>
          <div className="stat-value">{filledCount}</div>
          <div className="stat-label">HARI TERISI</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Calendar size={18} /></div>
          <div className="stat-value">{totalDays}</div>
          <div className="stat-label">TOTAL HARI KERJA</div>
        </div>
      </div>

      <div className="calendar-wrapper">
      {Object.keys(groupedByMonth).map(monthName => (
        <div key={monthName} className="calendar-month">
          <div className="calendar-month-title">
            <div className="month-dot"></div>
            {monthName}
          </div>
          
          <div className="calendar-grid">
            {groupedByMonth[monthName].map(entry => {
              const d = parseISO(entry.date);
              const dayStr = format(d, 'dd');
              const dayShort = format(d, 'EEEE', { locale: id }).substring(0, 3); // Sen, Sel...
              const isFilled = entry.activity?.trim() !== '' || entry.description?.trim() !== '' || entry.photos?.length > 0;
              
              const dayIndex = entries.findIndex(e => e.id === entry.id);
              
              let cardClass = 'calendar-card';
              if (entry.is_holiday) cardClass += ' holiday';
              else if (isFilled) cardClass += ' filled';

              return (
                <div 
                  key={entry.id} 
                  className={cardClass}
                  onClick={() => {
                    if (isViewer) {
                      // Viewer can click to read any day
                      setSelectedEntry(entry);
                    } else if (!entry.is_holiday) {
                      setSelectedEntry(entry);
                    }
                  }}
                  style={isViewer ? { cursor: 'pointer' } : {}}
                >
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                    DAY
                  </div>
                  <div className="calendar-card-date" style={{ fontSize: '2.4rem', marginBottom: '4px' }}>
                    {dayIndex + 1}
                  </div>
                  <div className="calendar-card-subtitle">
                    {format(d, 'EEEE, d MMM', { locale: id })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      </div>
    </>
  );
}
