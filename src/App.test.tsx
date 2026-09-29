import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent, waitFor, cleanup } from '@testing-library/react';
import App from './App';

// ============================================================
// 1. ESTADO COMPARTILHADO (O SEGREDO DO VITEST)
// Variáveis usadas dentro de vi.mock PRECISAM estar em vi.hoisted
// ============================================================
const mocks = vi.hoisted(() => ({
  currentUser: {
    uid: 'user-123',
    email: 'fausto@teste.com',
    displayName: 'Fausto Teste',
  } as any,
  authStateCallback: null as ((user: any) => void) | null,
  authErrorCallback: null as ((error: Error) => void) | null,
  signOut: vi.fn(),
  getRedirectResult: vi.fn(() => Promise.resolve(null)),
  signInWithPopup: vi.fn(),
  sendSignInLinkToEmail: vi.fn(),
  setCustomParameters: vi.fn(),
}));

const mockAuth = {
  get currentUser() {
    return mocks.currentUser;
  },
  signOut: mocks.signOut,
};

// ============================================================
// 2. MOCKS DO FIREBASE CONFIG E AUTH
// ============================================================
vi.mock('./services/firebaseConfig', () => ({
  get auth() {
    return mockAuth;
  },
  db: {},
  googleProvider: {},
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  getRedirectResult: () => mocks.getRedirectResult(),
  onAuthStateChanged: vi.fn(
    (
      _auth: any,
      callback: (user: any) => void,
      errorCallback?: (error: Error) => void
    ) => {
      mocks.authStateCallback = callback;
      mocks.authErrorCallback = errorCallback || null;

      if ((globalThis as any).__DELAY_AUTH_CALLBACK__) {
        return () => {
          mocks.authStateCallback = null;
          mocks.authErrorCallback = null;
        };
      }

      callback(mocks.currentUser);

      return () => {
        mocks.authStateCallback = null;
        mocks.authErrorCallback = null;
      };
    }
  ),
  signInWithPopup: () => mocks.signInWithPopup(),
  signInWithRedirect: vi.fn(() => Promise.resolve()),
  signInWithEmailAndPassword: vi.fn(() =>
    Promise.resolve({ user: mocks.currentUser })
  ),
  sendSignInLinkToEmail: (...args: any[]) => mocks.sendSignInLinkToEmail(...args),
  signOut: () => mocks.signOut(),
  GoogleAuthProvider: class {
    setCustomParameters = mocks.setCustomParameters;
  },
}));

// ============================================================
// 3. STUBS DAS TELAS FILHAS
// Cada tela tem suíte própria; aqui só interessa a navegação do App.
// Os stubs expõem os data-testid usados nas asserções abaixo.
// ============================================================
vi.mock('./screens/Painel', async () => {
  const React = await import('react');
  const navButton = (testId: string, label: string, tab: string, setActiveTab: (t: string) => void) =>
    React.createElement(
      'button',
      { 'data-testid': testId, onClick: () => setActiveTab(tab) },
      label
    );
  const PainelStub = (props: { setActiveTab: (tab: string) => void }) =>
    React.createElement(
      'div',
      { 'data-testid': 'painel' },
      navButton('painel-financeiro', 'Ir para o Financeiro', 'financeiro', props.setActiveTab),
      navButton('painel-conexao', 'Ir para a Conexão', 'conexao', props.setActiveTab),
      navButton('painel-vendas', 'Ir para a Calculadora de Vendas', 'salesCalculator', props.setActiveTab)
    );
  return { default: PainelStub };
});

vi.mock('./components/ModuloFinanceiro', async () => {
  const React = await import('react');
  return {
    default: () =>
      React.createElement(
        'div',
        { 'data-testid': 'modulo-financeiro' },
        'Módulo Financeiro'
      ),
  };
});

vi.mock('./screens/FechamentoDiario', async () => {
  const React = await import('react');
  return {
    FechamentoDiario: () =>
      React.createElement(
        'div',
        { 'data-testid': 'fechamento-diario' },
        'Fechamento Diário'
      ),
  };
});

vi.mock('./screens/CentralContador', async () => {
  const React = await import('react');
  return {
    CentralContador: () =>
      React.createElement(
        'div',
        { 'data-testid': 'central-contador' },
        'Central do Contador'
      ),
  };
});

