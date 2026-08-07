const fs = require('fs');

function verificarBalanceamento(caminhoArquivo) {
    const conteudo = fs.readFileSync(caminhoArquivo, 'utf8');
    const linhas = conteudo.split(/\r?\n/);

    const pilhaChaves = [];
    const pilhaParenteses = [];
    const pilhaColchetes = [];

    console.log(`Iniciando análise linha por linha de: ${caminhoArquivo}`);
    console.log(`Total de linhas: ${linhas.length}`);

    for (let idx = 0; idx < linhas.length; idx++) {
        const linha = linhas[idx];
        const numLinha = idx + 1;

        for (let charIdx = 0; charIdx < linha.length; charIdx++) {
            const char = linha[charIdx];

            if (char === '{') {
                pilhaChaves.push({ linha: numLinha, coluna: charIdx + 1 });
            } else if (char === '}') {
                if (pilhaChaves.length === 0) {
                    console.log(`ERRO CRÍTICO: Chave '}' fechada a mais na Linha ${numLinha}, Coluna ${charIdx + 1}`);
                    return;
                }
                pilhaChaves.pop();
            } else if (char === '(') {
                pilhaParenteses.push({ linha: numLinha, coluna: charIdx + 1 });
            } else if (char === ')') {
                if (pilhaParenteses.length === 0) {
                    console.log(`ERRO CRÍTICO: Parêntese ')' fechado a mais na Linha ${numLinha}, Coluna ${charIdx + 1}`);
                    return;
                }
                pilhaParenteses.pop();
            } else if (char === '[') {
                pilhaColchetes.push({ linha: numLinha, coluna: charIdx + 1 });
            } else if (char === ']') {
                if (pilhaColchetes.length === 0) {
                    console.log(`ERRO CRÍTICO: Colchete ']' fechado a mais na Linha ${numLinha}, Coluna ${charIdx + 1}`);
                    return;
                }
                pilhaColchetes.pop();
            }
        }
    }

    if (pilhaChaves.length > 0) {
        const ultimo = pilhaChaves[pilhaChaves.length - 1];
        console.log(`FALHA DE ESCOPO: Chave '{' aberta na Linha ${ultimo.linha}, Coluna ${ultimo.coluna} nunca foi fechada.`);
    }
    if (pilhaParenteses.length > 0) {
        const ultimo = pilhaParenteses[pilhaParenteses.length - 1];
        console.log(`FALHA DE ESCOPO: Parêntese '(' aberto na Linha ${ultimo.linha}, Coluna ${ultimo.coluna} nunca foi fechado.`);
    }
    if (pilhaColchetes.length > 0) {
        const ultimo = pilhaColchetes[pilhaColchetes.length - 1];
        console.log(`FALHA DE ESCOPO: Colchete '[' aberto na Linha ${ultimo.linha}, Coluna ${ultimo.coluna} nunca foi fechado.`);
    }

    if (pilhaChaves.length === 0 && pilhaParenteses.length === 0 && pilhaColchetes.length === 0) {
        console.log("SINTAXE OK: Todas as chaves, parênteses e colchetes estão perfeitamente balanceados.");
    }
}

verificarBalanceamento("src/App.tsx");