# Todo List for Implementing next-intl in a Next.js 14 Project

Here's a complete list of files you need to create or modify to implement next-intl in a new Next.js 14 project:

1. **Package Installation**
   - Run `npm install next-intl`

2. **Project Configuration**
   - `next.config.js` - Add next-intl plugin

3. **Messages (Translations)**
   - `messages/en.json` - English translations
   - `messages/de.json` - German translations (or any other languages you need)

4. **i18n Configuration**
   - `src/i18n/routing.ts` - Define routing configuration
   - `src/i18n/navigation.ts` - Create navigation utilities
   - `src/i18n/request.ts` - Set up server-side configuration

5. **Middleware**
   - `src/middleware.ts` - Create middleware for handling locale routing

6. **App Structure**
   - `src/app/[locale]/layout.tsx` - Root layout with NextIntlClientProvider
   - `src/app/[locale]/page.tsx` - Home page with translation example
   - `src/app/[locale]/about/page.tsx` - About page (optional)

7. **Types (Optional)**
   - `src/global.d.ts` - Add type augmentation for next-intl

8. **Error Handling**
   - `src/app/[locale]/not-found.tsx` - Localized 404 page
   - `src/app/[locale]/error.tsx` - Error boundary

Now let's create each of these files with the proper content.

## File Contents

### 1. next.config.js

```javascript
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {};

module.exports = withNextIntl(nextConfig);
```

### 2. messages/en.json

```json
{
  "Index": {
    "title": "Hello world!",
    "description": "This is a sample project with next-intl",
    "switchLocale": "Switch to {locale}",
    "about": "Go to About page"
  },
  "About": {
    "title": "About Us",
    "description": "This is the about page",
    "backHome": "Back to Home"
  },
  "NotFound": {
    "title": "Page not found",
    "description": "The page you are looking for does not exist"
  },
  "Error": {
    "title": "Something went wrong!",
    "retry": "Try again"
  }
}
```

### 3. messages/de.json

```json
{
  "Index": {
    "title": "Hallo Welt!",
    "description": "Dies ist ein Beispielprojekt mit next-intl",
    "switchLocale": "Wechseln zu {locale}",
    "about": "Zur Über uns Seite"
  },
  "About": {
    "title": "Über uns",
    "description": "Dies ist die Über uns Seite",
    "backHome": "Zurück zur Startseite"
  },
  "NotFound": {
    "title": "Seite nicht gefunden",
    "description": "Die gesuchte Seite existiert nicht"
  },
  "Error": {
    "title": "Etwas ist schief gelaufen!",
    "retry": "Erneut versuchen"
  }
}
```

### 4. src/i18n/routing.ts

```typescript
import {defineRouting} from 'next-intl/routing';

export const locales = ['en', 'de'] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  // A list of all locales that are supported
  locales,
  
  // Used when no locale matches
  defaultLocale: 'en'
});
```

### 5. src/i18n/navigation.ts

```typescript
import {createNavigation} from 'next-intl/navigation';
import {routing} from './routing';

// Lightweight wrappers around Next.js' navigation
// APIs that consider the routing configuration
export const {Link, redirect, usePathname, useRouter, getPathname} =
  createNavigation(routing);
```

### 6. src/i18n/request.ts

```typescript
import {getRequestConfig} from 'next-intl/server';
import {hasLocale} from 'next-intl';
import {routing} from './routing';

export default getRequestConfig(async ({requestLocale}) => {
  // Typically corresponds to the `[locale]` segment
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
```

### 7. src/middleware.ts

```typescript
import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: ['/((?!api|trpc|_next|_vercel|.*\\..*).*)', '/']
};
```

### 8. src/app/[locale]/layout.tsx

```tsx
import {NextIntlClientProvider, hasLocale} from 'next-intl';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: {locale: string};
}) {
  // Ensure that the incoming `locale` is valid
  const locale = params.locale;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### 9. src/app/[locale]/page.tsx

```tsx
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';

export default function Home() {
  const t = useTranslations('Index');
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">{t('title')}</h1>
      <p className="mb-4">{t('description')}</p>
      
      <div className="mb-4">
        <Link href="/about" className="text-blue-500 hover:underline">
          {t('about')}
        </Link>
      </div>
      
      <div className="flex gap-4">
        <Link href="/" locale="en" className="text-blue-500 hover:underline">
          {t('switchLocale', {locale: 'English'})}
        </Link>
        <Link href="/" locale="de" className="text-blue-500 hover:underline">
          {t('switchLocale', {locale: 'Deutsch'})}
        </Link>
      </div>
    </div>
  );
}
```

### 10. src/app/[locale]/about/page.tsx

```tsx
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';

export default function About() {
  const t = useTranslations('About');
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">{t('title')}</h1>
      <p className="mb-4">{t('description')}</p>
      
      <Link href="/" className="text-blue-500 hover:underline">
        {t('backHome')}
      </Link>
    </div>
  );
}
```

### 11. src/app/[locale]/not-found.tsx

```tsx
import {useTranslations} from 'next-intl';

export default function NotFound() {
  const t = useTranslations('NotFound');
  
  return (
    <div className="container mx-auto p-4 text-center">
      <h1 className="text-3xl font-bold mb-4">{t('title')}</h1>
      <p>{t('description')}</p>
    </div>
  );
}
```

### 12. src/app/[locale]/error.tsx

```tsx
'use client';

import {useTranslations} from 'next-intl';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('Error');

  return (
    <div className="container mx-auto p-4 text-center">
      <h1 className="text-3xl font-bold mb-4">{t('title')}</h1>
      <button 
        onClick={reset}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        {t('retry')}
      </button>
    </div>
  );
}
```

### 13. src/global.d.ts (Optional for TypeScript type augmentation)

```typescript
import {locales} from '@/i18n/routing';
import en from '../messages/en.json';

declare module 'next-intl' {
  interface AppConfig {
    // Type-safe messages
    Messages: typeof en;
    // Type-safe locales
    Locale: (typeof locales)[number];
  }
}
```

### 14. src/app/[locale]/[...rest]/page.tsx (Catch-all route for unknown paths)

```tsx
import {notFound} from 'next/navigation';

export default function CatchAllPage() {
  notFound();
}
```

With these files in place, you'll have a fully functional next-intl implementation in your Next.js 14 project with:
- Localized routing with URL prefixes (`/en/...`, `/de/...`)
- Type-safe translations
- Locale switching
- Error handling
- Page navigation

Make sure to adjust the structure based on your specific requirements, such as adding more languages or customizing the routing configuration.