# Privacy Shield

**Anonymisez vos documents avant de les confier à un LLM, sans qu'ils quittent votre navigateur.**

👉 **[Essayer en ligne](https://rqphametq.github.io/Privacy-Shield/)**

Privacy Shield remplace les données personnelles et confidentielles d'un texte (noms, entreprises, adresses, IBAN, montants…) par des balises comme `[PERSONNE_1]` ou `[ENTREPRISE_2]`. Vous envoyez la version anonymisée à ChatGPT, Claude ou Gemini, puis vous recollez sa réponse : l'outil remet les vraies valeurs à la place des balises.

Tout se passe en local : pas de serveur, aucun envoi réseau de vos données. La table de correspondance reste en mémoire vive et disparaît quand vous fermez l'onglet ou cliquez sur « Purger ».

## Fonctionnement

1. **Anonymiser** : collez un texte ou importez un fichier (.txt, .md, .docx, .pdf). Les entités détectées sont surlignées et listées dans le panneau de droite.
2. **Ajuster** : décochez un faux positif, une catégorie entière (par exemple tous les montants), ou ajoutez vos propres termes à masquer.
3. **Copier** la version anonymisée pour le LLM. Le bouton reste verrouillé tant que l'analyse IA n'est pas terminée, pour ne rien laisser passer.
4. **Désanonymiser** : collez la réponse du LLM dans le second onglet pour retrouver les valeurs d'origine.

## Ce qui est détecté

| Catégorie | Exemples |
|---|---|
| Personnes, entreprises, lieux | modèle d'IA multilingue + règles : « NOVALIS DIGITAL SOLUTIONS SAS », « Cabinet Arvelle & Associés » |
| Identifiants | SIREN, SIRET, IBAN, BIC, n° de sécurité sociale, références de contrat ou de dossier |
| Coordonnées | adresses postales complètes, emails, téléphones, URL, adresses IP |
| Données sensibles | dates de naissance, noms de code de projet (« Projet Colibri ») |
| Chiffres business | montants, pourcentages, multiples, effectifs, valeurs de tableaux |

Chaque nom détecté est masqué partout dans le document, y compris en majuscules, sans sa forme juridique ou par le nom de famille seul. Les mots qui n'identifient personne (« le Prestataire », « Tribunal de commerce », « SAS », « RGPD »…) restent lisibles.

## Limites

- La détection est automatique : **relisez toujours la version anonymisée** avant de l'envoyer.
- PDF : seule la couche texte est lue, les PDF scannés ne sont pas pris en charge (pas d'OCR).
- Un nom de marque ou de produit isolé, sans indice (« projet », forme juridique…), peut échapper au modèle : ajoutez-le comme terme manuel.
- Le premier chargement télécharge le modèle d'IA (environ 180 Mo), mis en cache par le navigateur ensuite.

## Développement

Stack : React, TypeScript, Vite, Tailwind CSS, Vitest. La reconnaissance d'entités utilise [Transformers.js](https://github.com/huggingface/transformers.js) avec le modèle `Xenova/bert-base-multilingual-cased-ner-hrl`, exécuté dans un Web Worker et servi depuis le site lui-même (aucun appel à un service tiers).

```bash
npm install
npm run dev      # serveur de développement (télécharge le modèle dans public/models au premier lancement)
npm test         # tests unitaires du moteur
npm run eval     # le vrai modèle sur les documents fictifs de eval/contracts
npm run build    # vérification des types + build de production
```

- `src/core/` : moteur pur, sans DOM (règles, fusion des détections, table de correspondance, import de fichiers).
- `src/workers/` : exécution du modèle hors du fil principal.
- `src/components/` : interface.
- `eval/contracts/` : contrats et documents internes **fictifs**, chacun avec ce qui doit être masqué ou rester lisible.

Chaque push sur `main` lance les tests, le build et la publication sur GitHub Pages.
