<div align="center">

# K.skill

![K.skill film voice memory hero](assets/readme/hero-voice-memory-film-v3.png)

**Voz, chats, imágenes, personajes y memoria de relación convertidos en persona packs que puedes escuchar, conversar y llevar contigo.**<br>
**A voice-first place to keep chats, memories, characters, and Life Mentor packs alive locally.**

[中文](README.md) · [English](README_EN.md) · [日本語](README_JA.md) · [한국어](README_KO.md) · **Español**

</div>

Hay voces que quieres volver a oír, bromas que solo existen dentro de un chat, fotos con una expresión concreta, alguien que apareció en un sueño, o un personaje que todavía no tiene forma completa. Cuando lo reduces a una descripción corta, algo se pierde.

K.skill convierte esos fragmentos en persona packs locales que puedes volver a abrir y conversar. Puedes poner voice notes, chats, screenshots, arte de personajes, mundos narrativos, textos públicos o principios personales, y convertirlos en algo que puedes revisar, seguir hablando y exportar. El texto ordena lo que pasó; la voz devuelve la temperatura de ese momento.

Los comandos, samples y salidas que aparecen en este README son reales y se verifican. No son texto decorativo.

## Voice Memory: poner la voz dentro de la persona

![K.skill voice memory flow](assets/readme/voice-memory-anime-v3.png)

Muchas veces no recordamos solo la frase, sino cómo sonaba.<br>
Una pausa, una risa, una muletilla, una respuesta que llega medio segundo tarde, una voz que de pronto se ablanda. Esos detalles pueden traer a una persona con más fuerza que una página de notas. También pasa con alguien que apareció en un sueño, o con un personaje que todavía existe solo en una imagen. Cuando hay sensación de voz, la conversación se acerca.

K.skill pone Voice Memory como entrada principal. El audio primero se convierte en transcript revisable; después se asienta como voice DNA, chat rhythm, relationship memory, tono de personaje y archivos exportables. Puedes empezar con una sola voice note, o mezclar voz con chats, imágenes, stickers, PDFs y video transcripts.

| Lo que quieres hacer | Qué agregas | Qué construye K.skill |
|---|---|---|
| Extrañar a alguien | voice notes, chats antiguos, fotos, momentos compartidos | voice DNA, relationship memory, chat rhythm, persona pack que puedes volver a abrir |
| Dar forma a alguien que viste en un sueño | descripción, character image, line audio, world notes | original character con sensación de voz y espacio narrativo |
| Revisar una relación con calma | old voice clips, screenshots, timeline, memory notes | Relationship Memory que puedes leer, escuchar, revisar y exportar |
| TA manda una voice note | TA voice note, chat reciente, tu objetivo | ASR transcript, tone read, warmth signals, 3 borradores editables |
| Crear un Movie / Virtual Character | character art, dialogue, voice reference, scene cards | voice profile, visual style, sticker intents, full export bundle |

Empieza con los samples incluidos y luego conecta tu propio local voice engine:

```bash
npm run cli -- transcribe tests/fixtures/media/voice-note-en.wav --provider stub-asr --language en --out tmp/transcript.json
npm run cli -- import tests/fixtures/media/voice-note-en.wav --type pursuit --media --provider stub-asr --pack local-packs/voice-crush
npm run cli -- speak local-packs/voice-crush --text "Keep it light and natural." --provider stub-tts --out tmp/voice-preview.wav

KSKILL_LOCAL_TTS_COMMAND="node examples/local-voice-engine.mjs" \
  npm run cli -- speak local-packs/voice-crush \
  --text "I still remember how you said that." \
  --provider local-voice-clone \
  --reference-audio tests/fixtures/media/voice-note-en.wav \
  --out tmp/memory-voice.wav
```

`local-voice-clone` envía `text`, `voice`, `language`, `referenceAudioPath`, `voiceProfilePath` y `outFile` a tu local voice engine por stdin JSON. El motor escribe audio en `outFile`; K.skill lo trae de vuelta a GUI, CLI y exports.

## Primero, 6 escenas

