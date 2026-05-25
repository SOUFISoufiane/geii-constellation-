# Conventions de la GEII Visual Toolbox

Ce document décrit les **règles à suivre pour ajouter une nouvelle app** à la toolbox
sans rien casser des apps existantes, et en gardant la cohérence visuelle.

---

## 1. Structure de dossier

Chaque app vit sous `apps/<id>/` avec :

```
apps/<id>/
├── index.html          ← entrée unique (multi-page architecture)
├── css/                ← styles propres à l'app
│   └── *.css
├── js/                 ← code de l'app (ES modules)
│   └── *.js
└── README.md           ← spec, dépendances, raccourcis clavier
```

L'`<id>` doit être :
- en kebab-case (`signal-observatory`, `servo-lab`)
- unique dans le manifeste
- court (idéalement ≤ 20 caractères)

---

## 2. Squelette HTML minimal

Toute nouvelle app commence par ce squelette :

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NOM_APP — GEII Toolbox</title>

    <!-- Thème partagé : OBLIGATOIRE -->
    <link rel="stylesheet" href="../../shared/css/theme.css">
    <link rel="stylesheet" href="../../shared/css/toolbox.css">

    <!-- Styles propres à l'app -->
    <link rel="stylesheet" href="css/components.css">

    <!-- Dev cache buster -->
    <script>
        document.querySelectorAll('link[rel="stylesheet"]').forEach(l => {
            const h = l.getAttribute('href');
            if (h && !h.startsWith('http')) l.href = h + '?v=' + Date.now();
        });
    </script>
</head>
<body>
    <!-- Header partagé (back to home + theme switcher) — OBLIGATOIRE -->
    <script type="module">
        const v = Date.now();
        const { mountAppHeader } = await import(`../../shared/js/app-header.js?v=${v}`);
        mountAppHeader('<id-de-l-app>');
    </script>

    <!-- ton contenu ici -->

    <!-- Entry point -->
    <script type="module">
        import(`./js/main.js?v=${Date.now()}`);
    </script>
</body>
</html>
```

---

## 3. Imports relatifs (NON négociable)

Depuis un fichier dans `apps/<id>/...`, les chemins sont :

| Cible                    | Chemin                                  |
|--------------------------|-----------------------------------------|
| Thème global             | `../../shared/css/theme.css`            |
| Toolbox UI primitives    | `../../shared/css/toolbox.css`          |
| Manifest                 | `../../shared/js/manifest.js`           |
| App header               | `../../shared/js/app-header.js`         |
| Theme switcher           | `../../shared/js/theme-switcher.js`     |
| Styles propres           | `css/components.css`                    |
| Code propre              | `./js/main.js`                          |

**Jamais** d'import absolu (`/shared/...`) car la toolbox doit fonctionner depuis
un sous-chemin (GitHub Pages, ou path-rewriting derrière un proxy).

---

## 4. Theme variables

**Interdit** : hex en dur dans CSS ou JS (sauf fallbacks documentés et la
COSMIC_COLORSCALE qui est volontairement constante).

**Imposé** : utiliser uniquement les variables CSS de `shared/css/theme.css` :

```
--accent-blue, --accent-cyan, --accent-red, --accent-gold, --accent-magenta,
--accent-green, --accent-purple, --accent-orange,
--text-bright, --text-mid, --text-dim, --text-glow,
--void, --void-soft, --nebula-1, --nebula-2, --nebula-3, --rim, --rim-bright
```

En JavaScript, pour lire une variable :

```js
const c = getComputedStyle(document.documentElement)
            .getPropertyValue('--accent-blue').trim();
