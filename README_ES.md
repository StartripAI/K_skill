<div align="center">

# K.skill

![K.skill complete persona system](assets/readme/hero-persona-workbench.png)

**K.skill turns chats, characters, memories, crushes, and minds into portable AI persona systems.**

[中文](README.md) · [English](README_EN.md) · [日本語](README_JA.md) · [한국어](README_KO.md) · **Español**

</div>

K.skill es un **Persona Pack OS** local-first y un sistema de persona completo que se puede usar de verdad. Convierte chats, material de relación, personajes originales, Movie Character, mundos narrativos, textos públicos y principios personales en persona packs inspeccionables, testeables y exportables. La GUI cubre subida, parseo, reportes, Reply Lab y descargas. La CLI compila el mismo pack para Codex, Claude, ChatGPT, DeepSeek, SillyTavern, Hermes, LobeChat y Open WebUI.

Cada capacidad escrita aquí tiene comando real, ejemplo real, salida real y puerta de verificación. No es una capa vacía de prompts.

## Primero, una escena DM

![K.skill Crush Coach Reply Lab](assets/readme/crush-coach-reply-lab.png)

TA responde y no sabes si continuar, esperar, invitar o cambiar de tema. Crush Coach convierte el chat en señales sociales legibles, no en guiones manipuladores.

```text
TA: Maybe this weekend. Do you like this kind of exhibition too?

K.skill lee:
- relationship stage: warm
- warmth: TA pregunta de vuelta y deja abierto el tema de la exposición
- risk: no hay rechazo explícito ni incomodidad en los últimos turnos
- evidence: question, interest topic, relaxed tone
- confidence: 0.76
- safety: no impersonation, no pressure after refusal

Reply Lab:
Safe: That actually made me curious. Which part would you recommend for someone going in fresh?
Light: You sound way more animated when you talk about this exhibit. I am taking notes, promise not to ask too many beginner questions.
Slightly forward: Low-pressure idea: if you feel like going one day, call me. I will keep my amateur commentary under control.
```

Si el chat muestra rechazo claro, incomodidad o una petición de parar, K.skill no genera estrategias de avance. Solo da cierre respetuoso, disculpa, respeto de límites y revisión personal.

## Cuatro Workflows

![K.skill GUI workflow](assets/readme/web-gui-flow.png)

| Workflow | Para quién | Entrada | Salida | Cuándo usarlo |
|---|---|---|---|---|
| **Crush Coach** | Personas que quieren comunicarse naturalmente con TA | WeChat, QQ, iMessage, Telegram, WhatsApp, pasted chat logs | `pursuit_report.md`, `topic_plan.md`, 3 respuestas, send-or-not | Cuando dudas cómo responder, invitar o pausar |
| **Relationship Memory** | Personas que ordenan material de pareja, amistad, ex o relación cercana | chats, recuerdos compartidos, correcciones | memoria de relación, patrones de trato, episodios, límites, exportable persona pack | Revisión de relación, contexto largo, escritura, narrativa interactiva |
| **Character World** | Creadores de OC, usuarios 2D, roleplay, juegos y cine | Markdown, character card, lorebook, Movie Character notes | identidad, reglas de mundo, Prompt Stack, SillyTavern card, lorebook | Cuando el personaje necesita memoria y reglas, no solo muletillas |
| **Life Mentor** | Personas que convierten textos públicos y principios en modelo de pensamiento | artículos, entrevistas, notas públicas, decisiones, principios | mental models, heuristics, anti-patterns, evidence, confidence, honesty boundaries | Decisiones, revisión, sistema personal, pensamiento asistido |

Las fronteras son claras:

- **Crush Coach** maneja avance respetuoso de relación y no evita rechazos.
- **Relationship Memory** guarda y audita contexto largo de relación; no genera estrategia de conquista.
- **Character World** maneja personajes ficticios, mundos originales, Movie Character y roleplay cards; no suplanta personas reales.
- **Life Mentor** convierte material público y notas propias en modelo de pensamiento; no dice ser una persona real.

## Crush Coach

![K.skill Crush Coach social flow](assets/readme/crush-coach-reply-lab.png)

Crush Coach analiza relationship stage, warmth signals, risk signals, topic windows, date readiness y boundaries.

GUI:

1. Inicia la GUI local con `npm run dev` o `npm run cli -- serve --port 5999`.
2. Elige `Crush Coach`.
3. Sube un chat o pega la conversación reciente.
4. Define nombres para `me` y `TA`.
5. Elige goal: break ice, continue chat, judge chance, ask out, recover cold chat, write reply.
6. Pulsa `Run lab`.
7. Descarga `pursuit_report.md`, revisa `Reply Lab` y lee `topic_plan.md`.

CLI:

```bash
npm run cli -- pursue examples/crush-chat-en.txt --me Me --ta TA --goal judge_chance --out tmp/pursuit-en
npm run cli -- reply examples/crush-chat-en.txt --latest "Maybe, I might go this weekend." --me Me --ta TA --style gentle
npm run cli -- topics examples/crush-chat-en.txt --me Me --ta TA
npm run cli -- send-or-not examples/crush-chat-en.txt --draft "Want to go together?" --latest "Maybe, I might go this weekend."
```

