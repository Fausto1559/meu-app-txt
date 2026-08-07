const fs = require('fs');

function verificarJSX(caminhoArquivo) {
    const conteudo = fs.readFileSync(caminhoArquivo, 'utf8');
    const linhas = conteudo.split(/\r?\n/);

    const pilhaTags = [];
    const regexTag = /<\/?([a-zA-Z0-9_-]+)(?:\s+[^>]*)?>/g;

    console.log(`Iniciando varredura avançada de JSX em: ${caminhoArquivo}`);

    for (let idx = 0; idx < linhas.length; idx++) {
        const linha = linhas[idx];
        const numLinha = idx + 1;
        
        let match;
        while ((match = regexTag.exec(linha)) !== null) {
            const tagCompleta = match[0];
            const nomeTag = match[1];
            
            // Ignorar auto-fechamento (ex: <div /> ou <input />)
            if (tagCompleta.endsWith('/>')) {
                continue;
            }

            if (tagCompleta.startsWith('</')) {
                // Tag de fechamento
                if (pilhaTags.length === 0) {
                    console.log(`ERRO DE JSX: Tag de fechamento '</${nomeTag}>' na linha ${numLinha} não tem abertura correspondente.`);
                } else {
                    const ultima = pilhaTags.pop();
                    if (ultima.nome !== nomeTag) {
                        console.log(`DESALINHAMENTO DE JSX: Esperava fechar '</${ultima.nome}>' (aberta na linha ${ultima.linha}), mas encontrou '</${nomeTag}>' na linha ${numLinha}.`);
                    }
                }
            } else {
                // Tag de abertura
                pilhaTags.push({ nome: nomeTag, linha: numLinha });
            }
        }
    }

    if (pilhaTags.length > 0) {
        console.log("\n--- TAGS ABERTAS RESTANTES (NÃO FECHADAS) ---");
        pilhaTags.slice(-10).forEach(t => {
            console.log(`Tag '<${t.nome}>' aberta na linha ${t.linha} nunca foi fechada.`);
        });
    } else {
        console.log("ESTRUTURA JSX OK: Todas as tags foram abertas e fechadas corretamente.");
    }
}

verificarJSX("src/App.tsx");