import React, { useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult, sendSignInLinkToEmail } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';

export function LoginScreen() {
  const [acceptedTerms, setAcceptedTerms] = useState(() => {
    try {
      return localStorage.getItem('copilotofinanc_lgpd_accepted') === 'true';
    } catch {
      return false;
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [emailLogin, setEmailLogin] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (auth) {
        getRedirectResult(auth).catch((err: any) => {
          console.error('Erro no redirecionamento:', err);
        });
      }
    } catch (err: any) {
      console.error('Erro ao inicializar auth:', err);
    }
  }, []);

  const handleAcceptTerms = () => {
    try {
      localStorage.setItem('copilotofinanc_lgpd_accepted', 'true');
      setAcceptedTerms(true);
    } catch (err: any) {
      setErrorMessage('Erro ao salvar termos no navegador.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      if (!auth) throw new Error('Firebase Auth não inicializado.');
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(auth, provider);
    } catch (err: any) {
      console.error('Erro no login com Google:', err);
      setErrorMessage(err?.message || 'Erro ao conectar com Google.');
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailLogin) return;
    try {
      setLoading(true);
      setErrorMessage(null);
      if (!auth) throw new Error('Firebase Auth não inicializado.');
      const actionCodeSettings = {
        url: window.location.href,
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, emailLogin, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', emailLogin);
      setEmailSent(true);
      setLoading(false);
    } catch (err: any) {
      console.error('Erro ao enviar e-mail:', err);
      setErrorMessage(err?.message || 'Erro ao enviar link por e-mail.');
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#0c1527', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: '#14223c', border: '1px solid #334155', borderRadius: '16px', maxWidth: '450px', width: '100%', padding: '24px', color: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        
        {errorMessage && (
          <div style={{ backgroundColor: '#7f1d1d', border: '1px solid #f87171', padding: '12px', borderRadius: '8px', color: '#fca5a5', fontSize: '13px', marginBottom: '16px' }}>
            ⚠️ {errorMessage}
          </div>
        )}

        {!acceptedTerms ? (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#fbbf24' }}>Política de Privacidade e Termos</h2>
            <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.5', maxHeight: '200px', overflowY: 'auto', marginBottom: '20px', paddingRight: '8px' }}>
              <p style={{ marginBottom: '10px' }}><strong>1. Coleta e Finalidade:</strong> Coletamos apenas seu e-mail e dados operacionais para exibir relatórios no painel.</p>
              <p style={{ marginBottom: '10px' }}><strong>2. Privacidade:</strong> Seus dados são confidenciais e nunca vendidos ou repassados a terceiros.</p>
              <p><strong>3. Direitos (LGPD):</strong> Você pode exportar ou excluir seus dados a qualquer momento pelo menu de perfil.</p>
            </div>
            <button
              type="button"
              onClick={handleAcceptTerms}
              style={{ width: '100%', backgroundColor: '#fbbf24', color: '#020617', fontWeight: 'bold', padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '14px' }}
            >
              ✓ Entendi e Concordo com os Termos
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '6px' }}>Copiloto Financeiro</h1>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px' }}>Acesse sua conta para continuar</p>

            {loading ? (
              <div style={{ padding: '24px 0', color: '#fbbf24', fontWeight: '500', fontSize: '14px' }}>Processando autenticação...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  style={{ width: '100%', backgroundColor: '#ffffff', color: '#0f172a', fontWeight: 'bold', padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '14px' }}
                >
                  Entrar com o Google
                </button>

                <div style={{ display: 'flex', alignItems: 'center', textAlign: 'center', color: '#64748b', fontSize: '12px', margin: '4px 0' }}>
                  <div style={{ flex: 1, borderBottom: '1px solid #334155' }}></div>
                  <span style={{ padding: '0 10px' }}>ou por e-mail</span>
                  <div style={{ flex: 1, borderBottom: '1px solid #334155' }}></div>
                </div>

                {emailSent ? (
                  <div style={{ backgroundColor: '#022c22', border: '1px solid #059669', padding: '14px', borderRadius: '10px', color: '#a7f3d0', fontSize: '12px' }}>
                    ✓ Link enviado! Verifique sua caixa de entrada.
                  </div>
                ) : (
                  <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input
                      type="email"
                      placeholder="Seu e-mail profissional"
                      value={emailLogin}
                      onChange={(e) => setEmailLogin(e.target.value)}
                      required
                      style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '10px 14px', color: '#ffffff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                    />
                    <button
                      type="submit"
                      style={{ width: '100%', backgroundColor: '#fbbf24', color: '#020617', fontWeight: 'bold', padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '14px' }}
                    >
                      Enviar Link de Acesso por E-mail
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}