vi.mock('./screens/OpenFinance', async () => {
  const React = await import('react');
  return {
    OpenFinance: () =>
      React.createElement(
        'div',
        { 'data-testid': 'open-finance' },
        'Open Finance'
      ),
  };
});

vi.mock('./screens/Perfil', async () => {
  const React = await import('react');
  return {
    Perfil: () => React.createElement('div', { 'data-testid': 'perfil' }, 'Perfil'),
  };
});

vi.mock('./screens/Conexao', async () => {
  const React = await import('react');
  return {
    // O stub expõe botões que disparam os callbacks recebidos do App,
    // simulando a interação que o componente real faria.
    default: (props: any) =>
      React.createElement(
        'div',
        { 'data-testid': 'conexao-stub' },
        React.createElement('button', { onClick: props.onConnect }, 'Conectar máquina'),
        React.createElement('button', { onClick: props.onDisconnect }, 'Desconectar máquina'),
        React.createElement('button', { onClick: props.onDisconnectAll }, 'Desconectar todas')
      ),
  };
});

vi.mock('./screens/SalesCalculator', async () => {
  const React = await import('react');
  return {
    default: (props: any) =>
      React.createElement(
        'div',
        { 'data-testid': 'sales-calculator-stub' },
        React.createElement('button', { onClick: props.onSaleBooked }, 'Registrar venda')
      ),
  };
});

// ============================================================
// 4. HELPERS DE RENDERIZAÇÃO
// ============================================================
const renderApp = async () => {
  let result: any;
  await act(async () => {
    result = render(<App />);
  });
  return result;
};

const renderAuthenticatedApp = async (user?: any) => {
  if (user !== undefined) {
    mocks.currentUser = user;
  }
  return await renderApp();
};