```

Ou réutiliser `shared/js/manifest.js` (qui les expose indirectement via `concept.color`)
ou le `PALETTE` proxy de Signal Observatory comme exemple.

---

## 5. Manifest (source unique de vérité)

Toute nouvelle app **doit** être ajoutée à `shared/js/manifest.js` :

1. Dans `APPS` :
```js
'<id>': {
    name: 'Nom Affichable',
    tagline: 'Sous-titre court · 2-3 mots clés',
    icon: '🎯',
    status: 'stub',  // ou 'beta' / 'stable'
    concept: '<concept-id>',
    matieres: ['Matière 1', 'Matière 2'],
    path: 'apps/<id>/index.html',
    description: 'Phrase qui décrit l\'app en 1-2 lignes.'
}
```

2. Dans le `CONCEPTS[]` correspondant, ajouter `<id>` à `apps`.

3. (Optionnel) Si le concept n'existe pas : ajouter un nouvel objet à `CONCEPTS`
   avec `id`, `name`, `icon`, `color`, `description`, `matieres`, `apps`, `position`.

---

## 6. Cache busters (dev)

Pour le développement local, **toujours** suffixer les imports de modules ES par
`?v=${Date.now()}` :

```js
import(`./js/main.js?v=${Date.now()}`);
```

Le `dev_server.py` envoie `Cache-Control: no-store` sur toutes les réponses, ce qui
règle 95% des problèmes. Le `?v=` est une ceinture en plus, utile derrière n'importe
quel autre static host.

---

## 7. localStorage namespace

Toute clé localStorage doit être préfixée :

```
geii-toolbox-<app-id>-<clé>
```

Exemples valides :
- `geii-toolbox-theme` (clé toolbox-wide, exception)
- `geii-toolbox-signal-observatory-sidebar-collapsed`
- `geii-toolbox-servo-lab-pid-presets`

Cela évite les collisions et permet un cleanup ciblé si on veut purger une app.

---

## 8. README requis

Chaque `apps/<id>/README.md` doit contenir au minimum :
- **Vision** (1 paragraphe)
- **Fonctionnalités prévues / implémentées** (liste)
- **Dépendances techniques** (Plotly, KaTeX, autres ?)
- **Concepts pédagogiques couverts**
- **Lien avec les autres apps** (si pertinent)
- **Raccourcis clavier** (si l'app en définit)
- **TODO d'amorçage** (si stub)

Cf. `apps/signal-observatory/README.md` ou les stubs comme références.

---

## 9. Pas de framework

La toolbox est **vanilla JavaScript + ES modules**. Pas de React, Vue, Svelte,
ni bundler (Vite, Webpack…). Ce choix :
- Garde le projet hackable par un étudiant
- Pas de build step → édit-refresh est instantané
- Pas de versions à maintenir

CDN autorisés (déjà chargés par Signal Observatory) :
- Plotly.js 2.27
- KaTeX 0.16

D'autres CDN sont OK si réellement nécessaires, mais documente le choix dans le README.

---

## 10. Tests & QA

Pas de framework de test imposé (le projet est petit). Mais :
- Toute nouvelle app **doit** être testée à la main contre la grille de QA
  du fichier `docs/QA.md` (à créer quand on aura un protocole stable).
- Le port de dev est **8123** (`python dev_server.py 8123`).
- Vérifier les 3 thèmes (cosmic, amber, solarized) avant de marquer l'app comme `stable`.

---

## 11. Performance budget

Pour qu'une app reste fluide :
- Charger ≤ 200 ms sur localhost (mesure : Network tab du DevTools)
- Aucun recompute > 16 ms en moyenne sur les sliders interactifs (60 fps)
- Pas plus de 5 traces simultanées sur un plot Plotly (au-delà, batch ou
  utiliser une heatmap)

Si tu dois dépasser, documente la raison dans le README.

---

## Récap : checklist d'une nouvelle app

```
[ ] Dossier apps/<id>/ créé avec css/, js/, index.html, README.md
[ ] HTML utilise le squelette minimal ci-dessus
[ ] Imports relatifs vers ../../shared/...
[ ] Aucun hex en dur, que des var(--...) ou var lookups
[ ] Entrée ajoutée dans manifest.js (APPS) + référence dans le concept
[ ] Clés localStorage préfixées geii-toolbox-<id>-
[ ] README.md complet
[ ] Testé en cosmic + amber + solarized
[ ] Header partagé bien injecté (visible en haut, fonctionnel)
[ ] Retour home fonctionne
```