![K.skill six social persona scenes](assets/readme/persona-scenes-social-v3.png)

K.skill no es solo una caja de chat. Tiene seis entradas claras.

| Escena | Qué subes | Qué devuelve K.skill |
|---|---|---|
| Crush Coach | tu chat con TA | señales sociales, próximo paso, 3 respuestas naturales |
| Relationship Memory | chats, recuerdos, correcciones | memory pack de relación con contexto largo |
| Anime Character | OC sheets, world notes, dialogue samples | character identity, voice, lorebook, entrada de chat |
| Movie Character | script fragments, scene cards, biography | personaje de cine virtual con arc y scene memory |
| Virtual Persona | AI companion brief, avatar notes, NPC design | original persona estable para chat |
| Public-Figure Life Mentor | articles, interviews, launches, notes | thinking model basado en material público |

Por ejemplo, textos, interviews, launches y notes públicos de una persona pueden convertirse en un Life Mentor para revisar product judgment, writing, tradeoffs, launch thinking y decision review.

## Primero, una escena DM

![K.skill Crush Coach Reply Lab](assets/readme/crush-coach-reply-lab.png)

TA responde y dudas si contestar ya, esperar, invitar o cambiar de tema. Crush Coach convierte esa duda en social signals legibles y propone una frase que cabe en el momento.

```text
TA: Maybe this weekend. Do you like this kind of exhibition too?

K.skill lee:
- relationship stage: warm
- warmth: TA pregunta de vuelta y deja abierto el tema de la exposición
- risk: el momento todavía pide tono ligero
- evidence: question, interest topic, relaxed tone
- confidence: 0.76
- rhythm: responder ligero y dejar aire a la conversación

Reply Lab:
Safe: That actually made me curious. Which part would you recommend for someone going in fresh?
Light: You sound way more animated when you talk about this exhibit. I am taking notes, promise not to ask too many beginner questions.
Slightly forward: Low-pressure idea: if you feel like going one day, call me. I will keep my amateur commentary under control.
```

Cuando la conversación se enfría, K.skill no empuja. Ayuda a cerrar con cuidado, pausar o volver después con un tema más ligero.

## Cuatro Workflows

| Workflow | Para quién | Entrada | Salida | Cuándo usarlo |
|---|---|---|---|---|
| **Crush Coach** | Personas que quieren comunicarse naturalmente con TA | export de app de mensajería, pasted chat logs | `pursuit_report.md`, `topic_plan.md`, 3 respuestas, send-or-not | Cuando dudas cómo responder, invitar o pausar |
| **Relationship Memory** | Personas que ordenan material de pareja, amistad, ex o relación cercana | chats, recuerdos compartidos, correcciones | memoria de relación, patrones de trato, episodios, tono, exportable persona pack | Revisión de relación, contexto largo, escritura, narrativa interactiva |
| **Character World** | Creadores de OC, usuarios 2D, roleplay, juegos y cine | Markdown, character card, lorebook, Movie Character notes | identidad, reglas de mundo, Prompt Stack, character card, lorebook | Cuando el personaje necesita memoria y reglas, no solo muletillas |
| **Life Mentor** | Personas que convierten textos públicos y principios en modelo de pensamiento | artículos, entrevistas, notas públicas, decisiones, principios | mental models, heuristics, anti-patterns, evidence, confidence, honesty notes | Decisiones, revisión, sistema personal, pensamiento asistido |

Elige el carril según lo que quieres conseguir:

- **Crush Coach** es para responder, leer timing y mover la conversación de forma natural.
- **Relationship Memory** es para ordenar recuerdos compartidos, textura emocional y contexto largo.
- **Character World** es para anime OCs, roles ficticios, Movie Character, lorebooks y roleplay cards.
- **Life Mentor** convierte material público y notas propias en un modelo de pensamiento al que puedes preguntar.

## Voice Studio