Escenarios incluidos:

```text
examples/crush-chat-zh.txt       progresión cálida en chino
examples/crush-chat-en.txt       continuación natural en inglés
examples/refusal-chat-en.txt     rechazo claro; solo cierre
examples/cold-chat-zh.txt        conversación fría; decidir si esperar
```

Archivos generados:

```text
tmp/pursuit-en/
  pursuit_report.md
  pursuit_report.json
  topic_plan.md
```

Cada juicio fuerte debe traer `evidence` y `confidence`. Si la evidencia es débil, el sistema lo muestra.

## Relationship Memory

![K.skill relationship memory](assets/readme/relationship-memory-chat.png)

Relationship Memory convierte material de relación en contexto largo auditable. Sirve para episodios compartidos, formas de llamarse, preferencias, corrections y boundaries. No clona a una persona real.

GUI:

1. Elige `Relationship`.
2. Sube `examples/relationship-memory-chat.txt` o tu propio material.
3. Confirma speakers, message count, language y preview.
4. Guarda en el local vault.
5. Inspecciona Prompt Stack o memory state.
6. Exporta el pack cuando esté listo.

CLI:

```bash
npm run cli -- init "Rain Bookstore Memory" --type relationship --language zh --out local-packs/rain-bookstore
npm run cli -- import examples/relationship-memory-chat.txt --type relationship --pack local-packs/rain-bookstore
npm run cli -- memory local-packs/rain-bookstore
npm run cli -- inspect local-packs/rain-bookstore
```

Salidas:

- shared memory episodes
- relationship facts and address patterns
- preferences and corrections
- no impersonation boundaries
- exportable persona pack files

## Character World

![K.skill anime character world](assets/readme/anime-character-world.png)

Character World es para fictional characters, original characters, OCs estilo anime, worldbuilding, lorebooks y character cards. Mantiene identity, world rules, memory triggers, voice rhythm y safety boundaries en el mismo pack.

CLI:

```bash
npm run cli -- init "Rain Archive" --type character --language zh --out local-packs/rain-archive
npm run cli -- import examples/character-world.md --type character --pack local-packs/rain-archive
npm run cli -- distill local-packs/rain-archive
npm run cli -- inspect local-packs/rain-archive
```

Entradas útiles:

- original character sheets
- worldbuilding Markdown
- dialogue samples
- SillyTavern Character Card V2
- lorebook entries
- manual boundaries

Salidas:

- `persona.yaml`
- `persona.md`
- `memory.lorebook`
- `Prompt Stack`
- real client export bundles

## Movie Character

![K.skill movie character pack](assets/readme/movie-character-pack.png)

Movie Character es un caso concreto de Character World para personajes de cine originales, roles de guion, scene cards, character arcs y dialogue samples. No copia personajes protegidos, no imita actores y no reclama celebrity identity.

CLI:

```bash
npm run cli -- init "Mira Vale" --type character --language en --out local-packs/mira-vale
npm run cli -- import examples/movie-character.md --type character --pack local-packs/mira-vale
npm run cli -- compile local-packs/mira-vale --target sillytavern --out local-packs/mira-vale/exports/sillytavern
npm run cli -- export-zip local-packs/mira-vale --target chatgpt --out local-packs/mira-vale/exports/chatgpt.zip
```

Entradas:

- script fragments
- character biography
- scene cards
- dialogue samples
- relationship map in text form
- public-domain or licensed material

La salida incluye character identity, arc, scene memory, voice rhythm, copyright / real-person boundaries, SillyTavern card y lorebook.

## Virtual Persona

![K.skill virtual persona chat](assets/readme/virtual-persona-chat.png)

Virtual Persona sirve para AI companions originales, virtual streamer personas, game NPCs, social avatars y product characters. Se diferencia de Relationship Memory porque no representa una relación real ni una private person.

GUI:

1. Elige `Character`.
2. Sube o pega el persona brief.
3. Confirma source preview.
4. Importa y destila.
5. Revisa identity, voice, memory y boundaries en Prompt Stack.
6. Exporta al cliente objetivo.

CLI:

```bash
npm run cli -- init "Nova Social" --type character --language en --out local-packs/nova-social
npm run cli -- import examples/character-world.md --type character --pack local-packs/nova-social
npm run cli -- compile local-packs/nova-social --target lobe --out local-packs/nova-social/exports/lobe
```

## Life Mentor

![K.skill life mentor model](assets/readme/life-mentor-model.png)

Life Mentor convierte public writing, interviews, personal notes, decision records y principles en un compañero de pensamiento. Modela hábitos de razonamiento y estilo de comunicación; no se convierte en una persona real.

CLI:

```bash
npm run cli -- init "Decision Life Mentor" --type advisor --language en --out local-packs/decision-life-mentor
npm run cli -- import examples/life-mentor-source.md --type advisor --pack local-packs/decision-life-mentor
npm run cli -- distill local-packs/decision-life-mentor
npm run cli -- inspect local-packs/decision-life-mentor
```

