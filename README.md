# ČVUT Marasty - Příprava na rozstřely

![PWA Ready](https://img.shields.io/badge/PWA-Ready-black?style=flat-square) ![Offline Support](https://img.shields.io/badge/Offline-Supported-brightgreen?style=flat-square) ![Next.js](https://img.shields.io/badge/Next.js-15-blue?style=flat-square&logo=nextdotjs) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript) ![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react) ![License MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)

Webová aplikace pro přípravu na rozstřely na FIT ČVUT.

**Upozornění:** Tento repozitář neobsahuje žádné otázky, ty si musíte vytvořit sami a přidat si je do aplikace pomocí odkazu nebo lokálního souboru.

**WIP:** Repozitář také obsahuje manager, pro správu otázek lokálně na disku. Lze jednoduše upravit bulk otázky pomocí ai, nebo importovat v bulk z obrázků. Můžete si stáhnout build z releases.

## Funkce

- [x] Plná podpora offline režimu jako PWA
- [x] Import otázek z JSON nebo URL
- [x] Základní statistiky u každé otázky
- [x] Podpora pro LaTex
- [x] Podpora více typů otázek (multichoice & open)
- [x] Tmavý a světlý režim
- [x] Podpora obrázků v otázkách
- [x] Sdílený whiteboard pomocí PartyKitu
- [ ] Responzivní design (telefony hodně trpí)
- [ ] Vlastní Docker image, pro spuštění vlastního serveru s kamarády pro kolaboraci
- [ ] Žebříček a společné statistiky

## FAQ

**Kde mohu vzít soubor s otázkami?**
Otázky si musíte připravit vlastní, a následně je importovat. Doporučuji si udělat vlastní otázky ze skript.

## Struktura JSON souboru s otázkami

Aplikace očekává JSON v následujícím formátu:

```json
{
  "metadata": {
    "version": "1.2.0",
    "syntax": "1.0.0",
    "generatedAt": "2026-01-14T12:00:00Z",
    "hash": "a1b2c3d4"
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
          "id": "83920471",
          "type": "multichoice",
          "topics": ["limits"],
          "question": "Vypočítejte limitu $\\lim_{x \\to \\infty} \\frac{1}{x}$",
          "originalText": "Původní neupravený text z PDF...", // [optional] Původní text otázky
          "image": "https://raw.../photo.png", // [optional] Obrázek potřebný pro odpovězení na otázku (aplikace podporuje i base64 obrázky)
          "quizPhoto": "https://raw.../quiz.png", // [optional] Dopllňující obrázek, schovaný v aplikace za togglem
          "answers": [
            {
              "text": "0",
              "isCorrect": true,
              "explanation": "Podíl konstanty a nekonečna konverguje k nule." // [optional]
            },
            {
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
