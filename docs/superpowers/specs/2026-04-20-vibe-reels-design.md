# Vibe Reels — Design Doc

**Data:** 2026-04-20
**Autor:** Mário + Claude (brainstorming session)
**Estado:** Aprovado, pronto para `writing-plans`

---

## 1. Missão e utilizadores-alvo

**Missão:** PWA mobile-first que permite ao utilizador criar Reels de Instagram esteticamente apelativos escolhendo fotos e vídeos da galeria do iPhone e aplicando um de três templates pré-definidos (color grading + transições + layout). O utilizador não precisa de saber editar vídeo.

**Utilizador-alvo:** Pessoa com interesse em conteúdo visual apelativo no Instagram, com conhecimento técnico de edição médio-baixo, que procura resultados rápidos e consistentes sem aprender uma app profissional.

**Exemplo de uso:** Abre a app no iPhone → escolhe "Golden Hour" → selecciona 5 clips/fotos → ajusta o instante inicial de cada vídeo → carrega em "Exportar" → aguarda ~60s → guarda o vídeo nas Fotos.

**Referência visual:** Prequel (iOS native). Vibe Reels é uma alternativa web mais limitada mas gratuita e instalável como PWA.

---

## 2. Scope (MoSCoW)

### Must

- 3 templates visualmente distintos: **Golden Hour**, **Night Out**, **Travel**.
- Selecção de fotos e vídeos via `<input type="file">` nativo iOS.
- Slots fixos por template com picker de momento inicial por vídeo (slider).
- Input "Nome do local" no template Travel.
- Export de MP4 9:16 (1080×1920), ≤30s, H.264, sem áudio.
- Share Sheet nativo iOS para guardar nas Fotos (Web Share API).
- Instalação como PWA (manifest + service worker + ícones).
- UI dark minimalista premium.
- Deploy automático via GitHub Pages.
- Testes unitários para `ffmpeg-commands.js` e schema de templates.
- Testes de integração headless para o pipeline de cada template.

### Should

- Cache do FFmpeg.wasm via Service Worker (segunda utilização não re-descarrega os ~30MB).
- Barra de progresso durante o export com logs do FFmpeg.
- Validação upfront de duração mínima por clip (impede avançar com clips curtos demais).
- Mensagens de erro claras em PT para Out-of-Memory e falhas de load.
- Manter selecções no estado se o export falha (user não perde trabalho).

### Could

- Persistência local via IndexedDB (retomar sessão após fechar app). **Adiado — MVP fica sem.**
- Múltiplas versões de cada template (ex: Golden Hour "soft" vs "punchy").
- Exportar em qualidades diferentes (480p / 720p / 1080p).
- Marca de água subtil no canto (branding).

### Won't (nesta versão)

- Música/áudio (export é mudo por decisão explícita — user adiciona música no Instagram).
- Speed ramping ou slow motion.
- Texto editável por slot (só há 1 campo de texto no template Travel).
- Beat detection / sincronização com música.
- Edição manual fina (trimming frame-a-frame, ajuste de LUT, etc.).
- Contas de utilizador, auth, sync entre dispositivos.
- Histórico de exports passados.
- Backend (Supabase, Railway) — tudo client-side.
- Suporte offline no primeiro uso (precisa descarregar FFmpeg primeiro).
- Android / Desktop (explicitamente iOS-first; funciona tecnicamente noutros mas não é testado).

---

## 3. Critérios de sucesso

- **Funcional:** user consegue, num único fluxo sem instruções, criar e guardar um vídeo nas Fotos do iPhone em menos de 5 minutos de interacção total.
- **Performance:** primeira carga da app <3s em 4G no iPhone; export de 20-30s de vídeo em <120s no iPhone 13 ou superior.
- **Instalabilidade:** passa no Lighthouse PWA audit com score ≥90.
- **Estética:** os 3 templates produzem outputs claramente distinguíveis a olho nu quando aplicados ao mesmo material.
- **Resiliência:** zero erros não-tratados na consola em todo o fluxo happy-path; mensagens de erro em PT para cenários previstos (ficheiro muito curto, OOM, FFmpeg load fail).

