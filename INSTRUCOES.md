# Vibe Reels — Instruções para colaboração

## Princípios

- **Propor plano curto antes de qualquer alteração com impacto.** Se é refactor ou mudança arquitectural, descrever em 3-5 linhas antes de editar ficheiros.
- **Nunca remover funcionalidade existente sem instrução explícita.** Se achares que algo não serve, marca como candidato a remover, não removas.
- **Preferir soluções simples.** Se há duas formas, escolher a mais simples que cumpre o requisito.
- **Após cada evolução significativa, perguntar:** "Podia ter feito isto mais simples? Falta alguma feature útil de baixo custo?"

## Checklist pré-commit

Antes de fazer commit, verificar:
- [ ] `npm test` passa.
- [ ] Funciona no iPhone (viewport 390px no DevTools).
- [ ] Sem erros na consola.
- [ ] Dados do utilizador protegidos (nada sai do browser).
- [ ] Feature anterior ainda funciona (smoke manual).
- [ ] Commit message segue convenção (`feat:`, `fix:`, `chore:`, `test:`, `docs:`).

## Convenções

- Código e commits em inglês; prosa de docs em PT.
- 2 espaços de indentação, linhas <100 chars.
- Ficheiros <200 linhas idealmente; >300 é sinal para dividir.
- Funções puras onde possível (ex: `ffmpeg-commands.js`).
- Zero bibliotecas de UI — escrever CSS à mão.
