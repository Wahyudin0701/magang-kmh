import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Loader2, CheckCircle2 } from 'lucide-react';

export default function ResetPassword({ onComplete }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      // Wait a moment then go to dashboard
      setTimeout(() => {
        onComplete();
      }, 2000);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="bg-photo"></div>
        <div style={{ background: 'var(--bg-card)', padding: '3rem 2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: '400px', position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <CheckCircle2 size={48} color="var(--green-500)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-heading)', marginBottom: '0.5rem' }}>Password Berhasil Diubah!</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Mengarahkan Anda ke halaman utama...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="bg-photo"></div>
      
      <div style={{
        background: 'var(--bg-card)', padding: '2.5rem', borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: '400px', position: 'relative',
        zIndex: 1, border: '1px solid var(--border-light)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--green-900)', marginBottom: '0.5rem' }}>Buat Password Baru</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Silakan ketikkan password baru Anda di bawah ini.</p>
        </div>

        {error && (
          <div style={{ padding: '0.8rem', background: 'var(--danger-bg)', color: 'var(--danger-text)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', marginBottom: '1.5rem', border: '1px solid var(--danger-border)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Password Baru</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Minimal 6 karakter"
                style={{
                  width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem',
                  border: '1.5px solid var(--gray-200)', borderRadius: 'var(--radius-sm)',
                  outline: 'none', fontFamily: 'inherit'
                }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || password.length < 6}
            className="btn btn-green" 
            style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '0.75rem' }}
          >
            {loading ? <Loader2 size={18} className="spin" /> : 'Simpan Password Baru'}
          </button>
        </form>
      </div>
    </div>
  );
}
