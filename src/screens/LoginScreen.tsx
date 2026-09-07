import React, { useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult, sendSignInLinkToEmail } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';

export function LoginScreen() {
  const [acceptedTerms, setAcceptedTerms] = useState(() => {
    return localStorage.getItem('copilotofinanc_lgpd_accepted') === 'true';
  });
  const [loading, setLoading] = useState(false);
  const [emailLogin, setEmailLogin] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    getRedirectResult(auth).catch((err: any) => {
      console.error('Erro no retorno do login:', err);
    });
  }, []);

  const handleAcceptTerms = () => {
    localStorage.setItem('copilotofinanc_lgpd_accepted', 'true');
    setAcceptedTerms(true);
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(auth, provider);
    } catch (err: any) {
      console.error('Erro ao iniciar login com Google:', err);
      alert('Erro ao iniciar login: ' + (err?.message || err));
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailLogin) return;
    try {
      setLoading(true);
      const actionCodeSettings = {
        url: window.location.href,
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, emailLogin, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', emailLogin);
      setEmailSent(true);
    } catch (err: any) {
      console.error('Erro ao enviar e-mail:', err);
      alert('Erro ao enviar e-mail: ' + (err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  // Se não aceitou os termos, exibe o modal LGPD
  if (!acceptedTerms) {
    return (
      <div style={{ backgroundColor: '#0c1527', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: 'sans-serif' }}>
        <div style={{ backgroundColor: '#14223c', border: '1px solid #334155', borderRadius: '16px', maxWidth: '500px', width: '100%', padding: '24px', color: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#fbbf24' }}>Política de Privacidade e Termos</h2>
          <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.5', maxHeight: '240px', overflowY: 'auto', marginBottom: '24px', paddingRight: '8px' }}>
            <p style={{ marginBottom: '12px' }}><strong>1. Coleta e Finalidade dos Dados:</strong> Coletamos apenas seu e-mail de cadastro e dados operacionais do seu caixa com a finalidade exclusiva de exibir relatórios e indicadores no seu painel.</p>
            <p style={{ marginBottom: '12px' }}><strong>2. Compartilhamento de Informações:</strong> Seus dados são confidenciais. Não vendemos, não repassamos e não compartilhamos suas informações financeiras com nenhuma outra empresa ou terceiro.</p>
            <p><strong>3. Controle e Direitos (LGPD):</strong> Você pode realizar a exportação integral dos seu dados ou a exclusão permanente e irreversível da sua conta no menu de Perfil.</p>
          </div>
          <button
            type="button"
            onClick={handleAcceptTerms}
            style={{ width: '100%', backgroundColor: '#fbbf24', color: '#020617', fontWeight: 'bold', padding: '12px 16px', borderRadius: '12px', border: 'none', cursor: 'pointer' }}
          >
            ✓ Entendi e Concordo com os Termos
          </button>
        </div>
      </div>
    );
  }

  // Tela de Login com Google e E-mail
  return (
    <div style={{ backgroundColor: '#0c1527', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: '#14223c', border: '1px solid #334155', borderRadius: '16px', maxWidth: '400px', width: '100%', padding: '32px', color: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Copiloto Financeiro</h1>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>Acesse sua conta para continuar</p>

        {loading ? (
          <div style={{ padding: '32px 0', color: '#fbbf24', fontWeight: '500' }}>Redirecionando para autenticação...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <button
              type="button"
              onClick={handleGoogleLogin}
              style={{ width: '100%', backgroundColor: '#ffffff', color: '#0f172a', fontWeight: 'bold', padding: '12px 16px', borderRadius: '12px', border: 'none', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
            >
              Entrar com o Google
            </button>

            <div style={{ display: 'flex', alignItems: 'center', textAlign: 'center', color: '#64748b', fontSize: '12px', margin: '8px 0' }}>
              <div style={{ flex: 1, borderBottom: '1px solid #334155' }}></div>
              <span style={{ padding: '0 12px' }}>ou por e-mail</span>
              <div style={{ flex: 1, borderBottom: '1px solid #334155' }}></div>
            </div>

            {emailSent ? (
              <div style={{ backgroundColor: '#022c22', border: '1px solid #059669', padding: '16px', borderRadius: '12px', color: '#a7f3d0', fontSize: '12px' }}>
                ✓ Link de acesso enviado para o seu e-mail! Verifique sua caixa de entrada.
              </div>
            ) : (
              <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="email"
                  placeholder="Seu e-mail profissional"
                  value={emailLogin}
                  onChange={(e) => setEmailLogin(e.target.value)}
                  required
                  style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '10px 16px', color: '#ffffff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
                <button
                  type="submit"
                  style={{ width: '100%', backgroundColor: '#fbbf24', color: '#020617', fontWeight: 'bold', padding: '10px 16px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '14px' }}
                >
                  Enviar Link de Acesso por E-mail
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}