# Internationalisation avec next-intl

Ce document explique comment nous avons mis en place l'internationalisation (i18n) dans ce projet Next.js 16 avec App Router, en utilisant la librairie [next-intl](https://next-intl.dev).

---

## Stack

- **Next.js 16** (App Router)
- **next-intl** — gestion des traductions et du routing i18n
- **shadcn/ui** — composants UI (utilisé pour le sélecteur de langue)
- **clsx** — utilitaire pour les classes CSS conditionnelles

---

## Langues supportées

| Code | Langue   |
|------|----------|
| `fr` | Français |
| `en` | English  |

La locale par défaut est `fr`.

---

## Structure des fichiers

```
├── messages/
│   ├── fr.json               # Traductions françaises
│   └── en.json               # Traductions anglaises
├── config.ts                 # Liste des locales supportées
├── proxy.ts                  # Middleware next-intl (routing)
├── next.config.ts            # Plugin next-intl
├── i18n/
│   ├── routing.ts            # Configuration du routing
│   ├── navigation.ts         # Wrappers Link, useRouter, usePathname
│   └── request.ts            # Chargement des messages par locale
├── app/
│   └── [locale]/
│       ├── layout.tsx        # RootLayout avec NextIntlClientProvider
│       └── page.tsx          # Page principale
└── components/
    ├── LocaleSwitcher.tsx        # Composant parent du sélecteur de langue
    └── LocaleSwitcherSelect.tsx  # Select shadcn pour changer la langue
```

---

## Installation

```bash
npm install next-intl clsx
npx shadcn@latest add select
```

---

## Configuration

### `config.ts`
Point central qui déclare les locales disponibles :

```ts
export const locales = ['fr', 'en'] as const;
export const defaultLocale = 'fr';
```

### `i18n/routing.ts`
Définit les règles de routing i18n :

```ts
import { defineRouting } from 'next-intl/routing';
import { locales, defaultLocale } from '@/config';

export const routing = defineRouting({
  locales,
  defaultLocale
});
```

### `i18n/navigation.ts`
Wrappers autour des APIs Next.js qui gèrent la locale automatiquement. **Toujours importer `Link`, `useRouter`, `usePathname` depuis ce fichier** plutôt que depuis `next/navigation` :

```ts
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

### `i18n/request.ts`
Charge les fichiers de traduction JSON selon la locale de la requête :

```ts
import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
```

### `next.config.ts`
Active le plugin next-intl :

```ts
import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
```

### `proxy.ts`
Middleware qui détecte la locale et redirige automatiquement (ex: `/` → `/fr`).

> ⚠️ Depuis Next.js 16, ce fichier s'appelle `proxy.ts`. Dans les versions antérieures, il s'appelait `middleware.ts`.

```ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
};
```

---

## Layout et pages

### `app/[locale]/layout.tsx`
Le RootLayout est placé dans le segment dynamique `[locale]`. Il valide la locale, active le rendu statique et fournit le provider next-intl aux Client Components :

```tsx
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  return { title: t('title') };
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <html lang={locale}>
      <body suppressHydrationWarning>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
```

> 💡 `suppressHydrationWarning` sur le `<body>` évite les faux avertissements d'hydratation causés par les extensions de navigateur.

### `app/[locale]/page.tsx`

```tsx
import { use } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';

export default function HomePage({ params }) {
  const { locale } = use(params);
  setRequestLocale(locale);

  const t = useTranslations('HomePage');
  return <h1>{t('title')}</h1>;
}
```

---

## Fichiers de traduction

Les traductions sont des fichiers JSON dans le dossier `messages/`. Chaque namespace regroupe les clés d'un contexte donné.

### `messages/fr.json`
```json
{
  "Metadata": {
    "title": "Mon Application"
  },
  "HomePage": {
    "title": "Bonjour le monde !"
  },
  "LocaleSwitcher": {
    "label": "Changer la langue",
    "locale": "{locale, select, fr {🇫🇷 Français} en {🇬🇧 English} other {Inconnu}}"
  }
}
```

### `messages/en.json`
```json
{
  "Metadata": {
    "title": "My Application"
  },
  "HomePage": {
    "title": "Hello world!"
  },
  "LocaleSwitcher": {
    "label": "Change language",
    "locale": "{locale, select, fr {🇫🇷 French} en {🇬🇧 English} other {Unknown}}"
  }
}
```

---

## Sélecteur de langue

Le changement de langue se fait via deux composants :

### `components/LocaleSwitcher.tsx`
Composant Server Component qui récupère la locale courante et passe les données au select :

```tsx
import { useLocale, useTranslations } from 'next-intl';
import LocaleSwitcherSelect from './LocaleSwitcherSelect';
import { locales } from '@/config';

export default function LocaleSwitcher() {
  const t = useTranslations('LocaleSwitcher');
  const locale = useLocale();

  return (
    <LocaleSwitcherSelect
      defaultValue={locale}
      label={t('label')}
      locales={locales.map((curr) => ({
        value: curr,
        label: t('locale', { locale: curr }),
      }))}
    />
  );
}
```

### `components/LocaleSwitcherSelect.tsx`
Client Component qui utilise le `Select` de shadcn/ui pour changer la locale sans recharger la page :

```tsx
'use client';

import { usePathname, useRouter } from '@/i18n/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import clsx from 'clsx';
import { useParams } from 'next/navigation';
import { useTransition } from 'react';

type Props = {
  defaultValue: string;
  label: string;
  locales: { value: string; label: string }[];
};

export default function LocaleSwitcherSelect({ defaultValue, label, locales }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const params = useParams();

  function onValueChange(nextLocale: string) {
    startTransition(() => {
      router.replace(
        //@ts-ignore
        { pathname, params },
        { locale: nextLocale }
      );
    });
  }

  return (
    <div className={clsx(isPending && 'opacity-50 pointer-events-none')}>
      <p className="sr-only">{label}</p>
      <Select defaultValue={defaultValue} onValueChange={onValueChange} disabled={isPending}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {locales.map((locale) => (
            <SelectItem key={locale.value} value={locale.value}>
              {locale.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

---

## Utiliser les traductions

### Dans un Server Component
```tsx
import { getTranslations } from 'next-intl/server';

const t = await getTranslations('MonNamespace');
return <p>{t('maClé')}</p>;
```

### Dans un Client Component
```tsx
'use client';
import { useTranslations } from 'next-intl';

const t = useTranslations('MonNamespace');
return <p>{t('maClé')}</p>;
```

### Navigation entre pages (toujours utiliser `@/i18n/navigation`)
```tsx
import { Link } from '@/i18n/navigation';

<Link href="/about">À propos</Link>
// Génère automatiquement /fr/about ou /en/about
```

---

## Problèmes rencontrés

### Turbopack crash en boucle
Turbopack (bundler expérimental de Next.js) est instable avec certaines configurations. Solution : le désactiver.

```json
// package.json
"dev": "next dev --no-turbopack"
```

### Erreur d'hydratation sur le `<body>`
Les extensions de navigateur injectent des attributs dans le DOM avant que React ne s'initialise, causant une erreur d'hydratation. Solution : ajouter `suppressHydrationWarning` sur le `<body>`.

```tsx
<body suppressHydrationWarning>
```