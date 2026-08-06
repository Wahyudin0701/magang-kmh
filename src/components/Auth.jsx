import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Mail, Loader2 } from 'lucide-react';

export default function Auth({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      onLogin(data.session);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div className="bg-photo"></div>
      
      <div style={{
        background: 'var(--bg-card)',
        padding: '2.5rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        width: '100%',
        maxWidth: '400px',
        position: 'relative',
        zIndex: 1,
        border: '1px solid var(--border-light)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="kmh-mark" style={{ margin: '0 auto 1rem' }}>
            <img src="/logo.png" alt="Logo KMH" />
          </div>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--green-900)', marginBottom: '0.5rem' }}>Logbook Digital</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>PT Kerinci Merangin Hidro</p>
        </div>

        {error && (
          <div style={{
            padding: '0.8rem',
            background: 'var(--danger-bg)',
            color: 'var(--danger-text)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            marginBottom: '1.5rem',
            border: '1px solid var(--danger-border)'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="email@example.com"
                style={{
                  width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem',
                  border: '1.5px solid var(--gray-200)', borderRadius: 'var(--radius-sm)',
                  outline: 'none', fontFamily: 'inherit'
                }}
              />
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
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
            disabled={loading}
            className="btn btn-green" 
            style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '0.75rem' }}
          >
            {loading ? <Loader2 size={18} className="spin" /> : 'Masuk ke Logbook'}
          </button>
        </form>
      </div>
    </div>
  );
}
