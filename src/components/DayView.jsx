import React from 'react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { CheckCircle2, Link, ExternalLink, Eye } from 'lucide-react';
import { GDRIVE_LINKS } from '../gdriveLinks';

export default function DayView({ entry, dayIndex }) {
  const parsedDate = parseISO(entry.date);
  const dayName = format(parsedDate, 'EEEE', { locale: id });
  const fullDate = format(parsedDate, 'd MMMM yyyy', { locale: id });
  const currentGdriveLink = dayIndex >= 0 && dayIndex < GDRIVE_LINKS.length ? GDRIVE_LINKS[dayIndex] : null;
  const isFilled = entry.activity?.trim() !== '' || entry.description?.trim() !== '';

  return (
    <div className={`expanded-card ${isFilled ? 'filled' : ''}`}>
      <div className="expanded-header">
        <div className="expanded-date-info">
          <div className="day-name">{dayName}</div>
          <div className="full-date">{fullDate}</div>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.3rem 0.9rem', borderRadius: '999px',
          background: 'rgba(255,255,255,0.95)', color: '#d97706',
          fontSize: '0.75rem', fontWeight: 700, border: '1.5px solid rgba(255,255,255,0.6)',
          boxShadow: '0 1px 6px rgba(0,0,0,0.12)'
        }}>
          <Eye size={14} color="#d97706" /> Mode Monitoring
        </div>
      </div>

      <div className="log-form-inner">
        <div className="form-field">
          <label>Kegiatan Harian</label>
          <div className="form-textarea" style={{
            minHeight: '120px', padding: '1rem', borderRadius: '12px',
            fontStyle: entry.activity ? 'normal' : 'italic', whiteSpace: 'pre-wrap',
            lineHeight: 1.6, cursor: 'default'
          }}>
            {entry.activity || 'Belum ada catatan kegiatan.'}
          </div>
        </div>

        <div className="form-field">
          <label>Keterangan / Hasil</label>
          <div className="form-textarea" style={{
            minHeight: '120px', padding: '1rem', borderRadius: '12px',
            fontStyle: entry.description ? 'normal' : 'italic', whiteSpace: 'pre-wrap',
            lineHeight: 1.6, cursor: 'default'
          }}>
            {entry.description || 'Belum ada keterangan.'}
          </div>
        </div>

        {currentGdriveLink && (
          <div className="form-field form-col-full">
            <label><Link size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Folder Google Drive</label>
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
          </div>
        )}
      </div>
    </div>
  );
}