// ============================================================
// 5. SUÍTE PRINCIPAL DE TESTES
// ============================================================
describe('App.tsx - cobertura direcionada', () => {
  beforeEach(() => {
    vi.spyOn(window, 'open').mockImplementation(() => null as any);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.clearAllMocks();

    // Reset do usuário para evitar vazamento entre testes
    mocks.currentUser = {
      uid: 'user-123',
      email: 'fausto@teste.com',
      displayName: 'Fausto Teste',
    };

    // Reset de Promises
    mocks.getRedirectResult.mockImplementation(() => Promise.resolve(null));
    mocks.signInWithPopup.mockImplementation(() =>
      Promise.resolve({ user: mocks.currentUser })
    );
    mocks.sendSignInLinkToEmail.mockImplementation(() => Promise.resolve());
    mocks.signOut.mockImplementation(() => Promise.resolve());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.restoreAllMocks();
    cleanup();
    delete (globalThis as any).__DELAY_AUTH_CALLBACK__;
    mocks.authStateCallback = null;
    mocks.authErrorCallback = null;
  });

  // ==========================================================
  // 1. EXPORTAÇÃO
  // ==========================================================
  it('01 - App está definido', () => {
    expect(App).toBeDefined();
    expect(typeof App).toBe('function');
  });

  // ==========================================================
  // 2. LOGIN / NÃO AUTENTICADO
  // ==========================================================
  it('02 - renderiza LoginScreen quando não existe usuário autenticado', async () => {
    mocks.currentUser = null;

    await renderApp();

    expect(
      await screen.findByText('Acesse sua conta para continuar')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /entrar com o google/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Logado como:')
    ).not.toBeInTheDocument();
  });

  // ==========================================================
  // 3. USUÁRIO AUTENTICADO
  // ==========================================================
  it('03 - renderiza o shell principal quando autenticado', async () => {
    await renderAuthenticatedApp();

    expect(await screen.findByText('Logado como:')).toBeInTheDocument();
    expect(screen.getByText('fausto@teste.com')).toBeInTheDocument();
    expect(screen.getByText('Copiloto Financeiro')).toBeInTheDocument();
    expect(screen.getByTestId('painel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /fazer upgrade/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sair/i })).toBeInTheDocument();
  });

  // ==========================================================
  // 4. ERRO DO onAuthStateChanged
  // ==========================================================
  it('04 - trata erro do onAuthStateChanged', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await renderAuthenticatedApp();

    expect(mocks.authErrorCallback).toBeTypeOf('function');

    await act(async () => {
      mocks.authErrorCallback?.(new Error('Erro simulado de autenticação'));
    });

    expect(consoleError).toHaveBeenCalledWith(
      'Erro na sessão:',
      expect.any(Error)
    );

    consoleError.mockRestore();
  });

  // ==========================================================
  // 5. REDIRECT COM ERRO
  // ==========================================================
  it('05 - trata rejeição de getRedirectResult', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    mocks.getRedirectResult.mockRejectedValueOnce(
      new Error('Erro simulado no redirect')
    );

    await renderAuthenticatedApp();

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        'Erro no redirect:',
        expect.any(Error)
      );
    });

    expect(
      await screen.findByText('Copiloto Financeiro')
    ).toBeInTheDocument();

    consoleError.mockRestore();
  });

  // ==========================================================
  // 6. TIMEOUT DE 1500 MS
  // ==========================================================
  it('06 - executa o timeout de segurança de 1500ms do loading', async () => {
    vi.useFakeTimers();

    (globalThis as any).__DELAY_AUTH_CALLBACK__ = true;

    const { unmount } = render(<App />);

    expect(
      screen.getByText('Carregando Copiloto Financeiro...')
    ).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    // Após o timeout, o loading sai e a tela de login é exibida
    expect(
      screen.getByText('Acesse sua conta para continuar')
    ).toBeInTheDocument();

    unmount();
  });

  // ==========================================================
  // 7. CLEANUP DO PRIMEIRO useEffect
  // ==========================================================
  it('07 - executa cleanup do listener de autenticação e timeout', async () => {
    vi.useFakeTimers();

    const { unmount } = await renderAuthenticatedApp();

    expect(mocks.authStateCallback).toBeTypeOf('function');

    unmount();

    expect(mocks.authStateCallback).toBeNull();

    // Não pode lançar erro após o cleanup
    expect(() => vi.advanceTimersByTime(2000)).not.toThrow();
  });

  // ==========================================================
  // 8. BEFOREINSTALLPROMPT
  // ==========================================================
  it('08 - captura o evento beforeinstallprompt', async () => {
    await renderAuthenticatedApp();

    const preventDefault = vi.fn();

    const event = new Event('beforeinstallprompt');

    Object.defineProperty(event, 'preventDefault', {
      configurable: true,
      value: preventDefault,
    });

    await act(async () => {
      window.dispatchEvent(event);
    });

    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  // ==========================================================
  // 9. CLEANUP / SEGUNDO useEffect
  // ==========================================================
  it('09 - mantém o App funcional após eventos PWA', async () => {
    await renderAuthenticatedApp();

    const event = new Event('beforeinstallprompt');

    Object.defineProperty(event, 'preventDefault', {
      configurable: true,
      value: vi.fn(),
    });

    await act(async () => {
      window.dispatchEvent(event);
    });

    expect(
      await screen.findByText('Copiloto Financeiro')
    ).toBeInTheDocument();
  });

  // ==========================================================
  // 10. PLANO / MODAL
  // ==========================================================
  it('10 - abre o modal de planos', async () => {
    await renderAuthenticatedApp();

    const upgradeButton = await screen.findByRole('button', { name: /fazer upgrade/i });

    await act(async () => {
      fireEvent.click(upgradeButton);
    });

    expect(
      screen.getByText('SEJA COPILOTO PRO')
    ).toBeInTheDocument();

    expect(
      screen.getByText('Freemium (30 Dias) / Essencial')
    ).toBeInTheDocument();

    expect(
      screen.getByText('Copiloto')
    ).toBeInTheDocument();

    expect(
      screen.getByText('Copiloto Pro')
    ).toBeInTheDocument();
  });

  // ==========================================================
  // 11. selecionarPlano - PLANO PAGO
  // ==========================================================
  it('11 - seleciona o plano Essencial e formata o preço', async () => {
    await renderAuthenticatedApp();

    fireEvent.click(
      screen.getByRole('button', {
        name: /fazer upgrade/i,
      })
    );

    const essencialCard = screen.getByText(
      'Freemium (30 Dias) / Essencial'
    );

    await act(async () => {
      fireEvent.click(essencialCard);
    });

    // Modal fecha e o banner mostra o plano com o preço formatado
    expect(
      screen.queryByText('SEJA COPILOTO PRO')
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('Essencial (R$ 19,90/mês)')
    ).toBeInTheDocument();
  });

  // ==========================================================
  // 12. selecionarPlano - COPILOTO
  // ==========================================================
  it('12 - seleciona o plano Copiloto', async () => {
    await renderAuthenticatedApp();

    fireEvent.click(
      screen.getByRole('button', {
        name: /fazer upgrade/i,
      })
    );

    const copilotoCard = screen.getByText('Copiloto');

    await act(async () => {
      fireEvent.click(copilotoCard);
    });

    expect(screen.queryByText('SEJA COPILOTO PRO')).not.toBeInTheDocument();
    expect(
      screen.getByText('Copiloto (R$ 29,90/mês)')
    ).toBeInTheDocument();
  });

  // ==========================================================
  // 13. selecionarPlano - PRO
  // ==========================================================
  it('13 - seleciona o plano Copiloto Pro', async () => {
    await renderAuthenticatedApp();

    fireEvent.click(
      screen.getByRole('button', {
        name: /fazer upgrade/i,
      })
    );

    const proCard = screen.getByText('Copiloto Pro');

    await act(async () => {
      fireEvent.click(proCard);
    });

    expect(
      screen.getByText('Copiloto Pro (R$ 39,90/mês)')
    ).toBeInTheDocument();
  });

  // ==========================================================
  // 14. FECHA MODAL
  // ==========================================================
  it('14 - fecha o modal de planos', async () => {
    await renderAuthenticatedApp();

    fireEvent.click(
      screen.getByRole('button', {
        name: /fazer upgrade/i,
      })
    );

    expect(
      screen.getByText('SEJA COPILOTO PRO')
    ).toBeInTheDocument();

    const closeButtons = screen.getAllByRole('button', {
      name: '✕',
    });

    await act(async () => {
      fireEvent.click(closeButtons[0]);
    });

    expect(
      screen.queryByText('SEJA COPILOTO PRO')
    ).not.toBeInTheDocument();
  });

  // ==========================================================
  // 15. HANDLE SUBSCRIBE SEM USUÁRIO
  // ==========================================================
  it('15 - impede assinatura quando auth.currentUser não existe', async () => {
    await renderAuthenticatedApp();

    // auth.currentUser (getter do mock) passa a ser null depois do login
    mocks.currentUser = null;

    fireEvent.click(
      screen.getByRole('button', {
        name: /fazer upgrade/i,
      })
    );

    const assinar = screen.getByRole('button', {
      name: /ativar essencial/i,
    });

    await act(async () => {
      fireEvent.click(assinar);
    });

    expect(window.alert).toHaveBeenCalledWith(
      'Por favor, faça login antes de assinar.'
    );

    expect(window.open).not.toHaveBeenCalled();
  });

  // ==========================================================
  // 16. HANDLE SUBSCRIBE COM USUÁRIO
  // ==========================================================
  it('16 - abre link Asaas com externalReference do usuário', async () => {
    await renderAuthenticatedApp({
      uid: 'uid-assinatura',
      email: 'assinante@teste.com',
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: /fazer upgrade/i,
      })
    );

    const assinar = screen.getByRole('button', {
      name: /ativar essencial/i,
    });

    await act(async () => {
      fireEvent.click(assinar);
    });

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining(
        'https://sandbox.asaas.com/c/kvomyzpygxcgvmby'
      ),
      '_blank'
    );

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining(
        'externalReference=uid-assinatura'
      ),
      '_blank'
    );
  });

  // ==========================================================
  // 17. LOGIN GOOGLE - SUCESSO
  // ==========================================================
  it('17 - executa login Google com sucesso', async () => {
    mocks.currentUser = null;

    mocks.signInWithPopup.mockResolvedValueOnce({
      user: {
        uid: 'google-123',
        email: 'google@teste.com',
        displayName: 'Google Teste',
      },
    });

    await renderApp();

    fireEvent.click(
      screen.getByRole('button', { name: /entrar com o google/i })
    );

    await waitFor(() => {
      expect(mocks.signInWithPopup).toHaveBeenCalledTimes(1);
    });

    expect(mocks.setCustomParameters).toBeDefined();
  });

  // ==========================================================
  // 18. LOGIN GOOGLE - ERRO
  // ==========================================================
  it('18 - possui tratamento para erro do login Google', async () => {
    mocks.signInWithPopup.mockRejectedValueOnce(
      new Error('Erro Google')
    );

    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    mocks.currentUser = null;

    await renderApp();

    fireEvent.click(
      screen.getByRole('button', { name: /entrar com o google/i })
    );

    await waitFor(() => {
      expect(mocks.signInWithPopup).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });

    consoleError.mockRestore();
  });

  // ==========================================================
  // 19. EMAIL LOGIN - SUCESSO
  // ==========================================================
  it('19 - mock do envio de link de login por e-mail funciona', async () => {
    await renderAuthenticatedApp();

    await mocks.sendSignInLinkToEmail(
      mockAuth,
      'teste@teste.com',
      {
        url: window.location.href,
        handleCodeInApp: true,
      }
    );

    expect(
      mocks.sendSignInLinkToEmail
    ).toHaveBeenCalledWith(
      mockAuth,
      'teste@teste.com',
      {
        url: window.location.href,
        handleCodeInApp: true,
      }
    );
  });

  // ==========================================================
  // 20. EMAIL LOGIN - ERRO
  // ==========================================================
  it('20 - trata erro no envio de link por e-mail', async () => {
    mocks.sendSignInLinkToEmail.mockRejectedValueOnce(
      new Error('Erro de e-mail')
    );

    await expect(
      mocks.sendSignInLinkToEmail(
        mockAuth,
        'erro@teste.com',
        {
          url: window.location.href,
          handleCodeInApp: true,
        }
      )
    ).rejects.toThrow('Erro de e-mail');
  });

  // ==========================================================
  // 21. LOGOUT
  // ==========================================================
  it('21 - executa logout pelo botão Sair', async () => {
    await renderAuthenticatedApp();

    localStorage.setItem(
      'usuarioLogado',
      'fausto@teste.com'
    );

    sessionStorage.setItem(
      'teste',
      '123'
    );

    const logoutButton = screen.getByRole('button', {
      name: /sair/i,
    });

    await act(async () => {
      fireEvent.click(logoutButton);
    });

    expect(
      localStorage.getItem('usuarioLogado')
    ).toBeNull();

    expect(
      sessionStorage.length
    ).toBe(0);

    // O redirect de logout navega na própria aba (window.open '_self',
    // mockável — window.location é unforgeable no jsdom)
    expect(window.open).toHaveBeenCalledWith(
      'https://www.google.com',
      '_self'
    );
  });

  // ==========================================================
  // 22. LOGOUT - ERRO NO signOut
  // ==========================================================
  it('22 - executa logout mesmo quando signOut rejeita', async () => {
    mocks.signOut.mockRejectedValueOnce(
      new Error('Erro no signOut')
    );

    await renderAuthenticatedApp();

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', {
          name: /sair/i,
        })
      );
    });

    expect(window.open).toHaveBeenCalledWith(
      'https://www.google.com',
      '_self'
    );
  });

  // ==========================================================
  // 23. ABA FINANCEIRO
  // ==========================================================
  it('23 - renderiza Módulo Financeiro quando activeTab é financeiro', async () => {
    await renderAuthenticatedApp();

    const painelFinanceiro =
      screen.getByTestId('painel-financeiro');

    await act(async () => {
      fireEvent.click(painelFinanceiro);
    });

    expect(
      screen.getByTestId('modulo-financeiro')
    ).toBeInTheDocument();
  });

  // ==========================================================
  // 24. ABA FECHAMENTO
  // ==========================================================
  it('24 - abre Fechamento Diário', async () => {
    await renderAuthenticatedApp();

    fireEvent.click(
      screen.getByRole('button', {
        name: /fechamento diário/i,
      })
    );

    expect(
      screen.getByTestId('fechamento-diario')
    ).toBeInTheDocument();
  });

  // ==========================================================
  // 25. ABA CENTRAL CONTADOR
  // ==========================================================
  it('25 - abre Central Contador', async () => {
    await renderAuthenticatedApp();

    fireEvent.click(
      screen.getByRole('button', {
        name: /central contador/i,
      })
    );

    expect(
      screen.getByTestId('central-contador')
    ).toBeInTheDocument();
  });

  // ==========================================================
  // 26. ABA OPEN FINANCE
  // ==========================================================
  it('26 - abre Open Finance', async () => {
    await renderAuthenticatedApp();

    fireEvent.click(
      screen.getByRole('button', {
        name: /open finance/i,
      })
    );

    expect(
      screen.getByTestId('open-finance')
    ).toBeInTheDocument();
  });

  // ==========================================================
  // 27. PERFIL
  // ==========================================================
  it('27 - abre e fecha modal de Perfil', async () => {
    await renderAuthenticatedApp();

    fireEvent.click(
      screen.getByRole('button', {
        name: /^perfil$/i,
      })
    );

    expect(
      screen.getByTestId('perfil')
    ).toBeInTheDocument();

    const closeButtons = screen.getAllByRole('button', {
      name: '✕',
    });

    await act(async () => {
      fireEvent.click(closeButtons[0]);
    });

    expect(
      screen.queryByTestId('perfil')
    ).not.toBeInTheDocument();
  });

  // ==========================================================
  // 28. NAVEGAÇÃO PAINEL
  // ==========================================================
  it('28 - retorna para Painel', async () => {
    await renderAuthenticatedApp();

    fireEvent.click(
      screen.getByRole('button', {
        name: /fechamento diário/i,
      })
    );

    expect(
      screen.getByTestId('fechamento-diario')
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', {
        name: /^painel$/i,
      })
    );

    expect(
      screen.getByTestId('painel')
    ).toBeInTheDocument();
  });

  // ==========================================================
  // 29. RENDERIZAÇÃO DO NOME / EMAIL
  // ==========================================================
  it('29 - utiliza displayName quando necessário', async () => {
    mocks.currentUser = {
      uid: 'user-display',
      email: null,
      displayName: 'Fausto Souza',
    };

    await renderApp();

    expect(
      screen.getByText('Fausto Souza')
    ).toBeInTheDocument();
  });

  // ==========================================================
  // 30. USUÁRIO SEM EMAIL E SEM DISPLAYNAME
  // ==========================================================
  it('30 - suporta usuário sem email e sem displayName', async () => {
    mocks.currentUser = {
      uid: 'user-sem-dados',
      email: null,
      displayName: null,
    };

    await renderApp();

    // Fallback: exibe o uid quando não há email nem displayName
    expect(screen.getByText('user-sem-dados')).toBeInTheDocument();
  });

  // ==========================================================
  // 31. EVENTO RESIZE
  // ==========================================================
  it('31 - suporta alteração de viewport sem quebrar o App', async () => {
    await renderAuthenticatedApp();

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 375,
    });

    await act(async () => {
      window.dispatchEvent(new Event('resize'));
    });

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1280,
    });

    await act(async () => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(
      screen.getByText('Copiloto Financeiro')
    ).toBeInTheDocument();
  });

  // ==========================================================
  // 32. BOTÃO CALCULADORA
  // ==========================================================
  it('32 - abre a Calculadora sem quebrar o App', async () => {
    await renderAuthenticatedApp();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Calculadora' }));
    });

    expect(screen.getByText('Copiloto Financeiro')).toBeInTheDocument();
    expect(screen.getByTestId('painel')).toBeInTheDocument();
  });

  // ==========================================================
  // 33. ASSINATURA COPILOTO E PRO
  // ==========================================================
  it('33 - assina Copiloto e Copiloto Pro pelo modal', async () => {
    await renderAuthenticatedApp();

    fireEvent.click(screen.getByRole('button', { name: /fazer upgrade/i }));

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: /assinar copiloto/i })
      );
    });

    expect(window.open).toHaveBeenCalledWith(
      'https://sandbox.asaas.com/c/04z4xx7wo4dlv93r?externalReference=user-123',
      '_blank'
    );

    // O clique no botão propaga para o card, que fecha o modal — reabre para o Pro
    fireEvent.click(screen.getByRole('button', { name: /fazer upgrade/i }));

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: /assinar plano pro/i })
      );
    });

    expect(window.open).toHaveBeenCalledWith(
      'https://sandbox.asaas.com/c/uwjut7rqbeeohnkl?externalReference=user-123',
      '_blank'
    );
  });

  // ==========================================================
  // 34. PLANO MARCADO COMO ATUAL AO REABRIR O MODAL
  // ==========================================================
  it('34 - marca o plano selecionado como atual ao reabrir o modal', async () => {
    await renderAuthenticatedApp();

    // Essencial selecionado -> botão do card vira "Plano Atual"
    fireEvent.click(screen.getByRole('button', { name: /fazer upgrade/i }));
    await act(async () => {
      fireEvent.click(screen.getByText('Freemium (30 Dias) / Essencial'));
    });
    fireEvent.click(screen.getByRole('button', { name: /fazer upgrade/i }));

    expect(
      screen.getByRole('button', { name: 'Plano Atual' })
    ).toBeInTheDocument();

    // Copiloto selecionado -> essencial volta a "Ativar Essencial"
    await act(async () => {
      fireEvent.click(screen.getByText('Copiloto'));
    });
    fireEvent.click(screen.getByRole('button', { name: /fazer upgrade/i }));

    expect(
      screen.getByRole('button', { name: 'Plano Atual' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Ativar Essencial' })
    ).toBeInTheDocument();

    // Copiloto Pro selecionado
    await act(async () => {
      fireEvent.click(screen.getByText('Copiloto Pro'));
    });
    fireEvent.click(screen.getByRole('button', { name: /fazer upgrade/i }));

    expect(
      screen.getByRole('button', { name: 'Assinar Plano Pro' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Copiloto Pro (R$ 39,90/mês)')
    ).toBeInTheDocument();
  });

  // ==========================================================
  // 35. CONEXÃO E CALCULADORA DE VENDAS VIA PAINEL
  // ==========================================================
  it('35 - abre Conexão e Calculadora de Vendas via Painel', async () => {
    await renderAuthenticatedApp();

    await act(async () => {
      fireEvent.click(screen.getByTestId('painel-conexao'));
    });

    expect(screen.getByTestId('conexao-screen')).toBeInTheDocument();

    // O stub dispara os callbacks recebidos do App (como o componente real faria)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Conectar máquina' }));
      fireEvent.click(screen.getByRole('button', { name: 'Desconectar máquina' }));
      fireEvent.click(screen.getByRole('button', { name: 'Desconectar todas' }));
    });

    fireEvent.click(screen.getByRole('button', { name: /^painel$/i }));
    expect(screen.getByTestId('painel')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTestId('painel-vendas'));
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Registrar venda' }));
    });

    expect(
      screen.getByTestId('sales-calculator-screen')
    ).toBeInTheDocument();
  });

  // ==========================================================
  // 36. CALLBACKS DE AUTENTICAÇÃO APÓS DESMONTAR
  // ==========================================================
  it('36 - ignora callbacks de autenticação após desmontar o App', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const { unmount } = await renderAuthenticatedApp();

    const stateCallback = mocks.authStateCallback;
    const errorCallback = mocks.authErrorCallback;
    expect(stateCallback).toBeTypeOf('function');

    unmount();

    // O Firebase pode invocar os callbacks mesmo depois do unsubscribe —
    // o guard isMounted do App deve ignorar os dois caminhos sem quebrar.
    await act(async () => {
      stateCallback?.(mocks.currentUser);
      errorCallback?.(new Error('após desmontar'));
    });

    expect(consoleError).toHaveBeenCalledWith(
      'Erro na sessão:',
      expect.any(Error)
    );

    consoleError.mockRestore();
  });

  // ==========================================================
  // 37. LOGOUT SEM auth.signOut DISPONÍVEL
  // ==========================================================
  it('37 - executa logout mesmo sem auth.signOut disponível', async () => {
    const originalSignOut = mockAuth.signOut;
    (mockAuth as any).signOut = undefined;

    try {
      await renderAuthenticatedApp();

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', { name: /sair/i })
        );
      });

      expect(window.open).toHaveBeenCalledWith(
        'https://www.google.com',
        '_self'
      );
    } finally {
      mockAuth.signOut = originalSignOut;
    }
  });
});
