# ČVUT Marasty - Příprava na rozstřely

![PWA Ready](https://img.shields.io/badge/PWA-Ready-black?style=flat-square) ![Offline Support](https://img.shields.io/badge/Offline-Supported-brightgreen?style=flat-square) ![Next.js](https://img.shields.io/badge/Next.js-15-blue?style=flat-square&logo=nextdotjs) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript) ![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react) ![License MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)

Webová aplikace pro přípravu na rozstřely na FIT ČVUT. Tento repozitář neobsahuje žádné otázky, ty si musíte vytvořit sami a přidat si je do aplikace pomocí odkazu nebo lokálního souboru.

## Struktura JSON souboru s otázkami

Aplikace očekává JSON v následujícím formátu:

```json
{
  "metadata": {
    "version": "1.2.0",
    "syntax": "1.0.0",
    "generatedAt": "2026-01-14T12:00:00Z",
    "hash": "a1b2c3d4",
    "repository": "https://github.com/skopevoj/cvut-marasty"
  },
  "subjects": [
    {
      "id": "ma1",
      "title": "Matematická Analýza I",
      "topicMap": {
        "limits": "Limity a spojitost",
        "derivatives": "Derivace"
      },
      "questions": [
        {
          "id": "q_83920471",
          "type": "multichoice",
          "topics": ["limits"],
          "question": "Vypočítejte limitu $\\lim_{x \\to \\infty} \\frac{1}{x}$",
          "originalText": "Původní neupravený text z PDF...",
          "image": "https://raw.../photo.png",
          "quizPhoto": "https://raw.../quiz.png",
          "answers": [
            {
              "order": "1",
              "text": "0",
              "isCorrect": true,
              "explanation": "Podíl konstanty a nekonečna konverguje k nule."
            },
            {
              "order": "2",
              "text": "1",
              "isCorrect": false
            }
          ]
        }
      ]
    }
  ]
}
```
