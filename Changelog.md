# Changelog

All notable changes to Vibe Reels.

## [0.1.0] — 2026-04-21

First end-to-end build. Target: iPhone Safari 16+ como PWA instalada.

### Added

- **3 templates fixos**: Golden Hour (fade, warm), Night Out (hardcut, neon), Travel (zoom, natural + texto).
- **Fluxo completo de 6 ecrãs**: Home → Picker → (Text) → Moments → Export → Share.
- **Validação de input**: tamanho ≤200 MB por ficheiro, duração mínima por slot, retry inline em caso de erro.
- **Pipeline FFmpeg.wasm**: pré-trim por clip, assembly final com LUT 3D, xfade/concat, drawtext (Travel), scale+crop 1080×1920, H.264/CRF 20/30fps, sem áudio.
- **Preview em tempo real**: CSS `filter` nos ecrãs Picker/Moments (aproximação do LUT).
- **Web Worker**: processamento FFmpeg.wasm isolado da UI thread, com barra de progresso + log tail.
- **Web Share API**: integração com Share Sheet iOS para guardar em Fotos; fallback de download em desktop.
- **PWA completa**: manifest, ícones 180/192/512 (placeholders), service worker com cache estático e cache dedicado para FFmpeg.wasm.
- **Design system**: tema dark minimalista, tipografia system font, safe-area iOS, landscape lock com aviso.
- **Testes unitários** (22): schema dos templates, builders FFmpeg (trim/photo-to-clip/assembly), pipeline orchestration, escape de drawtext, timing correcto com xfade.
- **Testes de integração** (opt-in): gera vídeo real por template e valida com ffprobe — requer `ffmpeg` no sistema.
- **CI/CD**: GitHub Actions corre testes unitários em cada PR + deploy automático para GitHub Pages em push para `main`.

### Known placeholders (substituir antes de shipping real)

- `assets/luts/*.cube` são passthrough identity LUTs — substituir por LUTs reais de Golden Hour / Night Out / Travel (royalty-free, e.g. IWLTBAP, RocketStock).
- `assets/thumbs/*.png` são rectângulos de cor sólida — substituir por thumbnails reais (270×480 JPEG renderizado com LUT aplicada a sample footage).
- `assets/icons/*.png` são placeholders cinzentos — substituir por ícone branded gerado em https://realfavicongenerator.net.

### Manual actions pendentes

- Task 20–21: correr `npm run gen:fixtures` após instalar `ffmpeg` (requer `winget install ffmpeg` em Windows) para ter fixtures de integração.
- Task 23: `gh repo create mariormmatos/vibe-reels --public --source . --remote origin --push` e activar Pages em Settings → Pages → GitHub Actions.
- Task 24: smoke test em iPhone Safari real a partir do URL público.

### Arquitectura

- Vanilla HTML/CSS/JS ES modules — zero framework, zero bundler.
- Zero backend, zero auth, zero DB — client-only.
- FFmpeg.wasm `@ffmpeg/ffmpeg@0.12.10` + `@ffmpeg/util@0.12.1` via CDN (self-host é upgrade path documentado).
- Vitest 2.x para testes, configs separadas para unit vs integration.
