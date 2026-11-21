# Monitoria e Segurança: protótipo navegável

Protótipo clicável de app mobile de monitoria e segurança. Trabalho acadêmico, em grupo de 6 pessoas.

## Como usar

Feito em HTML, CSS e JavaScript puros, sem servidor: abra `index.html` no navegador. Não está publicado.

- Os botões **Mobile** e **Desktop** escolhem a versão exibida. As duas compartilham o mesmo estado: o que um faz aparece no outro.
- A seta **Demonstração** (canto direito) abre os controles: relógio simulado, som, reiniciar e entrar com perfis de demonstração ("Preencher").
- Os dados são fictícios e ficam só na memória da página: recarregar reinicia tudo. O código de recuperação de senha de demonstração é `123456`.

## O que cobre

Login por perfil, cadastro em 2 passos, recuperação de senha, configurações (contatos, rotina, medicações, exames, limites), status (Estável, Pendente, Emergência), verificação com mensagens prontas, histórico com gráficos, relatório semanal, registro de ações, SOS, check-in, lembretes e sinais vitais.

Chamadas 190 e 192 são simuladas; nenhuma notificação sai do navegador.

## Pendências para uma versão real

- Autenticação, criptografia de senha e banco de dados de verdade.
- Notificação push e ligação real.
- Horário de exame com data.

## Como foi feito

Trabalho em grupo. O visual é próprio (areia, verde-sálvia, âmbar e terracota, letra grande para o monitorado). O código foi feito com apoio de IA, e eu revisei e ajustei.
