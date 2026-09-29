// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Privacidade } from '../../screens/Privacidade';

describe('Privacidade - Termos e Segurança', () => {
  beforeEach(() => {
    vi.spyOn(window, 'open').mockImplementation(() => null as any);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('deve renderizar a tela de privacidade com os termos', () => {
    render(<Privacidade />);

    expect(screen.getByText('Política de Privacidade e Termos')).toBeInTheDocument();
    expect(screen.getByText(/Coletamos apenas seu e-mail de cadastro/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /entendi e concordo com os termos/i })
    ).toBeInTheDocument();
  });

  it('recusar os termos navega para fora do aplicativo na mesma aba', () => {
    render(<Privacidade />);

    fireEvent.click(screen.getByRole('button', { name: '✕' }));

    expect(window.open).toHaveBeenCalledWith('https://www.google.com', '_self');
  });

  it('aceitar os termos dispara o callback onAceitar', () => {
    const onAceitar = vi.fn();
    render(<Privacidade onAceitar={onAceitar} />);

    fireEvent.click(
      screen.getByRole('button', { name: /entendi e concordo com os termos/i })
    );

    expect(onAceitar).toHaveBeenCalledTimes(1);
  });
});
