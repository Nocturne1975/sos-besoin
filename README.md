# HTTPS://github.com/Nocturne1975/sos-besoin.git
# Equipe: Sonia Corbin - Asma Ajroudi - Marina Kamel - Sonia Mhimdi

# SOS‑BESOIN — Laboratoire 1 (420‑951‑MA) 

Plateforme Web transactionnelle permettant à des **clients** de publier des demandes urgentes (ex: besoin d’un guitariste remplaçant, d’un service tech, d’une correction de texte) et à des **prestataires** de soumettre des offres. Le client peut **accepter une offre** et **confirmer la réservation** via un flux de paiement (Stripe en mode test) avec intégrité transactionnelle (ACID) via Prisma.

## Stack
- **Next.js** (App Router)
- **TypeScript**
- **PostgreSQL** (Neon)
- **Prisma ORM**
- **Clerk** (auth) *(prévu/intégration progressive)*
- **Stripe** (paiement) *(prévu/intégration progressive)*

> Remarque: ce dépôt couvre les fondations demandées au **Lab 1**: schéma Prisma, migrations, seed, transactions Prisma, script de test transactionnel, et documentation.

---

## Prérequis
- Node.js LTS (recommandé)
- Une base PostgreSQL (ex: Neon)
- npm

---

## Configuration des variables d’environnement

1. Copier le fichier d’exemple :
   ```bash
   cp .env.example .env
   ```
   *(Sur Windows si `cp` ne fonctionne pas, copiez manuellement le fichier.)*

2. Remplir `DATABASE_URL` dans `.env` avec votre chaîne de connexion PostgreSQL.

⚠️ **Ne jamais commit `.env`** (il contient des secrets).

---

## Installation
```bash
npm install
```

---

## Prisma — Migrations
Appliquer les migrations en développement :

```bash
npx prisma migrate dev
```

---

## Prisma — Seed (peupler la base de données)
Le seed est idempotent (il supprime les données puis réinsère des données réalistes).

```bash
npx prisma db seed
```

---

## Prisma Studio
Pour visualiser les données :

```bash
npx prisma studio
```

---

## Transactions ACID (Prisma)
Les transactions sont implémentées dans :

- `src/lib/transactions.ts`
  - transaction **séquentielle**
  - transaction **interactive** (avec logique + rollback)

---

## Script de test transactionnel
Le script démontre :
- un scénario **succès** (transaction validée)
- un scénario **échec** (rollback complet) + vérifications

Exécution :

```bash
npm run test:tx
```

---

## Structure du projet (éléments clés)
- `prisma/schema.prisma` — Schéma Prisma
- `prisma/migrations/` — Historique des migrations
- `prisma/seed.ts` — Script de seed
- `src/lib/prisma.ts` — Singleton Prisma Client
- `src/lib/transactions.ts` — Transactions Prisma
- `src/lib/test-transactions.ts` — Tests transactionnels
- `.env.example` — Exemple de variables d’environnement
- `.gitignore` — Fichiers exclus (dont `.env`)

---

## Auteurs / Équipe
- À compléter (noms des membres + rôles/contributions)

---

## Licence
Projet académique — usage pédagogique.
