<div align="center">

# K.skill

![K.skill social persona system](assets/hero-chat-workbench.svg)

**K.skill convierte chats, personajes, recuerdos, conversaciones con crushes y modelos mentales en sistemas de persona de IA portátiles.**

Idiomas: [中文](README.md) · [English](README_EN.md) · [日本語](README_JA.md) · [한국어](README_KO.md) · **Español**

</div>

<p align="center">
  <img src="assets/readme-dm-flow.svg" width="32%" alt="DM flow">
  <img src="assets/prompt-stack-social.svg" width="32%" alt="Prompt Stack inspector">
  <img src="assets/persona-export-matrix.svg" width="32%" alt="Export matrix">
</p>

## Qué Es K.skill

K.skill es un **Persona Pack OS** local-first. Importa historiales de chat, memorias de relación, notas de personajes originales, tarjetas de SillyTavern, textos públicos, material de mentores y notas personales. Luego los convierte en persona packs inspeccionables, testeables y exportables.

La primera experiencia se parece más a una app social que a una herramienta de bajo nivel: historias, DM, tarjetas de respuesta, temperatura de relación, evidence, confidence y exportaciones antes de entrar en schema o CLI.

```text
subir o pegar material -> parsear -> destilar -> memoria -> Prompt Stack -> eval -> exportar -> probar en chat
```

Flujos principales:

- **Crush Coach**: analiza señales de chat y propone respuestas respetuosas.
- **Memoria de relación**: conserva experiencias compartidas, formas de llamarse, límites y episodios.
- **Personaje / mundo narrativo**: compila OCs, Markdown de mundo y Character Cards de SillyTavern.
- **Mentor mental / modelo propio**: destila ADN expresivo, modelos mentales, heurísticas, antipatrones y límites de honestidad.

## Inicio Rápido

```bash
git clone https://github.com/StartripAI/K_skill.git
cd K_skill
npm install
npm run build
npm run dev
```

Abre la URL local que muestra Vite. Normalmente es `http://127.0.0.1:5173`.

CLI:

```bash
npm run cli -- --help
```

Prueba local como comando global:

```bash
npm link
kskill --help
```

## Crush Coach en 5 Minutos

Analiza un chat:

```bash
npm run cli -- pursue examples/crush-chat-en.txt --me Me --ta TA --goal ask_out --out pursuit-output
```

Archivos generados:

```text
pursuit-output/
  pursuit_report.md
  topic_plan.md
```

Genera tres respuestas listas para enviar:

```bash
npm run cli -- reply examples/crush-chat-en.txt --latest "Then you should bring your suspiciously good cafe radar too." --me Me --ta TA --style natural
```

Genera un plan de temas:

```bash
npm run cli -- topics examples/crush-chat-en.txt --me Me --ta TA
```

Escenario con rechazo:

```bash
npm run cli -- pursue examples/refusal-chat-en.txt --me Me --ta TA --goal recover_cold_chat
```

Si la otra persona rechaza o expresa incomodidad, K.skill solo propone respetar el límite, disculparse brevemente, cerrar la conversación o reflexionar. No ofrece tácticas de presión.

## Reply Lab

Reply Lab es el laboratorio de respuestas estilo DM. Lee el último mensaje y el contexto del chat, luego devuelve tres borradores enviables con:

- etiqueta como safe, playful, sincere, restrained, direct o gentle;
- por qué encaja con la etapa actual;
- efecto esperado;
- nota de riesgo;
- `boundarySafe: true`.

El objetivo no es controlar a otra persona. Es expresar una intención real con menos ambigüedad, menos presión y más respeto.

## Crear Un Persona Pack

```bash
npm run cli -- init "Rain Archive" --type character --language es --out local-packs/rain-archive
npm run cli -- import examples/character-world.md --type character --pack local-packs/rain-archive
npm run cli -- distill local-packs/rain-archive
```

Inspecciona Prompt Stack, memoria y checks:

```bash
npm run cli -- inspect local-packs/rain-archive
npm run cli -- memory local-packs/rain-archive
npm run cli -- eval local-packs/rain-archive
```

Estructura:

```text
persona.yaml
persona.md
sources/
memory/
  state.json
  episodes.jsonl
  lorebook.json
distillation/
  evidence.jsonl
  claims.jsonl
  contradictions.md
exports/
```

## Prompt Stack, Evidence y Confidence

K.skill trata la persona como una pila de capas, no como un prompt largo sin estructura.

- **Identity**: rol, voz, ADN expresivo, usos permitidos.
- **Memory**: episodios, hechos de relación, preferencias, correcciones, lorebook.
- **Mental models**: criterios de decisión, heurísticas, antipatrones.
- **Evidence**: quote, claim, source id, kind, confidence.
- **Safety**: no suplantación, no presión después de un rechazo, no inventar hechos privados.
- **Export layer**: instrucciones específicas para cada cliente.

Cuando la evidencia es débil, el sistema mantiene incertidumbre en lugar de convertir una inferencia en hecho.

## Exportaciones

```bash
npm run cli -- compile local-packs/rain-archive --target codex
npm run cli -- compile local-packs/rain-archive --target claude
npm run cli -- compile local-packs/rain-archive --target chatgpt
npm run cli -- compile local-packs/rain-archive --target deepseek
npm run cli -- compile local-packs/rain-archive --target sillytavern
npm run cli -- compile local-packs/rain-archive --target hermes
npm run cli -- compile local-packs/rain-archive --target lobe
npm run cli -- compile local-packs/rain-archive --target openwebui
```

| Destino | Salida |
|---|---|
| Codex | `SKILL.md` y `references/` |
| Claude Code | `SKILL.md` y `references/` |
| ChatGPT | `instructions.md` y `knowledge/` |
| DeepSeek / APIs compatibles con OpenAI | `system-prompt.json` |
| SillyTavern | Character Card V2 JSON y lorebook |
| Hermes | `SOUL.md` y skills |
| LobeChat | agent JSON |
| Open WebUI | agent JSON |

## Mejoras Frente a la Base

| Área | Base existente | Mejora de K.skill |
|---|---|---|
| `ex-skill` | memoria de relación, tono, experiencias compartidas | etapa de relación, señales de calidez/riesgo, Reply Lab, Crush Coach con límites primero |
| `nuwa-skill` | modelos mentales, ADN expresivo, límites de honestidad | un mismo pack para mentores, personajes, uno mismo, parejas y amistades |
| ST memory | memoria estructurada de largo plazo | evidence, confidence, correcciones, evals e inspección de Prompt Stack |
| SillyTavern | Character Cards y lorebooks maduros | no queda encerrado en un cliente; exporta a Codex, Claude, ChatGPT, DeepSeek, SillyTavern, Hermes, LobeChat y Open WebUI |

## Seguridad y Límites

- Local-first por defecto.
- No comites chats privados en Git.
- No PUA, juegos de celos, presión, bypass de rechazo, stalking ni suplantación.
- No simules a una persona privada real sin consentimiento.
- Si aparece rechazo o incomodidad, se detiene la escalada.
- Antes de exportar a herramientas externas, confirma que tienes derecho a usar el material.

## Desarrollo

```bash
npm install
npm run lint
npm test
npm run build
```

## License

MIT
