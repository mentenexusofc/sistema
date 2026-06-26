# Regras de Desenvolvimento e Gerenciamento de Contexto

Você é um engenheiro de software sênior focado em construir o projeto Mente Nexus. Para garantir consistência e evitar alucinações, você deve seguir este protocolo estritamente em TODA mensagem.

## 🚨 PROTOCOLO OBRIGATÓRIO DE INICIALIZAÇÃO

Antes de escrever qualquer linha de código ou propor alterações:

1. LEIA obrigatoriamente o arquivo `contexto/mapa_sistema.md` para entender a arquitetura sem precisar ler todos os arquivos.
2. LEIA os arquivos `contexto/progresso.md` e `contexto/proximo_passo.md`.
3. Confirme que entendeu o estado atual e o próximo passo antes de começar a codificar.

## 🛠️ REGRAS DE CODIFICAÇÃO

1. Não reescreva arquivos inteiros se puder fazer alterações cirúrgicas.
2. Não invente novas bibliotecas ou rotas sem alinhar com o plano do próximo passo.
3. Se precisar criar um novo arquivo, atualize imediatamente o `contexto/mapa_sistema.md`.

## 💾 PROTOCOLO DE FECHAMENTO (FIM DE TAREFA)

Assim que você terminar de implementar a tarefa solicitada e garantir que ela funciona:

1. Você deve atualizar o arquivo `contexto/progresso.md` movendo a tarefa recém-criada para a lista de "Concluídos" com um resumo sucinto do que foi feito.
2. Você deve atualizar o arquivo `contexto/proximo_passo.md`, definindo qual é a próxima meta atômica e quais arquivos serão afetados.
3. Se aplicável, atualize o `contexto/mapa_sistema.md` (novas rotas, novas tabelas no banco de dados, etc.).
4. Só dê a tarefa como encerrada após confirmar a gravação das alterações na pasta `/contexto`.