---

## 4. Arquitectura

**Tipo:** PWA 100% estática, client-side only. Zero backend.

**Hosting:** GitHub Pages em `https://ripth.github.io/vibe-reels/` a partir do repo `vibe-reels`.

**Runtime:**
- HTML/CSS/JS vanilla. Total bundle inicial (sem FFmpeg): ~30 KB.
- **FFmpeg.wasm (~30 MB) lazy-loaded** — só carrega quando o user carrega em "Exportar". Cacheado pelo Service Worker após a primeira vez.
- Processamento de vídeo isolado num **Web Worker** (evita bloquear a UI thread).
- Sem dependências de CDN de terceiros em runtime — FFmpeg servido do mesmo domínio.

**Instalação iOS:** `manifest.json` + ícones (180/192/512) + meta tags Apple-specific. User faz "Adicionar ao Ecrã Principal" e a app abre standalone.

**Decisão explícita:** sem persistência. Fechar a app = perder selecções. Aceitável para MVP (ver Could).

---

## 5. Componentes

```
vibe-reels/
├── index.html                  # shell minimal + <div id="app"></div>
├── manifest.json               # PWA manifest
├── service-worker.js           # cache de assets + FFmpeg
├── assets/
│   ├── icons/                  # 180x180, 192x192, 512x512
│   ├── luts/
│   │   ├── golden_hour.cube
│   │   ├── night_out.cube
│   │   └── travel.cube
│   ├── thumbs/                 # preview estático de cada template na Home
│   │   ├── golden_hour.jpg
│   │   ├── night_out.jpg
│   │   └── travel.jpg
│   └── fonts/
│       └── postcard.woff2      # fonte para texto Travel
├── src/
│   ├── app.js                  # máquina de estados + render de ecrãs
│   ├── templates.js            # 3 templates como JSON declarativo
│   ├── screens/
│   │   ├── home.js
│   │   ├── picker.js
│   │   ├── text.js             # só rendered se template === travel
│   │   ├── moments.js
│   │   ├── export.js
│   │   └── share.js
│   ├── ffmpeg-worker.js        # Web Worker que hospeda FFmpeg.wasm
│   ├── ffmpeg-commands.js      # pure function: (template, inputs) → cmd[]
│   └── ui.js                   # helpers: toast, progress bar, thumbs
├── tests/
│   ├── fixtures/               # short.mp4, wide.mp4, photo.jpg
│   ├── unit/
│   │   ├── ffmpeg-commands.test.js
│   │   └── templates.test.js
│   └── integration/
│       └── pipeline.test.js    # corre FFmpeg real em Node, valida output
├── style.css                   # design system dark minimalist
└── package.json                # deps: @ffmpeg/ffmpeg, vitest, ffprobe-static
```

**Responsabilidades:**

- **`app.js`** — máquina de estados `home → picker → [text?] → moments → export → share`. Render imperativo por ecrã a partir de um objecto de estado global. Sem router de URL.
- **`templates.js`** — fonte única da verdade dos 3 templates. Editar um template = mudar 1 objecto JSON.
- **`ffmpeg-commands.js`** — função pura testável. Input: `(template, inputFiles[], moments[], text?)`. Output: array de comandos FFmpeg sequenciais (pré-trim por clip + concat final + color + transições + texto).
- **`ffmpeg-worker.js`** — Web Worker isolado. Recebe `{ template, files, moments, text }` via `postMessage`. Emite progresso (`0-100`), logs, e finalmente um `Blob` MP4 ou erro.

**Estado global:**
```js
{
  screen: 'home' | 'picker' | 'text' | 'moments' | 'export' | 'share',
  template: TemplateDef | null,
  slots: Array<{ file: File, thumb: string, startTime: number }>,
  text: string | null,
  exportBlob: Blob | null,
  exportProgress: number  // 0-100
}
```

---

## 6. Templates — schema e definições

### Schema

