process.env.DISABLE_HMR = 'true';

import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import {
  FunctionDeclaration,
  GoogleGenAI,
  LiveServerMessage,
  Modality,
  Type,
} from '@google/genai';

const __dirname = import.meta.dirname;
const PORT = 3000;

function getGenAIClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const addTransactionDeclaration: FunctionDeclaration = {
  name: 'adicionarLancamentoFinanceiro',
  parameters: {
    type: Type.OBJECT,
    description:
      'Adiciona um valor ou lançamento em um dos campos financeiros: vendas, receber ou pagar.',
    properties: {
      type: {
        type: Type.STRING,
        description: 'Campo financeiro: "vendas", "receber" ou "pagar".',
      },
      title: {
        type: Type.STRING,
        description: 'Descrição curta do lançamento.',
      },
      grossAmount: {
        type: Type.NUMBER,
        description: 'Valor em reais (R$).',
      },
      paymentMethod: {
        type: Type.STRING,
        description:
          'Forma de pagamento: "pix", "credito_vista", "credito_parcelado", "debito", "dinheiro", "boleto" ou "transferencia".',
      },
    },
    required: ['type', 'title', 'grossAmount'],
  },
};

const clearFieldDeclaration: FunctionDeclaration = {
  name: 'limparCampoFinanceiro',
  parameters: {
    type: Type.OBJECT,
    description:
      'Apaga/zera o valor de um campo financeiro (vendas, receber, pagar ou todos) quando o usuário pedir para excluir ou zerar.',
    properties: {
      field: {
        type: Type.STRING,
        description: 'Campo a zerar/excluir: "vendas", "receber", "pagar" ou "todos".',
      },
      period: {
        type: Type.STRING,
        description: 'Período a limpar: "diario", "semanal", "mensal" ou "todos".',
      },
    },
    required: ['field'],
  },
};

