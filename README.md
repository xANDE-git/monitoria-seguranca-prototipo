# Monitoria e Segurança — protótipo navegável

Trabalho acadêmico (grupo de 6). Protótipo em HTML/CSS/JS puros, sem servidor: abra `index.html` no navegador.
Todos os dados são fictícios e ficam só na memória da página (recarregar = reiniciar).

## Como usar
- Botões **Mobile** e **Desktop** escolhem qual versão aparece (uma por vez). Qualquer perfil entra em qualquer uma; as duas leem o mesmo estado: o que um faz aparece no outro.
- Seta **Demonstração** (canto direito) abre os controles: relógio simulado (+5 min, +1 h, próximo evento, rodar o tempo), som, reiniciar e entrar com perfis de demonstração.
- Login de demonstração: botão "Preencher". Senha do código de recuperação: `123456`.

## O que cobre do documento
Login por perfil, cadastro em 2 passos, esqueci/redefinir senha, configurações (contatos, rotina, medicações, exames, limites, tempo do check-in), status (Estável/Pendente/Emergência), verificar com mensagens prontas, histórico com gráficos e valores fora do limite, relatório semanal, registro de ações, SOS (responsável/190/192), check-in (Estou bem/Não estou bem/Preciso de ajuda), lembretes, sinais vitais, som nas notificações.

## Decisões (14/11/2026)
- Design próprio (areia, verde-sálvia, âmbar para atenção, terracota para emergência), letra grande no celular do monitorado. Não segue os slides.
- "Não estou bem", "Preciso de ajuda", sinal vital fora do limite e medicação atrasada deixam o status em **Pendente** (o documento só define Pendente para falta de resposta; SOS é o único que vira Emergência). Combinar no grupo.
- Chamadas 190/192 são simuladas. Nenhuma notificação ou som sai do navegador.

## Pendências para a versão real
- Autenticação, criptografia de senha e banco de dados de verdade.
- Notificação push no celular e ligação real.
- Horário de exame com data (o documento só cita "horário").
