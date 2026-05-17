# Prompt pour Claude Code — Web App "English Vocabulary Flashcards"

## Contexte du projet

Crée une web app statique d'apprentissage du vocabulaire anglais, déployable gratuitement sur GitHub Pages. L'application utilise un fichier JSON local comme source de données unique. Aucun backend, aucune base de données, aucune clé API requise.

---

## Fichiers fournis

- `english_vocabulary_500.json` — liste de 500 mots anglais. Structure de chaque entrée :

```json
{
  "id": 1,
  "word": "to be",
  "type": "verb",
  "french": "être",
  "example": "She wants to be a doctor."
}
```

---

## Structure des fichiers à créer

```
/
├── index.html
├── style.css
├── app.js
└── english_vocabulary_500.json
```

---

## Fonctionnement exact de l'application

### Séquence d'états par mot (déclenchée par la touche Espace)

Chaque mot passe par 4 états successifs. La touche Espace fait avancer d'un état à l'autre.

**État 1 — Mot anglais affiché**
- Le mot anglais apparaît au centre de l'écran (ex : `to be`)
- Rien d'autre n'est visible

**État 2 — Prononciation audio**
- Appui sur Espace → la synthèse vocale du navigateur (`SpeechSynthesis API`) prononce le mot en anglais (`lang: 'en-US'`)
- L'écran ne change pas visuellement

**État 3 — Traduction française affichée**
- Appui sur Espace → la traduction française apparaît sous le mot anglais (ex : `être`)

**État 4 — Phrase d'exemple affichée**
- Appui sur Espace → la phrase d'exemple apparaît sous la traduction (ex : `She wants to be a doctor.`)

**Retour à l'État 1 — Mot suivant**
- Appui sur Espace → l'écran se vide entièrement, un nouveau mot anglais apparaît
- La progression avance d'un cran dans la liste mélangée

---

## Logique de progression et persistance

### Ordre aléatoire sans répétition
- Au premier lancement, mélanger les 500 mots avec l'algorithme Fisher-Yates
- Stocker l'ordre mélangé dans `localStorage` sous la clé `vocab_shuffled_order` (tableau d'IDs)
- Stocker l'index courant dans `localStorage` sous la clé `vocab_current_index`
- Stocker l'état courant (1 à 4) dans `localStorage` sous la clé `vocab_current_state`

### Reprise exacte à la fermeture/réouverture
- Au chargement de la page, lire `localStorage` et reprendre exactement là où l'utilisateur s'était arrêté (même mot, même état)
- Si `localStorage` est vide (premier lancement), générer un nouvel ordre mélangé et démarrer à l'index 0, état 1

### Fin de liste
- Quand l'index dépasse 499, afficher un message de félicitations ("You've completed all 500 words! 🎉"), puis générer un nouvel ordre mélangé et redémarrer automatiquement depuis le début

---

## Bouton "Retour" (mot précédent)

- Un bouton `← Back` est affiché en permanence en bas à gauche de l'écran
- Comportement au clic :
  - Si état > 1 : revenir à l'état 1 du mot courant (réafficher juste le mot anglais)
  - Si état = 1 et index > 0 : décrémenter l'index, revenir à l'état 1 du mot précédent
  - Si état = 1 et index = 0 : ne rien faire (désactiver visuellement le bouton)
- Mettre à jour `localStorage` en conséquence

---

## Design — style Google homepage

S'inspirer précisément de la page d'accueil de Google :

- Fond blanc pur (`#ffffff`)
- Mot anglais : police `Google Sans` ou `Roboto` (Google Fonts), taille `48px`, couleur `#202124`, centré horizontalement et verticalement dans la page
- Traduction française : même police, taille `28px`, couleur `#5f6368`, centrée, apparaît sous le mot anglais avec un margin-top de `24px`
- Phrase d'exemple : même police, taille `20px`, couleur `#5f6368`, italique, centrée, apparaît sous la traduction avec un margin-top de `16px`
- Aucune barre de navigation, aucun header, aucun footer visible
- Le compteur de progression (voir ci-dessous) est la seule information périphérique

### Compteur de progression
- En haut à droite : texte discret `Word 12 / 500` en `14px`, couleur `#9aa0a6`

### Bouton Back
- Bas gauche, position fixe
- Style sobre : texte `← Back`, sans bordure visible, couleur `#9aa0a6`, hover en `#5f6368`
- Curseur `pointer`

### Indicateur d'état (optionnel mais recommandé)
- 4 petits points sous le mot anglais indiquant l'état courant (1 à 4 remplis progressivement), comme un stepper minimaliste, couleur active `#4285F4` (bleu Google)

---

## Accessibilité et comportements à prévoir

- Sur mobile : la touche Espace n'existe pas. Ajouter un listener `tap/click` sur toute la zone centrale de l'écran (zone principale, pas le bouton Back) qui déclenche la même action que Espace
- La synthèse vocale doit être déclenchée uniquement par une interaction utilisateur (contrainte des navigateurs modernes) — c'est déjà le cas ici car c'est l'appui sur Espace qui la déclenche
- Si `SpeechSynthesis` n'est pas disponible (rare), passer silencieusement à l'état suivant sans erreur

---

## Déploiement GitHub Pages

Ajouter un fichier `.github/workflows/deploy.yml` configuré pour déployer automatiquement sur GitHub Pages à chaque push sur la branche `main`. Le site sera accessible à l'URL :
`https://<username>.github.io/<repository-name>/`

Le fichier de workflow doit utiliser `actions/checkout@v3` et `peaceiris/actions-gh-pages@v3` pour publier le contenu de la racine du repo.

---

## Contraintes techniques

- Zéro dépendance externe (pas de React, pas de Vue, pas de bundler)
- Vanilla HTML + CSS + JavaScript uniquement
- Le JSON est chargé via `fetch('./english_vocabulary_500.json')` au démarrage
- Aucun appel réseau après le chargement initial
- Compatible Chrome, Firefox, Safari (desktop et mobile)
