# K.skill

![K.skill workbench](assets/hero-chat-workbench.svg)

**K.skill convierte chats, personajes, recuerdos y modelos mentales en sistemas de persona de IA portátiles.**

Idiomas: [中文](README.md) · [English](README_EN.md) · [日本語](README_JA.md) · [한국어](README_KO.md) · **Español**

## Qué hace

- Pareja / memoria de relación
- Personaje original / mundo narrativo
- Mentor mental / modelos de decisión
- **Crush Coach**: analiza chats, señales, riesgos, temas y respuestas respetuosas

## Inicio rápido

```bash
git clone https://github.com/StartripAI/K_skill.git
cd K_skill
npm install
npm run build
npm run dev
```

Abre la URL local, normalmente `http://127.0.0.1:5173`.

## CLI

```bash
npm run cli -- pursue examples/crush-chat-en.txt --me Me --ta TA --goal ask_out
npm run cli -- reply examples/crush-chat-en.txt --latest "Then you should bring your suspiciously good cafe radar too." --me Me --ta TA
npm run cli -- init "Rain Archive" --type character --language es --out local-packs/rain-archive
npm run cli -- compile local-packs/rain-archive --target deepseek
```

## Seguridad

K.skill no es una herramienta de manipulación. No ayuda con PUA, presión, suplantación, acoso ni formas de ignorar un rechazo. Si la otra persona rechaza o se siente incómoda, solo sugiere respetar límites, disculparse o cerrar la conversación.