K.skill no es un lector de texto. En el mismo intake puedes subir **voice note**, grabación, screenshot, image, sticker, notas de emoji, PDF, video transcript y mixed ZIP.
Primero hace **multimodal import**: el texto pasa a chat turns, el audio pasa por **ASR** y queda como transcript evidence, image / screenshot / PDF / video transcript se guarda como media evidence, y los stickers se ordenan como **sticker intents**. Crush Coach, Relationship Memory, Character World y Life Mentor leen ese mismo hilo de evidence.

CLI:

```bash
npm run cli -- transcribe tests/fixtures/media/voice-note-en.wav --provider stub-asr --language en --out tmp/transcript.json
npm run cli -- import tests/fixtures/media/voice-note-en.wav --type pursuit --media --provider stub-asr --pack local-packs/voice-crush
npm run cli -- speak local-packs/voice-crush --text "Keep it light and natural." --provider stub-tts --out tmp/voice-preview.wav
npm run cli -- voice-profile local-packs/voice-crush
```

GUI:

1. En `DM intake`, elige `Files / Paste / Record / Media`.
2. Sube chat log, voice note, screenshot, sticker, PDF, video transcript o ZIP.
3. Usa `Record` para grabar una voice note corta y mandarla a Reply Lab después de ASR.
4. `Parse preview` muestra messages, assets, transcripts, reactions y attachment kinds.
5. `Persona Voice` guarda voice DNA, TTS preview, visual style y sticker intents dentro del export.

## Crush Coach

Crush Coach empieza en “¿qué respondo ahora?”. Analiza relationship stage, warmth signals, risk signals, topic windows, date readiness y chat rhythm para separar cuándo avanzar, cuándo aflojar y cuándo dejar aire.

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

Relationship Memory convierte material de relación en contexto largo que puedes revisar después. Sirve para episodios compartidos, formas de llamarse, preferencias, corrections, cosas que se dijeron de más, cosas que no se dijeron y pequeños detalles de ambiente, sin forzar una historia donde no la hay.

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
- tone and memory notes
- exportable persona pack files

## Character World

![K.skill anime character world](assets/readme/anime-character-world.png)

Character World es para fictional characters, original characters, OCs estilo anime, worldbuilding, lorebooks y character cards. Mantiene en el mismo pack quién es el personaje, qué reglas tiene su mundo, qué recuerdos lo activan y con qué voice rhythm habla.

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
- character card JSON
- lorebook entries
- manual tone notes

Salidas:

- `persona.yaml`
- `persona.md`
- `memory.lorebook`
- `Prompt Stack`
- supported persona format bundles

## Movie Character

![K.skill movie character pack](assets/readme/movie-character-pack.png)

Movie Character es el uso de Character World para convertir una figura de guion en alguien con quien se puede hablar. Si subes script fragments, scene cards, character arcs y dialogue samples, K.skill conserva arco, memoria de escena y ritmo de fraseo en una versión chat del personaje.

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

La salida incluye character identity, arc, scene memory, voice rhythm, source notes, character card y lorebook.

## Virtual Persona

![K.skill virtual persona chat](assets/readme/virtual-persona-chat.png)

Virtual Persona sirve para crear AI companions, virtual streamer personas, game NPCs, social avatars y product characters desde tu propio brief. No busca copiar a alguien real: sirve para estabilizar una original persona con voz, distancia, memoria y hábitos de respuesta.

GUI:

1. Elige `Character`.
2. Sube o pega el persona brief.
3. Confirma source preview.
4. Importa y destila.
5. Revisa identity, voice, memory y rhythm en Prompt Stack.
6. Exporta al cliente objetivo.

CLI:

```bash
npm run cli -- init "Nova Social" --type character --language en --out local-packs/nova-social
npm run cli -- import examples/character-world.md --type character --pack local-packs/nova-social
npm run cli -- compile local-packs/nova-social --target lobe --out local-packs/nova-social/exports/lobe
```

## Life Mentor

![K.skill life mentor model](assets/readme/life-mentor-model.png)

Life Mentor convierte public writing, interviews, personal notes, decision records y principles en un compañero de pensamiento conversable. Extrae hábitos de razonamiento, estilo de comunicación, patrones de decisión y tradeoffs con evidencia a la vista.

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
- honesty notes

