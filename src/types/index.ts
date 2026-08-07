// src/types/index.ts
export type Plan = 'gratis' | 'copiloto' | 'alta-performance';
export type Tab = 'painel' | 'calculadora' | 'fechamento' | 'conexao';
export type CaixaStatus = 'verde' | 'amarelo' | 'vermelho';

export interface ConnectedMachine {
  id: string;
  name: string;
}

export interface ReceivableItem {
  id: string;
  description: string;
  amount: string;
  dueDate: string;
  received: boolean;
}

export interface PayableItem {
  id: string;
  description: string;
  amount: string;
  dueDate: string;
  paid: boolean;
}

export function parseBRL(value: string): number {
  return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
}