```js
{
  id: string,               // 'golden-hour' | 'night-out' | 'travel'
  name: string,             // display name
  description: string,      // 1 linha na Home
  slots: Array<{
    type: 'video' | 'photo',
    duration: number        // segundos
  }>,
  transition: {
    type: 'fade' | 'hardcut' | 'zoom',
    duration: number        // segundos (0 para hardcut)
  },
  cssFilter: string,        // aproximação do LUT para preview ao vivo
  lutFile: string | null,   // path para .cube do render final
  ffmpegFilters: string[],  // filtros adicionais (crop, scale, contrast)
  textSlot: number | null,  // índice do slot onde o texto aparece (só Travel)
  textStyle: {              // só usado se textSlot !== null
    font: string,
    size: number,
    color: string,
    position: 'top' | 'center' | 'bottom'
  } | null,
  thumbnail: string         // path para assets/thumbs/<id>.jpg
}
```

### Os 3 templates

**Golden Hour**
- 5 slots: `[video 5s, video 4s, photo 3s, video 5s, photo 3s]` — total 20s.
- Transições: fade 0.4s.
- CSS filter preview: `brightness(1.05) contrast(0.95) saturate(1.1) sepia(0.15)`.
- LUT: `golden_hour.cube` (aplicado via filter `lut3d=file=assets/luts/golden_hour.cube`).
- Vibe: warm, soft, faded.
- Sem texto.

**Night Out**
- 4 slots: `[video 5s, video 4s, video 4s, video 3s]` — total 16s.
- Transições: hardcut (0s).
- CSS filter preview: `saturate(1.5) contrast(1.2) hue-rotate(-10deg) brightness(0.95)`.
- LUT: `night_out.cube` (push magenta/azul nos highlights e shadows).
- Vibe: neon, alta saturação, punchy.
- Sem texto.

**Travel**
- 6 slots: `[photo 2s, video 4s, video 4s, photo 2s, video 5s, photo 3s]` — total 20s.
- Transições: zoom-in 0.3s.
- CSS filter preview: `saturate(1.2) contrast(1.1) brightness(1.02)`.
- LUT: `travel.cube` (natural boost, blues mais profundos, greens mais vivos).
- Vibe: natural mas vivo.
- **Texto:** input único do user ("Nome do local"), aparece no slot índice 5 (última foto), fonte serif ("postcard"), centro vertical, cor branca com sombra subtil.

---

## 7. User journey

1. **Home** — 3 cards grandes empilhados verticalmente, um por template (nome + descrição + thumbnail). Tap num card → Picker.

2. **Picker** — N cartões verticais (N = `slots.length`). Cada cartão mostra o tipo esperado (Vídeo/Foto) e a duração. Tap → `<input type="file">` nativo iOS. Após selecção, thumb aparece no cartão. Se vídeo for mais curto que o slot, cartão fica vermelho com toast. Botão "Continuar" desactivado até todos os slots estarem OK.

3. **Text** *(só se template.id === 'travel')* — input de texto simples ("Nome do local", máx 30 chars) com live preview sobreposto numa das thumbs. Botão "Continuar".

4. **Moments** — para cada slot de vídeo (slots de foto skipados), um card com `<video>` loopando com CSS filter do template aplicado, e um slider horizontal ("início do corte", 0 → `duration - slotDuration`). Label: "Vais usar 5s começando em 00:12". Scroll vertical pelos cards. Botão fixo no fundo: "Exportar vídeo".

5. **Export** — overlay full-screen escuro. Fases:
   - 0–30%: carrega FFmpeg (só na primeira vez; depois cacheado).
   - 30–95%: processa — pré-trim de cada clip + concat + color + transições + texto.
   - 95–100%: finaliza e produz Blob MP4.
   Mostra logs FFmpeg em texto pequeno por baixo da barra. Se erro: mensagem clara em PT + botão "Tentar de novo" (mantém selecções).

6. **Share** — `<video controls autoplay>` com o resultado. Botão primário **"Guardar no iPhone"** (Web Share API com `{ files: [mp4File] }` → iOS Share Sheet → user toca "Save Video"). Botão secundário **"Criar outro"** → volta ao Home (limpa estado).

