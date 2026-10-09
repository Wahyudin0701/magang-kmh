import React from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Mail, User, Shield, KeyRound, Loader2 } from 'lucide-react';

export default function Profile({ session, isViewer, onBack }) {
  const [resetting, setResetting] = React.useState(false);
  const [resetMsg, setResetMsg] = React.useState('');

  const handlePasswordReset = async () => {
    setResetting(true);
    setResetMsg('');
    const { error } = await supabase.auth.resetPasswordForEmail(session.user.email, {
      redirectTo: window.location.origin,
    });
    
    if (error) {
      setResetMsg('Gagal mengirim link: ' + error.message);
    } else {
      setResetMsg('Link ganti password telah dikirim ke email Anda!');
    }
    setResetting(false);
  };

  return (
    <div className="wrapper" style={{ paddingTop: '3rem' }}>
      <button 
        className="btn-back-text" 
        onClick={onBack}
        style={{ 
          background: 'none', border: 'none', padding: '0 0 1.5rem 0', 
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem', 
          color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, 
          cursor: 'pointer'
        }}
      >
        <ArrowLeft size={16} /> Kembali ke Dashboard
      </button>

      <div style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--green-700), var(--green-500))',
          padding: '3rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          color: 'white'
        }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
            border: '3px solid rgba(255,255,255,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', marginBottom: '1rem'
          }}>
            <User size={40} color="white" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
            {session.user.email.split('@')[0]}
          </h2>
          <div style={{
            marginTop: '0.5rem', padding: '0.3rem 0.8rem', background: 'rgba(255,255,255,0.2)',
            borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em'
          }}>
            {isViewer ? 'PENGAWAS' : 'MAHASISWA MAGANG'}
          </div>
        </div>

        <div style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-heading)', marginBottom: '1.5rem', fontWeight: 700 }}>
            Informasi Akun
          </h3>
          
          <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '600px' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ padding: '0.8rem', background: 'var(--green-50)', color: 'var(--green-600)', borderRadius: '12px' }}>
                <Mail size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Alamat Email</div>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-body)', fontWeight: 500 }}>{session.user.email}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ padding: '0.8rem', background: 'var(--gold-50)', color: 'var(--gold-600)', borderRadius: '12px' }}>
                <Shield size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Hak Akses</div>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-body)', fontWeight: 500 }}>
                  {isViewer ? 'Bisa memantau logbook dari seluruh mahasiswa' : 'Bisa mengisi, mengedit, dan mengekspor logbook pribadi'}
                </div>
              </div>
            </div>

            <div style={{ height: '1px', background: 'var(--gray-200)', margin: '1rem 0' }}></div>

            <div>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-heading)', marginBottom: '1rem', fontWeight: 700 }}>
                Keamanan
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
                Untuk mengganti kata sandi (password), kami akan mengirimkan tautan reset ke email Anda. Silakan klik tautan tersebut untuk membuat kata sandi baru.
              </p>
              
              <button 
                onClick={handlePasswordReset}
                disabled={resetting}
                className="btn btn-outline"
                style={{ width: 'auto' }}
              >
                {resetting ? <Loader2 size={16} className="spin" /> : <KeyRound size={16} />}
                <span className="btn-text">{resetting ? 'Mengirim...' : 'Kirim Link Ganti Password'}</span>
              </button>

              {resetMsg && (
                <div style={{ 
                  marginTop: '1rem', padding: '0.8rem 1rem', borderRadius: '8px', fontSize: '0.85rem',
                  background: resetMsg.includes('Gagal') ? 'var(--danger-bg)' : 'var(--green-50)',
                  color: resetMsg.includes('Gagal') ? 'var(--danger-text)' : 'var(--green-700)',
                  border: `1px solid ${resetMsg.includes('Gagal') ? 'var(--danger-border)' : 'var(--green-200)'}`
                }}>
                  {resetMsg}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
