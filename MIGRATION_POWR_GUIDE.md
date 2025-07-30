# 🚀 Guide Migration POWR.io : Wix → rababali.com

## 📋 Étapes pour récupérer le widget Instagram de Wix

### 1️⃣ **Inspection du site Wix actuel**

#### **Méthode A : Code source**

1. Aller sur le site Wix : `https://rababali.com`
2. **Clic droit** → "Inspecter l'élément" (F12)
3. **Ctrl+F** → Chercher : `powr-social-feed` ou `powr.io`
4. **Noter l'ID du widget** : `id="powr-social-feed-XXXXX"`

**Exemple de code à chercher :**

```html
<div class="powr-social-feed" id="powr-social-feed-abc123def456"></div>
<script src="https://www.powr.io/powr.js"></script>
```

#### **Méthode B : Administration Wix**

1. **Se connecter** à l'admin Wix
2. **Éditeur** → Applications → POWR
3. **Copier l'ID** du widget Social Feed
4. **Exporter les paramètres** si possible

---

### 2️⃣ **Configuration sur rababali.com**

#### **Option 1 : Réutiliser l'ID existant**

Si tu récupères l'ID Wix (ex: `abc123def456`) :

```tsx
// Dans src/pages/Home.tsx
<PowrInstagramWidget powrId="abc123def456" />
```

#### **Option 2 : Créer un nouveau widget**

1. **Aller sur** [POWR.io](https://www.powr.io)
2. **S'inscrire** gratuitement (ou se connecter avec le compte existant)
3. **Créer** → Social Feed → Instagram
4. **Configurer** :
   - Connecter Instagram : `@rabab_rit_a_la_vie`
   - Layout : Grid ou Slider
   - Nombre de posts : 6 (plan gratuit)
5. **Récupérer l'ID** du nouveau widget
6. **Intégrer** dans le code

---

### 3️⃣ **Configuration POWR.io optimale**

#### **Paramètres recommandés :**

- **Source** : Instagram account `@rabab_rit_a_la_vie`
- **Layout** : Masonry ou Grid
- **Posts** : 6 (gratuit) ou 12+ (payant)
- **Couleurs** : Assortis au site (bleus/blancs)
- **Auto-sync** : 24h (gratuit) ou 3h (payant)

#### **Plans POWR.io :**

- **Gratuit** : 6 posts, sync 24h, 1 source
- **Starter ($5/mois)** : 12 posts, sync 12h, 2 sources
- **Pro ($13/mois)** : 20 posts, sync 3h, 4 sources

---

### 4️⃣ **Code d'intégration**

#### **Intégration dans React :**

```tsx
// Utilisation simple
<PowrInstagramWidget fallbackToDemo={true} />

// Avec ID spécifique de Wix
<PowrInstagramWidget powrId="VOTRE_ID_POWR" />

// Sans fallback (affiche instructions)
<PowrInstagramWidget powrId="VOTRE_ID_POWR" fallbackToDemo={false} />
```

#### **Script POWR automatique :**

Le composant charge automatiquement :

```html
<script src="https://www.powr.io/powr.js" async></script>
```

---

### 5️⃣ **Vérification et test**

#### **Checklist :**

- [ ] Widget POWR visible sur la page
- [ ] Posts Instagram affichés
- [ ] Liens vers Instagram fonctionnels
- [ ] Design cohérent avec le site
- [ ] Responsive (mobile/desktop)
- [ ] Bouton "Suivre" fonctionnel

#### **Debug en cas de problème :**

1. **Console** (F12) → Vérifier erreurs JavaScript
2. **Network** → Vérifier chargement de `powr.js`
3. **Tester** sur différentes tailles d'écran
4. **Vider cache** navigateur

---

### 6️⃣ **Avantages de cette approche**

#### **✅ Pour ta cliente :**

- **Continuité** : Même fonctionnalité qu'avant
- **Simplification** : Plus de gestion technique Instagram
- **Fiabilité** : Service POWR maintenu 24/7
- **Évolutivité** : Peut passer payant facilement

#### **✅ Pour toi (développeur) :**

- **Moins de maintenance** : Pas d'API Instagram à gérer
- **Robustesse** : Pas de tokens à renouveler
- **Flexibilité** : Compatible avec tous hébergeurs
- **Support** : POWR gère les mises à jour

---

### 7️⃣ **Migration finale**

#### **Étapes sur Infomaniak :**

1. **Upload** du site React compilé
2. **Configurer** le widget POWR (ID récupéré ou nouveau)
3. **Tester** le widget en production
4. **Optimiser** les paramètres si nécessaire

#### **Abandonment Wix :**

- **Redirection** domaine vers Infomaniak
- **Export** données si nécessaire
- **Arrêt** abonnement Wix
- **Conservation** compte POWR (gratuit/payant)

---

## 🔥 **Résultat final**

Le widget Instagram sera **identique ou meilleur** qu'avant :

- **Posts automatiques** de `@rabab_rit_a_la_vie`
- **Design moderne** intégré au site
- **Performance** optimisée
- **Maintenance** simplifiée

**Plus de complexité technique**, juste un widget qui fonctionne ! 🎯
