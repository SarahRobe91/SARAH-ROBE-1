# Sarah Robe — Configuration Checkout Shopify
# Éditeur : Shopify Admin → Paramètres → Checkout and accounts → Personnaliser

## COULEURS

| Champ Shopify               | Valeur        | Note                          |
|-----------------------------|---------------|-------------------------------|
| Couleur de fond principale  | `#FBF7F1`     | Crème chaude (sr-bg)          |
| Couleur d'accent / bouton   | `#C28B7C`     | Rose poudré principal         |
| Couleur bouton hover        | `#B07A6B`     | Rose poudré foncé             |
| Couleur texte principal     | `#3A3330`     | Brun chaud (sr-dark)          |
| Couleur texte secondaire    | `#9a8f86`     | Muted beige (sr-muted)        |
| Couleur des liens           | `#B07A6B`     | Rose foncé (sr-rose-dk)       |
| Couleur des erreurs         | `#C28B7C`     | Rose (cohérent avec la DA)    |
| Couleur bordure des champs  | `#efe6da`     | Beige clair (sr-border)       |
| Fond des champs formulaire  | `#FDFAF6`     | Blanc chaud                   |
| Couleur fond order summary  | `#F8E7E2`     | Rose très clair (sr-rose-xl)  |

## TYPOGRAPHIE

| Champ Shopify               | Valeur                        |
|-----------------------------|-------------------------------|
| Police des titres           | Cormorant Garamond (serif)    |
| Police du corps de texte    | Jost (sans-serif)             |
| Taille de texte de base     | 14–16px                       |
| Espacement entre lettres    | Légèrement aéré (+0.02–0.05em)|

Note : Dans l'éditeur Shopify Checkout, choisissez une Google Font proche si Cormorant Garamond n'est pas disponible.
Alternative : "Playfair Display" (titres) + "Lato" ou "Raleway" (corps).

## LOGO

| Champ Shopify               | Valeur                        |
|-----------------------------|-------------------------------|
| Logo                        | Uploader logo.jpeg            |
| Position du logo            | Gauche ou Centre              |
| Taille du logo              | Moyenne (50–60px de hauteur)  |

## STYLE DES CHAMPS

| Champ Shopify               | Valeur                        |
|-----------------------------|-------------------------------|
| Style des champs            | Arrondis / Pill               |
| Border-radius des champs    | 14px                          |
| Padding interne des champs  | 13px 16px                     |
| Couleur focus (outline)     | `#C28B7C`                     |

## BOUTON CHECKOUT

| Champ Shopify               | Valeur                        |
|-----------------------------|-------------------------------|
| Couleur de fond             | `#C28B7C` (Rose poudré)       |
| Couleur du texte            | `#FFF8F2` (Blanc chaud)       |
| Border-radius               | 999px (entièrement arrondi)   |
| Texte du bouton             | "Passer au paiement"          |
| Taille de police            | 12px, lettres espacées        |

## ORDER SUMMARY (résumé de commande)

| Champ Shopify               | Valeur                        |
|-----------------------------|-------------------------------|
| Couleur de fond             | `#F8E7E2` (Rose très clair)   |
| Couleur des titres          | `#3A3330`                     |
| Couleur du total            | `#C28B7C`                     |
| Séparateurs                 | `#efe6da`                     |

## HEADER CHECKOUT

| Champ Shopify               | Valeur                        |
|-----------------------------|-------------------------------|
| Couleur de fond du header   | `#FBF7F1`                     |
| Hauteur du header           | Compact (logo centré)         |
| Bordure bas du header       | `1px solid #efe6da`           |

## STYLE GÉNÉRAL CONSEILLÉ

- Préférez le style "Clean / Minimal" dans les templates proposés par Shopify
- Désactivez les styles trop "tech" ou trop "bleus/violets"
- Si disponible, activez l'option "coins arrondis" partout
- Le style "glassmorphism" n'est pas disponible nativement dans le checkout Shopify,
  mais le fond crème + les champs blancs chauds créent un effet proche.

## TEXTES À PERSONNALISER

| Champ Shopify               | Valeur conseillée             |
|-----------------------------|-------------------------------|
| Titre page checkout         | "Finaliser ma commande"       |
| Bouton "Continuer"          | "Continuer →"                 |
| Texte sécurité              | "Paiement 100 % sécurisé"     |
| Message commande confirmée  | "Merci pour votre confiance ✨"|

## NOTES IMPORTANTES

1. Le vrai checkout Shopify (natif) n'accepte pas de code Liquid personnalisé 
   sauf si vous êtes sur Shopify Plus (checkout.liquid).

2. Avec Shopify Standard/Advanced : seul l'éditeur visuel de branding est disponible.
   Les valeurs ci-dessus sont exactement celles à saisir dans cet éditeur.

3. Sur Shopify Plus : vous pouvez utiliser checkout.liquid pour aller plus loin.
   Contactez votre développeur pour appliquer un style cohérent avec le thème.

4. Les pages de COMPTE CLIENT (login, register, account, addresses, order)
   sont entièrement custom via le thème SARAH ROBE et ont leur propre DA.
   Seul le checkout en lui-même passe par l'éditeur Shopify.