// Clean, WebSocket-free /@vite/client module for hermetic Cloud Run preview (HMR is disabled in AI Studio)
const CLEAN_VITE_CLIENT_ESM = `
const sheetsMap = new Map();
const linkSheetsMap = new Map();
if ("document" in globalThis) {
  document.querySelectorAll("style[data-vite-dev-id]").forEach((el) => {
    sheetsMap.set(el.getAttribute("data-vite-dev-id"), el);
  });
  document.querySelectorAll('link[rel="stylesheet"][data-vite-dev-id]').forEach((el) => {
    linkSheetsMap.set(el.getAttribute("data-vite-dev-id"), el);
  });
}
let lastInsertedStyle;
export function updateStyle(id, content) {
  if (linkSheetsMap.has(id)) return;
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement("style");
    style.setAttribute("type", "text/css");
    style.setAttribute("data-vite-dev-id", id);
    style.textContent = content;
    if (!lastInsertedStyle) {
      document.head.appendChild(style);
      setTimeout(() => {
        lastInsertedStyle = undefined;
      }, 0);
    } else {
      lastInsertedStyle.insertAdjacentElement("afterend", style);
    }
    lastInsertedStyle = style;
  } else {
    style.textContent = content;
  }
  sheetsMap.set(id, style);
}
export function removeStyle(id) {
  if (linkSheetsMap.has(id)) {
    document.querySelectorAll(\`link[rel="stylesheet"][data-vite-dev-id="\${CSS.escape(id)}"]\`).forEach((el) => el.remove());
    linkSheetsMap.delete(id);
  }
  const style = sheetsMap.get(id);
  if (style) {
    document.head.removeChild(style);
    sheetsMap.delete(id);
  }
}
const dataMap = new Map();
export function createHotContext(ownerPath) {
  if (!dataMap.has(ownerPath)) dataMap.set(ownerPath, {});
  return {
    get data() {
      return dataMap.get(ownerPath);
    },
    accept() {},
    acceptExports() {},
    dispose() {},
    prune() {},
    decline() {},
    invalidate() {},
    on() {},
    off() {},
    send() {},
  };
}
export function injectQuery(url, queryToInject) {
  if (url[0] !== "." && url[0] !== "/") return url;
  const pathname = url.replace(/[?#].*$/, "");
  const { search, hash } = new URL(url, "http://vite.dev");
  return \`\${pathname}?\${queryToInject}\${search ? "&" + search.slice(1) : ""}\${hash || ""}\`;
}
const BaseHTMLElement = "HTMLElement" in globalThis ? globalThis.HTMLElement : class {};
export class ErrorOverlay extends BaseHTMLElement {
  close() {}
}
`;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  const server = http.createServer(app);

  // WebSocket server strictly for /live
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const url = request.url || '';
    if (url.startsWith('/live')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', async (clientWs: WebSocket) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sessionPromise: Promise<any> | null = null;

    try {
      const ai = getGenAIClient();
      sessionPromise = ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          tools: [
            {
              functionDeclarations: [
                addTransactionDeclaration,
                clearFieldDeclaration,
              ],
            },
          ],
          systemInstruction:
            'Você é o Copiloto Financeiro por voz em português do Brasil. Ajude o usuário a lançar valores ou apagar/excluir valores nos campos Vendas, A Receber e A Pagar (nos relatórios Diário, Semanal e Mensal). Seja conciso, direto e confirme sempre os valores lançados ou excluídos.',
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            if (clientWs.readyState !== WebSocket.OPEN) return;

            const parts = message.serverContent?.modelTurn?.parts || [];
            for (const part of parts) {
              if (part.inlineData?.data) {
                clientWs.send(
                  JSON.stringify({
                    type: 'audio',
                    audio: part.inlineData.data,
                  })
                );
              }
            }

            if (message.serverContent?.inputTranscription?.text) {
              clientWs.send(
                JSON.stringify({
                  type: 'input_transcription',
                  text: message.serverContent.inputTranscription.text,
                })
              );
            }

            if (message.serverContent?.outputTranscription?.text) {
              clientWs.send(
                JSON.stringify({
                  type: 'output_transcription',
                  text: message.serverContent.outputTranscription.text,
                })
              );
            }

            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ type: 'interrupted' }));
            }

            if (message.toolCall?.functionCalls) {
              for (const fc of message.toolCall.functionCalls) {
                clientWs.send(
                  JSON.stringify({
                    type: 'tool_call',
                    name: fc.name,
                    args: fc.args,
                    id: fc.id,
                  })
                );

                sessionPromise?.then((s) => {
                  s.sendToolResponse({
                    functionResponses: [
                      {
                        id: fc.id,
                        name: fc.name,
                        response: { result: 'ok' },
                      },
                    ],
                  });
                });
              }
            }
          },
          onerror: (err: unknown) => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: 'error',
                  message:
                    err instanceof Error
                      ? err.message
                      : 'Erro na conexão de voz em tempo real.',
                })
              );
            }
          },
        },
      });

      await sessionPromise;
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: 'ready' }));
      }
    } catch (error: unknown) {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: 'error',
            message:
              error instanceof Error
                ? error.message
                : 'Não foi possível iniciar o Gemini Live.',
          })
        );
      }
    }

    clientWs.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.audio && sessionPromise) {
          sessionPromise.then((session) => {
            session.sendRealtimeInput({
              audio: {
                data: msg.audio,
                mimeType: 'audio/pcm;rate=16000',
              },
            });
          });
        } else if (msg.text && sessionPromise) {
          sessionPromise.then((session) => {
            session.sendRealtimeInput({
              text: msg.text,
            });
          });
        }
      } catch {
        // ignore malformed packets
      }
    });

    clientWs.on('close', () => {
      if (sessionPromise) {
        sessionPromise
          .then((session) => {
            session.close();
          })
          .catch(() => {});
      }
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    // Serve a clean, WebSocket-free /@vite/client so the browser never attempts a failing HMR WebSocket connection
    app.get('/@vite/client', (_req, res) => {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).send(CLEAN_VITE_CLIENT_ESM);
    });

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor iniciado na porta ${PORT}`);
  });
}

startServer();