Life Mentor extrae:

- expression DNA
- mental models
- heuristics
- anti-patterns
- contradictions
- evidence / confidence
- honesty boundaries

public figures y celebrities se tratan solo como Life Mentor models basados en material público. K.skill no crea recognizable real-person substitute, no inventa private facts y no afirma ser esa persona.

## Persona Pack

```text
persona.yaml          structured persona pack
persona.md            readable persona description
sources/              imported material
memory/               episodes, corrections, lorebook
distillation/         evidence, claims, contradictions, runs
exports/              target-specific files
```

Prompt Stack:

```text
identity       role, voice, expression DNA
mental_models  Life Mentor or character reasoning models
memory         profile facts, relationship facts, episodes
boundaries     no impersonation, no pressure after refusal, safety limits
export layer   target platform format
```

## GUI

![K.skill local GUI flow](assets/readme/web-gui-flow.png)

```bash
npm install
npm run build
npm run cli -- serve --port 5999
```

Abre la URL local impresa, normalmente `http://127.0.0.1:5999`.

GUI flow:

1. Elige Crush Coach, Relationship Memory, Character World o Life Mentor.
2. Escribe pack name y language.
3. Upload o paste.
4. Confirma consent / privacy.
5. Lee parse preview.
6. En Crush Coach, ejecuta Run lab.
7. Descarga report markdown.
8. Exporta zip para el cliente objetivo.

Local API:

```text
GET  /api/health
GET  /api/packs
POST /api/imports
POST /api/packs/:id/pastes
POST /api/packs/:id/pursuit
GET  /api/reports/:reportId/download
POST /api/packs/:id/exports
GET  /api/exports/:exportId/download
GET  /api/packs/:id/memory
PATCH /api/packs/:id/memory
```

## CLI

```bash
npm run cli -- --help
npm run cli -- init "My Pack" --type relationship --language en --out local-packs/my-pack
npm run cli -- import examples/relationship-memory-chat.txt --type relationship --pack local-packs/my-pack
npm run cli -- distill local-packs/my-pack
npm run cli -- inspect local-packs/my-pack
npm run cli -- memory local-packs/my-pack
npm run cli -- eval local-packs/my-pack
```

Crush Coach:

```bash
npm run cli -- pursue examples/crush-chat-en.txt --me Me --ta TA --goal judge_chance --out tmp/pursuit-en
npm run cli -- reply examples/crush-chat-en.txt --latest "Maybe, I might go this weekend." --me Me --ta TA --style gentle
npm run cli -- topics examples/cold-chat-zh.txt --me 我 --ta TA
npm run cli -- send-or-not examples/refusal-chat-en.txt --draft "Please give me one more chance." --latest "Please stop asking."
```

Export:

```bash
npm run cli -- compile local-packs/my-pack --target codex --out local-packs/my-pack/exports/codex
npm run cli -- export-zip local-packs/my-pack --target sillytavern --out local-packs/my-pack/exports/sillytavern.zip
```

## Export To Real Tools

![K.skill export matrix](assets/readme/export-matrix.png)

| Target | Files | Uso |
|---|---|---|
| Codex | `SKILL.md`, `references/persona.md`, `references/memory.md`, `references/evidence.json` | Coloca el directorio exportado en tu ruta de skills |
| Claude | `SKILL.md`, `references/` | Instala como skill de Claude Code |
| ChatGPT | `instructions.md`, `knowledge/`, `gpt-config.json` | Pega instructions en GPT o Project y sube knowledge |
| DeepSeek | `system-prompt.json`, `api-request.json` | Úsalo como system context o request template |
| SillyTavern | `character-card-v2.json`, `lorebook.json` | Importa card y lorebook |
| Hermes | `SOUL.md`, `skills/` | Usa `SOUL.md` como identidad principal |
| LobeChat | `lobe-agent.json` | Importa el agent JSON |
| Open WebUI | `openwebui-agent.json` | Importa agent/model JSON |

```bash
npm run check:exports
```

## Privacy And Safety

K.skill is local-first. Private chats do not enter Git. El contenido solo sale de tu máquina si configuras explícitamente un provider externo.

Reglas:

- no impersonation
- no pressure after refusal
- no coercive tactics
- no privacy extraction
- no stalking, harassment, or boundary bypass
- no invented private facts
- low evidence means low confidence

Si TA rechaza, K.skill solo permite closing, apology, stopping escalation, respecting space y self-review.

## Development And Verification

![K.skill complete product workbench](assets/readme/hero-persona-workbench.png)

```bash
git clone https://github.com/StartripAI/K_skill.git
cd K_skill
npm install
npm run build
npm run dev
npm run cli -- --help
```

Quality gate:

```bash
npm run lint
npm test
npm run check:readme
npm run check:exports
npm run test:e2e
npm run smoke
npm run score:release
npm run verify
```

`npm run verify` ejecuta lint, tests, build, exports, README checks, e2e, smoke, release scoring y npm pack dry-run. README checks exige cinco idiomas, images, commands, targets, Life Mentor naming, safety y no outside comparison claims.

## License

Apache-2.0
