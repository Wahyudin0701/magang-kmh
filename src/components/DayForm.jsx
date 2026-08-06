import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { CheckCircle2, Save, Loader2, Link, ExternalLink } from 'lucide-react';
import { GDRIVE_LINKS } from '../gdriveLinks';

export default function DayForm({ entry, dayIndex, onUpdate, session }) {
  const [activity, setActivity] = useState(entry.activity || '');
  const [description, setDescription] = useState(entry.description || '');
  const [saving, setSaving] = useState(false);

  const parsedDate = parseISO(entry.date);
  const dayName = format(parsedDate, 'EEEE', { locale: id });
  const fullDate = format(parsedDate, 'd MMMM yyyy', { locale: id });

  const currentGdriveLink = dayIndex >= 0 && dayIndex < GDRIVE_LINKS.length ? GDRIVE_LINKS[dayIndex] : null;

  // Auto-save logic (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activity !== entry.activity || description !== entry.description) {
        saveData();
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [activity, description]);

  const saveData = async () => {
    setSaving(true);
    const updates = {
      activity,
      description,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('logbook_entries')
      .update(updates)
      .eq('id', entry.id)
      .select()
      .single();

    if (!error && data) {
      onUpdate(data);
    }
    setSaving(false);
  };

  const isFilled = entry.activity?.trim() !== '' || entry.description?.trim() !== '';

  return (
    <div className={`expanded-card ${isFilled ? 'filled' : ''}`}>
      <div className="expanded-header">
        <div className="expanded-date-info">
          <div className="day-name">{dayName}</div>
          <div className="full-date">{fullDate}</div>
        </div>
        <div className="auto-save" style={{ opacity: saving ? 1 : 0.6 }}>
          {saving ? <><Loader2 className="spin" size={16} /> Menyimpan...</> : <><CheckCircle2 size={16} /> Tersimpan</>}
        </div>
      </div>
      
      <div className="log-form-inner">
        <div className="form-field">
          <label>Kegiatan Harian</label>
          <textarea 
            className="form-textarea" 
            placeholder="Apa saja yang kamu lakukan hari ini?"
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label>Keterangan / Hasil</label>
          <textarea 
            className="form-textarea" 
            placeholder="Catatan tambahan atau output kegiatan..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="form-field form-col-full">
          <label><Link size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}/> Folder Google Drive</label>
          <div>
            {currentGdriveLink ? (
              <a 
                href={currentGdriveLink} 
                target="_blank" 
                rel="noreferrer"
                className="form-textarea"
                style={{ width: '100%', height: '40px', minHeight: '40px', padding: '0 16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', textDecoration: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <ExternalLink size={16} />
                Buka Folder Day {dayIndex + 1}
              </a>
            ) : (
              <span style={{ fontSize: '0.9rem', color: 'var(--text-light)', fontStyle: 'italic' }}>Tidak ada link Google Drive untuk hari ini.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
