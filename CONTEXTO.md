# Vibe Reels — Contexto

## Missão

PWA mobile-first que permite ao utilizador criar Reels de Instagram estéticos escolhendo fotos/vídeos e aplicando um de três templates pré-definidos.

## Utilizadores-alvo

Pessoas com interesse em conteúdo visual apelativo, conhecimento técnico de edição médio-baixo.

## Features (MoSCoW)

### Must
- 3 templates: Golden Hour, Night Out, Travel.
- Selecção de fotos/vídeos via file input iOS.
- Slots fixos + picker de momento inicial.
- Input "Nome do local" no template Travel.
- Export MP4 9:16 (1080×1920) ≤30s sem áudio.
- Web Share API para guardar nas Fotos.
- Instalação PWA.
- UI dark minimalista.
- Deploy GitHub Pages.

### Should
- Cache FFmpeg via Service Worker.
- Progress bar + logs durante export.
- Validação upfront de duração mínima.
- Mensagens de erro em PT.

### Could
- IndexedDB para persistir selecções.
- Múltiplas qualidades de export.
- Marca de água subtil.

### Won't (nesta versão)
- Música/áudio no export.
- Speed ramping.
- Texto editável por slot.
- Beat detection.
- Accounts / auth.
- Backend.

## Critérios de sucesso

- User consegue criar e guardar um vídeo nas Fotos em <5 min sem instruções.
- Primeira carga <3s em 4G no iPhone.
- Export de 20-30s completa em <120s no iPhone 13+.
- Lighthouse PWA score ≥90.
- Zero erros console no happy path.
- 3 templates produzem outputs visualmente distinguíveis.