---

## 8. Estratégia de memória — trim-first, concat-later

**Problema:** iPhone Safari limita FFmpeg.wasm a ~500 MB-1 GB de working memory. Carregar 5 × 200 MB de inputs em simultâneo crasha.

**Solução:** pipeline sequencial em duas fases.

**Fase 1 — pré-trim (um clip de cada vez):**
- Para cada slot de vídeo: carrega input na WASM fs, extrai apenas o segmento necessário (`ffmpeg -ss <start> -t <duration> -i input.mp4 -c copy trimmed_N.mp4`), liberta o input. Output é pequeno (~5-15 MB).
- Fotos são convertidas para clips estáticos do mesmo tamanho (`ffmpeg -loop 1 -i photo.jpg -t <duration> -vf "scale=1080:1920,...” photo_N.mp4`).

**Fase 2 — assembly final:**
- Todos os trimmed_N.mp4 em memória simultânea (~30-70 MB total, confortável).
- `filter_complex` com:
  - Crop + scale para 1080×1920 (9:16) cada input.
  - LUT 3D aplicado via `lut3d=file=assets/luts/<template>.cube`.
  - Transições via `xfade` (fade/zoom) ou concat direto (hardcut).
  - `drawtext` com fonte e stroke se template tem texto.
- Output: `output.mp4` (H.264, sem áudio, 30fps, ~3-6 MB para 20s).

**Limites práticos:**
- Por ficheiro input: **200 MB hard limit** (rejeitado no Picker).
- Total combinado: até **~1 GB** (trim sequencial permite).
- Duração de vídeo input: sem limite rígido (só usamos N segundos).
- Resolução input: aceita até 4K; downscale acontece no assembly final.

**Trade-off aceite:** múltiplas invocações de FFmpeg adicionam ~15-20s ao export total vs pipeline single-shot, mas evita OOM e dá melhor granularidade de progresso.

---

## 9. Error handling

**Validação upfront:**
- Vídeo mais curto que slot → cartão vermelho + toast, bloqueia avanço.
- Formato não suportado (HEIC sem conversão, codecs raros) → try decode via `<video>`/`<img>`, se falha: mensagem "Este ficheiro não abre no browser".
- Ficheiro >200 MB → rejeita no Picker com toast.
- Texto Travel vazio → botão "Continuar" desactivado.

**Runtime durante export:**
- FFmpeg falha a carregar → overlay com mensagem + botão "Tentar de novo".
- OOM → catch exception, mensagem "Sem memória — fecha outras apps e tenta de novo" + **mantém selecções no estado**.
- FFmpeg non-zero exit sem mensagem → mensagem genérica + botão "Ver detalhes" (collapse com log completo).
- Export >3 min → aviso "Ainda a processar... deixa a app aberta".

**Sharing:**
- Web Share API indisponível → fallback com `<video>` + instrução "Toca e segura no vídeo → Guardar em Fotos".
- Share cancelado pelo user → sem feedback (stay on screen).

**Navegação:**
- Back/swipe mid-flow → `popstate` intercept + confirmação "Perdes as selecções. Continuar?".
- Orientation landscape → CSS força portrait com mensagem "Roda o telemóvel".
- Service Worker desactualizado → detecta `registration.waiting`, mostra banner "Nova versão — recarregar".

**Decisões conscientes de NÃO tratar:**
- Multi-tab sync (cada aba independente).
- Modo offline no primeiro uso (precisa descarregar FFmpeg).
- Recuperação após crash do browser (user recomeça).

---

## 10. Testing

**Unit (Vitest):**
- `ffmpeg-commands.test.js`: dado `(template, inputs, moments, text)`, assert que o array de comandos FFmpeg contém os filters e args corretos (lut3d, drawtext, xfade, scale, crop, durations).
- `templates.test.js`: cada template passa na validação do schema (slots não vazios, durations positivas, CSS filter string válida, LUT file exists).

