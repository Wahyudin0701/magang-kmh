import React from 'react';
import { supabase } from '../lib/supabase';
import { getStudentName } from '../lib/studentConfig';
import { ArrowLeft, Mail, User, Shield, KeyRound, Loader2 } from 'lucide-react';

export default function Profile({ session, isViewer, onBack }) {
  const [resetting, setResetting] = React.useState(false);
  const [resetMsg, setResetMsg] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setResetting(true);
    setResetMsg('');
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) {
      setResetMsg('Gagal mengganti password: ' + error.message);
    } else {
      setResetMsg('Password berhasil diubah!');
      setNewPassword('');
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
            alignItems: 'center', justifyContent: 'center', marginBottom: '1rem',
            overflow: 'hidden'
          }}>
            {isViewer ? (
              <img src="/dosen.png" alt="Foto Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={40} color="white" />
            )}
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
            {isViewer ? 'Renaldi Yulvianda, M.Kom.' : getStudentName(session.user.email)}
          </h2>
          <div style={{
            marginTop: '0.5rem', padding: '0.3rem 0.8rem', background: 'rgba(255,255,255,0.2)',
            borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em'
          }}>
            {isViewer ? 'DOSEN PEMBIMBING' : 'MAHASISWA MAGANG'}
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
                Keamanan (Ganti Password)
              </h3>
              
              <form onSubmit={handlePasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Password Baru</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Minimal 6 karakter"
                    style={{
                      width: '100%', padding: '0.6rem 0.8rem',
                      border: '1.5px solid var(--gray-200)', borderRadius: 'var(--radius-sm)',
                      outline: 'none', fontFamily: 'inherit', fontSize: '0.85rem'
                    }}
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={resetting || newPassword.length < 6}
                  className="btn btn-green"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {resetting ? <Loader2 size={16} className="spin" /> : <KeyRound size={16} />}
                  <span className="btn-text">{resetting ? 'Menyimpan...' : 'Simpan Password Baru'}</span>
                </button>
              </form>

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