public figures y celebrities funcionan bien como Life Mentor models basados solo en material público. Junta interviews, articles, launches, talks y notes; luego pregunta sobre product judgment, writing, choices y tradeoffs desde esa base documental.

## Persona Pack

Un persona pack es la carpeta de personalidad que queda al final. Guarda voz, memoria, fuentes y razones de las decisiones en el mismo lugar, para que puedas volver después y ver de dónde salió cada cosa.

```text
persona.yaml          structured persona pack
persona.md            readable persona description
sources/              imported material
memory/               episodes, corrections, lorebook
distillation/         evidence, claims, contradictions, runs
exports/              target-specific files
```

Prompt Stack evita que el pack sea una caja negra:

```text
identity       role, voice, expression DNA
mental_models  Life Mentor or character reasoning models
memory         profile facts, relationship facts, episodes
rhythm         relationship pacing, tone, reply feel, conversation texture
export layer   target platform format
```

## GUI

Para empezar, la GUI es el camino más directo: arrancas localmente, subes material, revisas preview y luego guardas el pack.

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
GET  /api/voice/providers
POST /api/voice/asr
POST /api/voice/tts
POST /api/packs/:id/pastes
POST /api/packs/:id/pursuit
POST /api/packs/:id/replies
GET  /api/reports/:reportId/download
POST /api/packs/:id/exports
GET  /api/exports/:exportId/download
GET  /api/packs/:id/assets
GET  /api/packs/:id/assets/:assetId/download
GET  /api/packs/:id/memory
PATCH /api/packs/:id/memory
```

## CLI

Para desarrollo, lotes y automatización, usa CLI. Los comandos de esta sección coinciden con package scripts y comandos implementados.

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
npm run cli -- send-or-not examples/crush-chat-en.txt --draft "Want to go together this weekend?" --latest "Maybe, I might go this weekend."
```

Export:

```bash
npm run cli -- compile local-packs/my-pack --target codex --out local-packs/my-pack/exports/codex
npm run cli -- export-zip local-packs/my-pack --target sillytavern --out local-packs/my-pack/exports/sillytavern.zip
```

## Export To Real Tools

![K.skill export matrix](assets/readme/export-matrix.png)

Un mismo persona pack puede exportarse al formato que espera cada destino.

| Target | Files | Uso |
|---|---|---|
| Skill folder | `SKILL.md`, `references/persona.md`, `references/memory.md`, `references/evidence.json` | Coloca el directorio exportado en tu ruta local de skills |
| Instruction bundle | `instructions.md`, `knowledge/`, config JSON | Úsalo como instructions y knowledge de la persona |
| API context | `system-prompt.json`, `api-request.json` | Úsalo como system context o request template |
| Character card | character card JSON, lorebook JSON | Importa card y lorebook en entornos compatibles |
| Soul archive | `SOUL.md`, `skills/` | Usa `SOUL.md` como identidad principal |
| Agent JSON | agent / model JSON | Importa en entornos locales o self-hosted que acepten JSON config |

```bash
npm run check:exports
```

## Privacy And Feel

K.skill is local-first. Private chats stay outside the repository. El contenido se queda en tu máquina salvo que configures explícitamente un provider externo.

K.skill sirve para:

- leer el ambiente de un chat
- ordenar relationship memory
- dar forma a alguien de un sueño o crear original characters
- sostener el mundo de una Virtual Persona o un Movie Character
- convertir public material en Life Mentor
- exportar el mismo pack a formatos de persona comunes
- mostrar evidence y confidence

Las decisiones intentan quedar explicadas: por qué esa respuesta, por qué conviene esperar, de qué fuente salió una idea del Life Mentor y cuánta confianza merece.

## Development And Verification

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

`npm run verify` ejecuta la cadena local de calidad anterior en orden fijo, con build, exports, README checks, e2e, smoke, scoring y un package dry-run. README checks exige cinco idiomas, images, commands, targets, Life Mentor naming, product concepts y K.skill-only positioning.

## License

Apache-2.0