**Integration (Vitest + ffmpeg nativo via `ffprobe-static`):**
- 1 test por template. Inputs: fixtures `short.mp4`, `wide.mp4`, `photo.jpg`. Corre pipeline completo. Valida:
  - Output é MP4 decodable por ffprobe.
  - Duração ≈ esperada (±0.2s).
  - Dimensões = 1080×1920.
  - 1 stream vídeo, 0 streams áudio.

**Manual smoke (checklist antes de cada commit significativo):**
- [ ] Carrega em Safari iOS viewport 390px sem erros console.
- [ ] Instala como PWA (manifest funcional, ícone no Ecrã Principal).
- [ ] Os 3 templates produzem outputs visualmente distinguíveis.
- [ ] Export de 20-30s completa em <2 min no iPhone real.
- [ ] Share Sheet abre e "Save Video" guarda nas Fotos.
- [ ] Back button / swipe não quebra estado.

**Fixtures (<5MB total, comitadas):**
- `short.mp4` — 10s, 1080×1920, H.264.
- `wide.mp4` — 8s, 1920×1080 (testa crop para portrait).
- `photo.jpg` — 1080×1920.

**CI (GitHub Actions):**
- Workflow em push: `npm test` (unit + integration). Badge no README.
- Deploy Pages em push para `main` se tests passam.

**Fora de scope:**
- E2E Playwright/Cypress em iOS Safari (ambiente frágil).
- Visual regression tests.
- Cross-browser (Firefox/Edge não testados explicitamente).
- Load/performance automated — medição pontual via DevTools Performance tab.

---

## 11. Deploy e CI/CD

**Repo:** GitHub `ripth/vibe-reels`.
**Branch strategy:** trunk-based, push direto para `main` (projecto solo).
**Hosting:** GitHub Pages, path `/vibe-reels/` no domínio `ripth.github.io`.
**Workflow:**
1. Push para `main` → GitHub Action corre `npm ci && npm test`.
2. Se pass → build (copia `src/`, `assets/`, `index.html`, `style.css`, `manifest.json`, `service-worker.js` para `dist/`).
3. Deploy `dist/` para `gh-pages` branch.
4. GitHub Pages serve automaticamente.

**Ambientes:** só produção (não há staging para MVP solo).

---

## 12. Riscos e mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| FFmpeg.wasm OOM no iPhone | Alta | Alto | Estratégia trim-first (§8); limite 200MB/ficheiro; mensagem clara em caso de erro |
| LUT 3D muito lento no FFmpeg.wasm | Média | Médio | Fallback para color curves simples (`curves=preset=...`) se o render demora >90s |
| Web Share API instável em iOS antigo | Baixa | Médio | Fallback com `<video>` + instrução manual "Toca e segura → Guardar" |
| CSS filter preview não representa bem o render final | Alta | Baixo | Aviso UI "Preview aproximado — export fica melhor"; afinar CSS filters para bater razoavelmente |
| FFmpeg.wasm bundle (~30 MB) demora a carregar em 4G | Alta | Baixo | Lazy-load só no Export; Service Worker cacheia para próximas vezes |
| iPhone antigo (ex: 11 ou mais velho) não aguenta o processamento | Média | Médio | Documentar requisitos mínimos: iPhone 13+ recomendado; deixar app tentar, mostrar erro se falha |

---

## 13. Open questions (para resolver durante implementação)

- **LUT 3D vs color curves:** testar ambos no FFmpeg.wasm. Se `lut3d` é muito lento, downgrade para `curves` preset custom por template.
- **Fonte "postcard" exacta:** escolher uma fonte serif royalty-free (candidatos: Playfair Display, Cormorant Garamond, Lora). Decidir na fase de implementação.
- **Ícone e splash screen da PWA:** criar ou usar gerador (ex: PWA Asset Generator). Decisão visual diferida para implementação.
- **Exact CSS filter tuning:** os valores no §6 são estimativas iniciais. Ajustar após testar visualmente com ficheiros reais do Mário.

---

## 14. Próximo passo

Invocar `superpowers:writing-plans` para transformar este design em plano de implementação sequencial e accionável.
