# Vibe Reels — Claude Code context

## Stack e justificação

- **Frontend:** HTML/CSS/JS vanilla, sem framework. Bundle ~30 KB. Justificação: a app tem 6 ecrãs, estado simples, e o custo/benefício de React/Vue não compensa para este scope.
- **Processamento de vídeo:** FFmpeg.wasm num Web Worker. Lazy-loaded (~30 MB) só no export. Justificação: único pipeline suportado em browser que faz color grading LUT 3D + concat + transições + drawtext.
- **Testes:** Vitest (unit + integration com FFmpeg nativo).
- **Hosting:** GitHub Pages, deploy via GitHub Actions em push para `main`.
- **Sem backend, sem auth, sem DB** — tudo client-side.

## Decisões de arquitectura

- **Trim-first, concat-later**: cada clip é pré-processado isoladamente antes do assembly final, para caber na memória do iPhone.
- **CSS filter preview + LUT real no export**: preview é aproximação, export é fiel.
- **Estado em memória apenas**: fechar a app perde selecções. IndexedDB é Could, não Must.
- **Scope fechado**: 3 templates pré-definidos (Golden Hour, Night Out, Travel), sem speed ramping, sem música, sem texto editável excepto em Travel.

## O que NÃO fazer neste projecto

- Não introduzir frameworks (React, Vue, Svelte) sem discussão explícita.
- Não adicionar backend (Supabase, Railway) — tudo client-side.
- Não expandir o número de templates além de 3 no MVP.
- Não adicionar features do "Won't" do spec (música, speed ramping, text editing, multi-user, etc.).
- Não tratar Android/Desktop como targets — iOS Safari viewport 390px é o único target de teste.
- Não usar CDNs de terceiros em runtime — tudo self-hosted.

## Workflows

- Correr `npm test` antes de cada commit.
- Correr `npm run dev` para servir localmente (Python http.server na porta 8080).
- Ver spec: `docs/superpowers/specs/2026-04-20-vibe-reels-design.md`.
- Ver plano: `docs/superpowers/plans/2026-04-20-vibe-reels-implementation.md`.
