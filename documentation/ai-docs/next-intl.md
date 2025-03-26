Blog
next-intl 4.0
next-intl 4.0
Mar 12, 2025 · by Jan Amann
After a year of feature development, this release focuses on streamlining the API surface while maintaining the core architecture of next-intl. With many improvements already released in previous minor versions, this update introduces several enhancements that will improve your development experience and make working with internationalization even more seamless.

Here’s what’s new in next-intl@4.0:

Revamped augmented types
Strictly-typed locale
Strictly-typed ICU arguments
GDPR compliance
Modernized build output
Improved inheritance in NextIntlClientProvider
Stricter config for domains
Preparation for upcoming Next.js features
Please also have a look at the other changes listed below before you upgrade.

Revamped augmented types
After type-safe Formats was added in next-intl@3.20, it became clear that a new API was needed that centralizes the registration of augmented types.

With next-intl@4.0, both Messages as well as Formats can now be registered under a single type that is scoped to next-intl and no longer affects the global scope:

// global.d.ts
 
import {formats} from '@/i18n/request';
import en from './messages/en.json';
 
declare module 'next-intl' {
  interface AppConfig {
    Messages: typeof en;
    Formats: typeof formats;
  }
}

See the updated TypeScript augmentation guide.

Strictly-typed locale
Building on the new type augmentation mechanism, next-intl@4.0 now allows you to strictly type locales across your app:

// global.d.ts
 
import {routing} from '@/i18n/routing';
 
declare module 'next-intl' {
  interface AppConfig {
    // ...
    Locale: (typeof routing.locales)[number];
  }
}

By doing so, APIs like useLocale() or <Link /> that either return or receive a locale will now pick up your app-specific Locale type, improving type safety across your app.

To simplify narrowing of string-based locales, a hasLocale function has been added. This can for example be used in i18n/request.ts to return a valid locale:

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

Furthermore, the Locale type can be imported into your app code in case you’re passing a locale to another function and want to ensure type safety:

import {Locale} from 'next-intl';
 
async function getPosts(locale: Locale) {
  // ...
}

Note that strictly-typing the Locale is optional and can be used as desired in case you wish to have additional guardrails in your app.

Strictly-typed ICU arguments
How type-safe can your app be?

The quest to bring type safety to the last corner of next-intl has led me down a rabbit hole with the discovery of an ICU parser by Marco Schumacher—written entirely in types. Marco kindly published his implementation for usage in next-intl, with me only adding support for rich tags on top.

Check it out:

// "Hello {name}"
t('message', {});
//           ^? {name: string}
 
// "It's {today, date, long}"
t('message', {});
//           ^? {today: Date}
 
// "Page {page, number} out of {total, number}"
t('message', {});
//           ^? {page: number, total: number}
 
// "You have {count, plural, =0 {no followers yet} one {one follower} other {# followers}}."
t('message', {});
//           ^? {count: number}
 
// "Country: {country, select, US {United States} CA {Canada} other {Other}}"
t('message', {});
//           ^? {country: 'US' | 'CA' | (string & {})}
 
// "Please refer to the <link>guidelines</link>."
t.rich('message', {});
//                ^? {link: (chunks: ReactNode) => ReactNode}

With this type inference in place, you can now use autocompletion in your IDE to get suggestions for the available arguments of a given ICU message and catch potential errors early.

This also addresses one of my favorite pet peeves:

t('followers', {count: 30000});

// ✖️ Would be: "30000 followers"
"{count} followers"
 
// ✅ Valid: "30,000 followers"
"{count, number} followers"

Due to a current limitation in TypeScript, this feature is opt-in for now. Please refer to the strict arguments docs to learn how to enable it.

GDPR compliance
In order to comply with the current GDPR regulations, the following changes have been made and are relevant to you if you’re using the next-intl middleware for i18n routing:

The locale cookie now defaults to a session cookie that expires when the browser is closed.
The locale cookie is now only set when a user switches to a locale that doesn’t match the accept-language header.
If you want to increase the cookie expiration, e.g. because you’re informing users about the usage of cookies or if GDPR doesn’t apply to your app, you can use the maxAge attribute to do so:

// i18n/routing.tsx
 
import {defineRouting} from 'next-intl/routing';
 
export const routing = defineRouting({
  // ...
 
  localeCookie: {
    // Expire in one year
    maxAge: 60 * 60 * 24 * 365
  }
});

Since the cookie is now only available after a locale switch, make sure to not rely on it always being present. E.g. if you need access to the user’s locale in a Route Handler, a reliable option is to provide the locale as a search param (e.g. /api/posts/12?locale=en).

As part of this change, disabling a cookie now requires you to set localeCookie: false in your routing configuration. Previously, localeDetection: false ambiguously also disabled the cookie from being set, but since a separate localeCookie option was introduced recently, this should now be used instead.

Learn more in the locale cookie docs.

Modernized build output
The build output of next-intl has been modernized and now leverages the following optimizations:

ESM-only: To enable enhanced tree-shaking and align with the modern JavaScript ecosystem, next-intl is now ESM-only. The only exception is next-intl/plugin which is published both as CommonJS as well as ESM, due to next.config.js still being popular.
Modern JSX transform: The peer dependency for React has been bumped to v17 in order to use the more efficient, modern JSX transform.
Modern syntax: Syntax is now compiled down to the Browserslist defaults query, which is a shortcut for “>0.5%, last 2 versions, Firefox ESR, not dead”—a baseline that is considered a reasonable target for modern apps.
If you’re using next-intl with Jest or Vitest, please also refer to the new testing docs.

With these changes, the bundle size of next-intl has been reduced by ~7% (PR #1470).

Improved inheritance of NextIntlClientProvider
Previously, NextIntlClientProvider would conservatively inherit only a subset from i18n/request.ts.

To improve the getting started experience, the provider by default now also inherits:

messages (PR #1682)
formats (PR #1191)
Due to this, you can now remove these props from NextIntlClientProvider if you’ve previously passed them manually:

<NextIntlClientProvider
-  messages={messages}
-  formats={formats}
>
  {/* ... */}
</NextIntlClientProvider>

If you don’t want to inherit these props, you can either opt-out via messages={null} and formats={null}, or by passing a specific value for these props.

With this, NextIntlClientProvider now inherits all of your configuration, with the minor exception of error handling functions. Since functions are not serializable, they cannot be passed across the server/client boundary. However, an alternative for this is also on the horizon.

To make it easier to work with error handling functions on the client side, NextIntlClientProvider can now also be used in a nested fashion and will inherit the configuration from a parent provider (PR #1413).

Stricter config for domains
So far, when using domains in combination with localePrefix: 'as-needed', next-intl had to make some tradeoffs to avoid reading the current host of the incoming request in components.

Now, by introducing two new constraints, next-intl can avoid these tradeoffs altogether:

A locale can now only be used for a single domain
Each domain now must specify its locales
The result is a simplified, more intuitive model that works as expected for this popular use case.

If you previously used locales across multiple domains, you now have to be more specific—typically by introducing a regional variant for a base language. You can additionally customize the prefixes if desired.

Example:

import {defineRouting} from 'next-intl/routing';
 
export const routing = defineRouting({
  locales: ['sv-SE', 'en-SE', 'no-NO', 'en-NO'],
  defaultLocale: 'en-SE',
  localePrefix: {
    mode: 'as-needed',
    prefixes: {
      'en-SE': '/en',
      'en-NO': '/en'
    }
  },
  domains: [
    {
      domain: 'example.se',
      defaultLocale: 'sv-SE',
      locales: ['sv-SE', 'en-SE']
    },
    {
      domain: 'example.no',
      defaultLocale: 'no-NO',
      locales: ['no-NO', 'en-NO']
    }
  ]
});

This will create the following structure:

example.se: sv-SE
example.se/en: en-SE
example.no: no-NO
example.no/en: en-NO
Learn more in the updated docs for domains.

Preparation for upcoming Next.js features
To ensure that the sails of next-intl are set for a steady course in the upcoming future, I’ve investigated the implications of upcoming Next.js features like ppr, dynamicIO and rootParams for next-intl.

This led to three minor changes:

If you don’t already have a NextIntlClientProvider in your app that wraps all Client Components that use next-intl, you now have to add one (see PR #1541 for details).
If you’re using format.relativeTime in Client Components, you may need to provide the now argument explicitly now (see PR #1536 for details).
If you’re using i18n routing, make sure you’ve updated to await requestLocale that was introduced in next-intl@3.22. The previously deprecated locale argument will serve an edge case in the future once rootParams is a thing (see PR #1625 for details).
While the mentioned Next.js features are still under development and may change, these changes seem reasonable to me in any case—and ideally will be all that’s necessary to adapt for next-intl to get the most out of these upcoming capabilities.

I’m particularly excited about the announcement of rootParams, as it seems like this will finally fill in the missing piece that enables apps with i18n routing to support static rendering without workarounds like setRequestLocale. I hope to have more to share on this soon!

Other changes
Return type-safe messages from useMessages and getMessages (see PR #1489)
Require locale to be returned from getRequestConfig (see PR #1486)
Allow to declare pathnames partially for convenience (see PR #1743)
Disallow passing null, undefined or boolean as an ICU argument (see PR #1561)
Bump minimum required TypeScript version to 5 for projects using TypeScript (see PR #1481)
Return x-default alternate link also for sub pages when using localePrefix: 'always' and update middleware matcher suggestion to /((?!api|_next|_vercel|.*\\..*).*) (see PR #1720)
Remove deprecated APIs (see PR #1479)
Remove deprecated APIs pt. 2 (see PR #1482)
Upgrade now
For a smooth upgrade, please initially upgrade to the latest v3.x version and check for deprecation warnings.

Afterwards, you can upgrade by running:

npm install next-intl@4

I’d love to hear about your experiences with next-intl@4.0! Join the conversation in the discussions.

Thank you!

App Router setup with i18n routing
In order to use unique pathnames for every language that your app supports, next-intl can be used to handle the following routing setups:

Prefix-based routing (e.g. /en/about)
Domain-based routing (e.g. en.example.com/about)
In either case, next-intl integrates with the App Router by using a top-level [locale] dynamic segment that can be used to provide content in different languages.

Getting started
If you haven’t done so already, create a Next.js app that uses the App Router and run:

npm install next-intl

Now, we’re going to create the following file structure:

├── messages
│   ├── en.json
│   └── ...
├── next.config.ts
└── src
    ├── i18n
    │   ├── routing.ts
    │   ├── navigation.ts
    │   └── request.ts
    ├── middleware.ts
    └── app
        └── [locale]
            ├── layout.tsx
            └── page.tsx

In case you’re migrating an existing app to next-intl, you’ll typically move your existing pages into the [locale] folder as part of the setup.

Let’s set up the files:

messages/en.json
Messages represent the translations that are available per language and can be provided either locally or loaded from a remote data source.

The simplest option is to add JSON files in your local project folder:

messages/en.json
{
  "HomePage": {
    "title": "Hello world!",
    "about": "Go to the about page"
  }
}

next.config.ts
Now, set up the plugin which creates an alias to provide a request-specific i18n configuration like your messages to Server Components—more on this in the following steps.

next.config.ts
import {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
 
const nextConfig: NextConfig = {};
 
const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);

src/i18n/routing.ts
We’ll integrate with Next.js’ routing in two places:

Middleware: Negotiates the locale and handles redirects & rewrites (e.g. / → /en)
Navigation APIs: Lightweight wrappers around Next.js’ navigation APIs like <Link />
This enables you to work with pathnames like /about, while i18n aspects like language prefixes are handled behind the scenes.

To share the configuration between these two places, we’ll set up routing.ts:

src/i18n/routing.ts
import {defineRouting} from 'next-intl/routing';
 
export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'de'],
 
  // Used when no locale matches
  defaultLocale: 'en'
});

Depending on your requirements, you may wish to customize your routing configuration later—but let’s finish with the setup first.

src/i18n/navigation.ts
Once we have our routing configuration in place, we can use it to set up the navigation APIs.

src/i18n/navigation.ts
import {createNavigation} from 'next-intl/navigation';
import {routing} from './routing';
 
// Lightweight wrappers around Next.js' navigation
// APIs that consider the routing configuration
export const {Link, redirect, usePathname, useRouter, getPathname} =
  createNavigation(routing);

src/middleware.ts
Additionally, we can use our routing configuration to set up the middleware.

src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
 
export default createMiddleware(routing);
 
export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
};

src/i18n/request.ts
When using features from next-intl in Server Components, the relevant configuration is read from a central module that is located at i18n/request.ts by convention. This configuration is scoped to the current request and can be used to provide messages and other options based on the user’s locale.

src/i18n/request.ts
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

src/app/[locale]/layout.tsx
The locale that was matched by the middleware is available via the locale param and can be used to configure the document language. Additionally, we can use this place to pass configuration from i18n/request.ts to Client Components via NextIntlClientProvider.

app/[locale]/layout.tsx
import {NextIntlClientProvider, hasLocale} from 'next-intl';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
 
export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  // Ensure that the incoming `locale` is valid
  const {locale} = await params;
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

src/app/[locale]/page.tsx
And that’s it!

Now you can use translations and other functionality from next-intl in your components:

app/[locale]/page.tsx
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
 
export default function HomePage() {
  const t = useTranslations('HomePage');
  return (
    <div>
      <h1>{t('title')}</h1>
      <Link href="/about">{t('about')}</Link>
    </div>
  );
}

In case you ran into an issue, have a look at the App Router example to explore a working app.

Next steps:

Usage guide: Learn how to format messages, dates and times

Routing: Set up localized pathnames, domain-based routing & more

Workflows: Integrate deeply with TypeScript and other tools

Static rendering
When using the setup with i18n routing, next-intl will currently opt into dynamic rendering when APIs like useTranslations are used in Server Components. This is a limitation that we aim to remove in the future, but as a stopgap solution, next-intl provides a temporary API that can be used to enable static rendering.

Add generateStaticParams
Since we are using a dynamic route segment for the [locale] param, we need to pass all possible values to Next.js via generateStaticParams so that the routes can be rendered at build time.

Depending on your needs, you can add generateStaticParams either to a layout or pages:

Layout: Enables static rendering for all pages within this layout (e.g. app/[locale]/layout.tsx)
Individual pages: Enables static rendering for a specific page (e.g. app/[locale]/page.tsx)
Example:

import {routing} from '@/i18n/routing';
 
export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

Add setRequestLocale to all relevant layouts and pages
next-intl provides an API that can be used to distribute the locale that is received via params in layouts and pages for usage in all Server Components that are rendered as part of the request.

app/[locale]/layout.tsx
import {setRequestLocale} from 'next-intl/server';
import {hasLocale} from 'next-intl';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
 
export default async function LocaleLayout({children, params}) {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
 
  // Enable static rendering
  setRequestLocale(locale);
 
  return (
    // ...
  );
}

app/[locale]/page.tsx
import {setRequestLocale} from 'next-intl/server';
 
export default function IndexPage({params}) {
  const {locale} = use(params);
 
  // Enable static rendering
  setRequestLocale(locale);
 
  // Once the request locale is set, you
  // can call hooks from `next-intl`
  const t = useTranslations('IndexPage');
 
  return (
    // ...
  );
}

Keep in mind that:

The locale that you pass to setRequestLocale should be validated (e.g. in your root layout).
You need to call this function in every page and every layout that you intend to enable static rendering for since Next.js can render layouts and pages independently.
setRequestLocale needs to be called before you invoke any functions from next-intl like useTranslations or getMessages.
Use the locale param in metadata
In addition to the rendering of your pages, also page metadata needs to qualify for static rendering.

To achieve this, you can forward the locale that you receive from Next.js via params to the awaitable functions from next-intl.

page.tsx
import {getTranslations} from 'next-intl/server';
 
export async function generateMetadata({params}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'Metadata'});
 
  return {
    title: t('title')
  };
}

Last updated on March 21, 2025

Rendering i18n messages
The main part of handling internationalization (typically referred to as i18n) in your Next.js app is to provide messages based on the language of the user.

Terminology
Locale: We use this term to describe an identifier that contains the language and formatting preferences of users. Apart from the language, a locale can include optional regional information (e.g. en-US).
Messages: These are collections of namespace-label pairs that are grouped by locale (e.g. en-US.json).
Structuring messages
To group your messages within a locale, it’s recommended to use component names as namespaces and embrace them as the primary unit of code organization in your app. You can of course also use a different structure, depending on what suits your app best.

en.json
{
  "About": {
    "title": "About us"
  }
}

You can render messages from within a React component via the useTranslations hook:

About.tsx
import {useTranslations} from 'next-intl';
 
function About() {
  const t = useTranslations('About');
  return <h1>{t('title')}</h1>;
}

To retrieve all available messages in a component, you can omit the namespace path:

const t = useTranslations();
 
t('About.title');

Translators can collaborate on messages by using a localization management solution like Crowdin.

Rendering messages with useTranslations
next-intl uses ICU message syntax that allows you to express language nuances and separates state handling within messages from your app code.

Static messages
Static messages will be used as-is:

en.json
"message": "Hello world!"

t('message'); // "Hello world!"

Interpolation of dynamic values
Dynamic values can be inserted into messages by using curly braces:

en.json
"message": "Hello {name}!"

t('message', {name: 'Jane'}); // "Hello Jane!"

Cardinal pluralization
To express the pluralization of a given number of items, the plural argument can be used:

en.json
"message": "You have {count, plural, =0 {no followers yet} =1 {one follower} other {# followers}}."

t('message', {count: 3580}); // "You have 3,580 followers."

Note that by using the # marker, the value will be formatted as a number.

Ordinal pluralization
To apply pluralization based on an order of items, the selectordinal argument can be used:

en.json
"message": "It's your {year, selectordinal, one {#st} two {#nd} few {#rd} other {#th}} birthday!"

Selecting enum-based values
To map identifiers to human readable labels, you can use the select argument that works similar to the switch statement in JavaScript:

en.json
"message": "{gender, select, female {She} male {He} other {They}} is online."

t('message', {gender: 'female'}); // "She is online."

Note: The other case is required and will be used when none of the specific values match.

Escaping
Since curly braces are used for interpolating dynamic values, you can escape them with the ' marker to use the actual symbol in messages:

en.json
"message": "Escape curly braces with single quotes (e.g. '{name'})"

t('message'); // "Escape curly braces with single quotes (e.g. {name})"

Rich text
You can format rich text with custom tags and map them to React components via t.rich:

en.json
{
  "message": "Please refer to <guidelines>the guidelines</guidelines>."
}

// Returns `<>Please refer to <a href="/guidelines">the guidelines</a>.</>`
t.rich('message', {
  guidelines: (chunks) => <a href="/guidelines">{chunks}</a>
});

Tags can be arbitrarily nested (e.g. This is <important><very>very</very> important</important>).

HTML markup
To render rich text, you typically want to use rich text formatting. However, if you have a use case where you need to emit raw HTML markup, you can use the t.markup function:

en.json
{
  "markup": "This is <important>important</important>"
}

// Returns 'This is <b>important</b>'
t.markup('markup', {
  important: (chunks) => `<b>${chunks}</b>`
});

Note that unlike t.rich, the provided markup functions accept chunks as a string and also return a string where the chunks are wrapped accordingly.

Raw messages
Messages are always parsed and therefore e.g. for rich text formatting you need to supply the necessary tags. If you want to avoid the parsing, e.g. because you have raw HTML stored in a message, there’s a separate API for this use case:

en.json
{
  "content": "<h1>Headline</h1><p>This is raw HTML</p>"
}

<div dangerouslySetInnerHTML={{__html: t.raw('content')}} />

Important: You should always sanitize the content that you pass to dangerouslySetInnerHTML to avoid cross-site scripting attacks.

The value of a raw message can be any valid JSON value: strings, booleans, objects and arrays.

Optional messages
If you have messages that are only available for certain locales, you can use the t.has function to check whether a message is available for the current locale:

const t = useTranslations('About');
 
t.has('title'); // true
t.has('unknown'); // false

Note that separately from this, you can also provide fallback messages, e.g. from the default locale, in case you have incomplete messages for certain locales.

Arrays of messages
If you need to render a list of messages, the recommended approach is to map an array of keys to the corresponding messages:

en.json
{
  "CompanyStats": {
    "yearsOfService": {
      "title": "Years of service",
      "value": "34"
    },
    "happyClients": {
      "title": "Happy clients",
      "value": "1.000+"
    },
    "partners": {
      "title": "Products",
      "value": "5.000+"
    }
  }
}

CompanyStats.tsx
import {useTranslations} from 'next-intl';
 
function CompanyStats() {
  const t = useTranslations('CompanyStats');
  const keys = ['yearsOfService', 'happyClients', 'partners'] as const;
 
  return (
    <ul>
      {keys.map((key) => (
        <li key={key}>
          <h2>{t(`${key}.title`)}</h2>
          <p>{t(`${key}.value`)}</p>
        </li>
      ))}
    </ul>
  );
}

Right-to-left languages
Languages such as Arabic, Hebrew and Persian use right-to-left script (often abbreviated as RTL). For these languages, writing begins on the right side of the page and continues to the left.

Example:

النص في اللغة العربية _مثلا_ يُقرأ من اليمين لليسار

In addition to providing translated messages, proper RTL localization requires:

Providing the dir attribute on the document
Layout mirroring, e.g. by using CSS logical properties
Element mirroring, e.g. by customizing icons
To handle these cases in your components, you can use the rtl-detect package:

layout.tsx
import {getLangDir} from 'rtl-detect';
 
export default async function RootLayout(/* ... */) {
  const locale = await getLocale();
  const direction = getLangDir(locale);
 
  return (
    <html lang={locale} dir={direction}>
      {/* ... */}
    </html>
  );
}

components/Breadcrumbs.tsx
import {useTranslations} from 'next-intl';
import {getLangDir} from 'rtl-detect';
 
export default function Breadcrumbs({children, params}) {
  const t = useTranslations('Breadcrumbs');
  const locale = useLocale();
  const direction = getLangDir(locale);
 
  return (
    <div style={{display: 'flex'}}>
      <p>{t('home')}</p>
      <div style={{marginInlineStart: 10}}>
        {direction === 'ltr' ? <ArrowRight /> : <ArrowLeft />}
      </div>
      <p style={{marginInlineStart: 10}}>{t('about')}</p>
    </div>
  );
}

Last updated on March 12, 2025

Number formatting
The formatting of numbers can vary depending on the user’s locale and may include different rules such as:

Decimal separators (e.g. “12.3” in en-US vs. “12,3” in de-DE)
Digit grouping (e.g. “120,000” in en-US vs. “1,20,000” in hi-IN)
Currency sign position (e.g. “12 €” in de-DE vs. ”€ 12” in de-AT)
By using the formatting capabilities provided by next-intl, you can adjust to these variations and ensure that numbers are displayed accurately across your Next.js app for all users.

Formatting plain numbers
When you’re formatting plain numbers that are not part of a message, you can use a separate hook:

import {useFormatter} from 'next-intl';
 
function Component() {
  const format = useFormatter();
 
  // Renders "$499.90"
  format.number(499.9, {style: 'currency', currency: 'USD'});
}

See the MDN docs about NumberFormat to learn more about the options you can pass to the number function or try the interactive explorer for Intl.NumberFormat.

If you have global formats configured, you can reference them by passing a name as the second argument:

// Use a global format
format.number(499.9, 'precise');
 
// Optionally override some options
format.number(499.9, 'price', {currency: 'USD'});

Numbers within messages
Numbers can be embedded within messages by using the ICU syntax.

en.json
{
  "basic": "Basic formatting: {value, number}",
  "percentage": "Displayed as a percentage: {value, number, percent}",
  "custom": "At most 2 fraction digits: {value, number, ::.##}"
}

Note the leading :: that is used to indicate that a skeleton should be used. See the ICU docs about number skeletons to learn more about this.

These formats are supported out of the box: currency and percent.

If you work with translators, it can be helpful for them to use an editor that supports the ICU syntax for numbers (e.g. the Crowdin Editor).

Custom number formats
To use custom formats in messages, you can provide formatters that can be referenced by name.

en.json
{
  "price": "This product costs {price, number, currency}"
}

t(
  'price',
  {price: 32000.99},
  {
    number: {
      currency: {
        style: 'currency',
        currency: 'EUR'
      }
    }
  }
);

To reuse number formats for multiple components, you can configure global formats.

Date and time formatting
The formatting of dates and times varies greatly between locales (e.g. “Apr 24, 2023” in en-US vs. “24 квіт. 2023 р.” in uk-UA). By using the formatting capabilities of next-intl, you can handle i18n differences in your Next.js app automatically.

Formatting dates and times
You can format plain dates that are not part of a message with the dateTime function that is returned from the useFormatter hook:

import {useFormatter} from 'next-intl';
 
function Component() {
  const format = useFormatter();
  const dateTime = new Date('2020-11-20T10:36:01.516Z');
 
  // Renders "Nov 20, 2020"
  format.dateTime(dateTime, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
 
  // Renders "11:36 AM"
  format.dateTime(dateTime, {hour: 'numeric', minute: 'numeric'});
}

See the MDN docs about DateTimeFormat to learn more about the options that you can provide to the dateTime function or try the interactive explorer for Intl.DateTimeFormat.

If you have global formats configured, you can reference them by passing a name as the second argument:

// Use a global format
format.dateTime(dateTime, 'short');
 
// Optionally override some options
format.dateTime(dateTime, 'short', {year: 'numeric'});

Formatting relative times
You can format plain dates that are not part of a message with the relativeTime function:

import {useFormatter} from 'next-intl';
 
function Component() {
  const format = useFormatter();
  const dateTime = new Date('2020-11-20T08:30:00.000Z');
 
  // A reference point in time
  const now = new Date('2020-11-20T10:36:00.000Z');
 
  // This will render "2 hours ago"
  format.relativeTime(dateTime, now);
}

Note that values are rounded, so e.g. if 126 minutes have passed, “2 hours ago” will be returned.

useNow
Since providing now is a common pattern, next-intl provides a convenience hook that can be used to retrieve the current date and time:

import {useNow, useFormatter} from 'next-intl';
 
function FormattedDate({date}) {
  const now = useNow();
  const format = useFormatter();
 
  format.relativeTime(date, now);
}

In contrast to simply calling new Date() in your component, useNow has some benefits:

The returned value is consistent across re-renders on the client side.
The value can optionally be updated continuously based on an interval.
The value can optionally be initialized from a global value, e.g. allowing you to use a static now value to ensure consistency when running tests. If a global value is not provided, useNow will use the current time.
updateInterval
In case you want a relative time value to update over time, you can do so with the useNow hook:

import {useNow, useFormatter} from 'next-intl';
 
function Component() {
  // Use the global now value initially …
  const now = useNow({
    // … and update it every 10 seconds
    updateInterval: 1000 * 10
  });
 
  const format = useFormatter();
  const dateTime = new Date('2020-11-20T10:36:01.516Z');
 
  // Renders e.g. "2 hours ago" and updates continuously
  format.relativeTime(dateTime, now);
}

Customizing the unit
By default, relativeTime will pick a unit based on the difference between the passed date and now like “3 seconds” or “5 days”.

If you want to use a specific unit, you can provide options via the second argument:

import {useFormatter} from 'next-intl';
 
function Component() {
  const format = useFormatter();
  const dateTime = new Date('2020-03-20T08:30:00.000Z');
  const now = new Date('2020-11-22T10:36:00.000Z');
 
  // Renders "247 days ago"
  format.relativeTime(dateTime, {now, unit: 'day'});
}

Formatting date and time ranges
You can format ranges of dates and times with the dateTimeRange function:

import {useFormatter} from 'next-intl';
 
function Component() {
  const format = useFormatter();
  const dateTimeA = new Date('2020-11-20T08:30:00.000Z');
  const dateTimeB = new Date('2021-01-24T08:30:00.000Z');
 
  // Renders "Nov 20, 2020 – Jan 24, 2021"
  format.dateTimeRange(dateTimeA, dateTimeB, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

If you have global formats configured, you can reference them by passing a name as the third argument:

// Use a global format
format.dateTimeRange(dateTimeA, dateTimeB, 'short');
 
// Optionally override some options
format.dateTimeRange(dateTimeA, dateTimeB, 'short', {year: 'numeric'});

Dates and times within messages
Dates and times can be embedded within messages by using the ICU syntax.

en.json
{
  "ordered": "Ordered on {orderDate, date, medium}"
}

These formats are supported out of the box: full, long, medium and short.

If you work with translators, it can be helpful for them to use an editor that supports the ICU syntax for dates and times (e.g. the Crowdin Editor).

You can customize the formatting by using date skeletons:

en.json
{
  // Renders e.g. "Ordered on Jul 9, 2024"
  "ordered": "Ordered on {orderDate, date, ::yyyyMMMd}"
}

Note the leading :: that is used to indicate that a skeleton should be used.

These formats from ICU are supported:

Symbol	Meaning	Pattern	Example
G	Era designator (includes the date)	G
GGGG
GGGGG	7/9/2024 AD
7/9/2024 Anno Domini
7/9/2024 A
y	Year	y
yy
yyyy	2024
24
2024
M	Month in year	M
MM
MMM
MMMM
MMMMM
7
07
Jul
July
J
d	Day in month	d
dd	9
09
E	Day of week	E
EEEE
EEEEE	Tue
Tuesday
T
h	Hour (1-12)	h
hh	9 AM
09 AM
K	Hour (0-11)	K
KK	0 AM (12 AM with h)
00 AM
H	Hour (0-23)	HH	09
k	Hour (1-24)	kk	24 (00 with H)
m	Minute (2 digits if used with seconds)	m
mmss	6
06:03
s	Second (2 digits if used with minutes)	s
mmss	3
06:03
z	Time zone	z
zzzz	GMT+2
Central European Summer Time
Patterns can be combined with each other, therefore e.g. yyyyMMMd would return “Jul 9, 2024”.

Custom date and time formats
To use custom formats in messages, you can provide formatters based on DateTimeFormat options that can be referenced by name.

en.json
{
  "ordered": "Ordered on {orderDate, date, short}"
}

t(
  'ordered',
  {orderDate: new Date('2020-11-20T10:36:01.516Z')},
  {
    dateTime: {
      short: {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }
    }
  }
);

To reuse date and time formats for multiple components, you can configure global formats.

Last updated on March 12, 2025

List formatting
When working with lists of items, you might want to format them as conjunctions or disjunctions.

Formatting aspects, like the used separators, differ per locale:

“HTML, CSS, and JavaScript” in en-US
“HTML, CSS und JavaScript” in de-DE
List formatting can be applied with the useFormatter hook:

import {useFormatter} from 'next-intl';
 
function Component() {
  const format = useFormatter();
  const items = ['HTML', 'CSS', 'JavaScript'];
 
  // Renders "HTML, CSS, and JavaScript"
  format.list(items, {type: 'conjunction'});
 
  // Renders "HTML, CSS, or JavaScript"
  format.list(items, {type: 'disjunction'});
}

See the MDN docs about ListFormat to learn more about the options that you can provide to the list function or try the interactive explorer for Intl.ListFormat).

Note that lists can currently only be formatted via useFormatter, there’s no equivalent inline syntax for messages at this point.

To reuse list formats for multiple components, you can configure global formats.

Formatting of React elements
Apart from string values, you can also pass arrays of React elements to the formatting function:

import {useFormatter} from 'next-intl';
 
function Component() {
  const format = useFormatter();
 
  const users = [
    {id: 1, name: 'Alice'},
    {id: 2, name: 'Bob'},
    {id: 3, name: 'Charlie'}
  ];
 
  const items = users.map((user) => (
    <a key={user.id} href={`/user/${user.id}`}>
      {user.name}
    </a>
  ));
 
  return <p>{format.list(items)}</p>;
}

Result:

<p>
  <a href="/user/1">Alice</a>, <a href="/user/2">Bob</a>, and
  <a href="/user/3">Charlie</a>
</p>

Note that format.list will return an Iterable<ReactElement> in this case.

Last updated on October 23, 2024

Global configuration
Configuration properties that you use across your Next.js app can be set globally.

Server & Client Components
Depending on if you handle internationalization in Server- or Client Components, the configuration from i18n/request.ts or NextIntlClientProvider will be applied respectively.

i18n/request.ts & getRequestConfig
i18n/request.ts can be used to provide configuration for server-only code, i.e. Server Components, Server Actions & friends. The configuration is provided via the getRequestConfig function and needs to be set up based on whether you’re using i18n routing or not.

i18n/request.ts
import {getRequestConfig} from 'next-intl/server';
import {routing} from '@/i18n/routing';
 
export default getRequestConfig(async ({requestLocale}) => {
  // ...
 
  return {
    locale,
    messages
    // ...
  };
});

The configuration object is created once for each request by internally using React’s cache. The first component to use internationalization will call the function defined with getRequestConfig.

Since this function is executed during the Server Components render pass, you can call functions like cookies() and headers() to return configuration that is request-specific.

NextIntlClientProvider
NextIntlClientProvider can be used to provide configuration for Client Components.

layout.tsx
import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
 
export default async function RootLayout(/* ... */) {
  // ...
 
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}

These props are inherited if you’re rendering NextIntlClientProvider from a Server Component:

locale
messages
now
timeZone
formats
In contrast, these props can be provided as necessary:

onError
getMessageFallback
Additionally, nested instances of NextIntlClientProvider will inherit configuration from their respective ancestors. Note however that individual props are treated as atomic, therefore e.g. messages need to be merged manually—if necessary.

Locale
The locale represents an identifier that contains the language and formatting preferences of users, optionally including regional information (e.g. en-US). Locales are specified as IETF BCP 47 language tags.

Depending on if you’re using i18n routing, you can read the locale from the requestLocale parameter or provide a value on your own:

With i18n routing:

i18n/request.ts
export default getRequestConfig(async ({requestLocale}) => {
  // Typically corresponds to the `[locale]` segment
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;
 
  return {
    locale
    // ...
  };
});

Without i18n routing:

i18n/request.ts
export default getRequestConfig(async () => {
  // Provide a static locale, fetch a user setting,
  // read from `cookies()`, `headers()`, etc.
  const locale = 'en';
 
  return {
    locale
    // ...
  };
});

useLocale & getLocale
The current locale of your app is automatically incorporated into hooks like useTranslations & useFormatter and will affect the rendered output.

In case you need to use this value in other places of your app, e.g. to implement a locale switcher or to pass it to API calls, you can read it via useLocale or getLocale:

// Regular components
import {useLocale} from 'next-intl';
const locale = useLocale();
 
// Async Server Components
import {getLocale} from 'next-intl/server';
const locale = await getLocale();

Locale type
When passing a locale to another function, you can use the Locale type for the receiving parameter:

import {Locale} from 'next-intl';
 
async function getPosts(locale: Locale) {
  // ...
}

By default, Locale is typed as string. However, you can optionally provide a strict union based on your supported locales for this type by augmenting the Locale type.

Messages
The most crucial aspect of internationalization is providing labels based on the user’s language. The recommended workflow is to store your messages in your repository along with the code.

├── messages
│   ├── en.json
│   ├── de-AT.json
│   └── ...
...

Colocating your messages with app code is beneficial because it allows developers to make changes quickly and additionally, you can use the shape of your local messages for type checking. Translators can collaborate on messages by using CI tools, such as Crowdin’s GitHub integration, which allows changes to be synchronized directly into your code repository.

That being said, next-intl is agnostic to how you store messages and allows you to freely define an async function that fetches them while your app renders:

i18n/request.ts
import {getRequestConfig} from 'next-intl/server';
 
export default getRequestConfig(async () => {
  return {
    messages: (await import(`../../messages/${locale}.json`)).default
    // ...
  };
});

After messages are configured, they can be used via useTranslations.

useMessages & getMessages
In case you require access to messages in a component, you can read them via useMessages() or getMessages() from your configuration:

// Regular components
import {useMessages} from 'next-intl';
const messages = useMessages();
 
// Async Server Components
import {getMessages} from 'next-intl/server';
const messages = await getMessages();

Time zone
Specifying a time zone affects the rendering of dates and times. By default, the time zone of the server runtime will be used, but can be customized as necessary.

i18n/request.ts
import {getRequestConfig} from 'next-intl/server';
 
export default getRequestConfig(async () => {
  return {
    // The time zone can either be statically defined, read from the
    // user profile if you store such a setting, or based on dynamic
    // request information like the locale or a cookie.
    timeZone: 'Europe/Vienna'
 
    // ...
  };
});

The available time zone names can be looked up in the tz database.

The time zone in Client Components is automatically inherited from the server side if you wrap the relevant components in a NextIntlClientProvider that is rendered by a Server Component. For all other cases, you can specify the value explicitly on a wrapping NextIntlClientProvider.

useTimeZone & getTimeZone
The configured time zone can be read via useTimeZone or getTimeZone in components:

// Regular components
import {useTimeZone} from 'next-intl';
const timeZone = useTimeZone();
 
// Async Server Components
import {getTimeZone} from 'next-intl/server';
const timeZone = await getTimeZone();

Now value
When formatting relative dates and times, next-intl will format times in relation to a reference point in time that is referred to as “now”. While it can be beneficial in terms of caching to provide this value where necessary, you can provide a global value for now, e.g. to ensure consistency when running tests.

i18n/request.ts
import {getRequestConfig} from 'next-intl/server';
 
export default getRequestConfig(async () => {
  return {
    now: new Date('2024-11-14T10:36:01.516Z')
 
    // ...
  };
});

If a now value is provided in i18n/request.ts, this will automatically be inherited by Client Components if you wrap them in a NextIntlClientProvider that is rendered by a Server Component.

useNow & getNow
The configured now value can be read in components via useNow or getNow:

// Regular components
import {useNow} from 'next-intl';
const now = useNow();
 
// Async Server Components
import {getNow} from 'next-intl/server';
const now = await getNow();

Note that the returned value defaults to the current date and time, therefore making this hook useful when providing now for format.relativeTime even when you haven’t configured a global now value.

Formats
To achieve consistent date, time, number and list formatting, you can define a set of global formats.

i18n/request.ts
import {getRequestConfig} from 'next-intl/server';
 
export default getRequestConfig(async () => {
  return {
    formats: {
      dateTime: {
        short: {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }
      },
      number: {
        precise: {
          maximumFractionDigits: 5
        }
      },
      list: {
        enumeration: {
          style: 'long',
          type: 'conjunction'
        }
      }
    }
 
    // ...
  };
});

Once you have formats set up, you can use them in your components via useFormatter:

import {useFormatter} from 'next-intl';
 
function Component() {
  const format = useFormatter();
 
  format.dateTime(new Date('2020-11-20T10:36:01.516Z'), 'short');
  format.number(47.414329182, 'precise');
  format.list(['HTML', 'CSS', 'JavaScript'], 'enumeration');
}

By default, format names are loosely typed as string. However, you can optionally use strict types by augmenting the Formats type.

Global formats for numbers, dates and times can be referenced in messages too:

en.json
{
  "ordered": "You've ordered this product on {orderDate, date, short}",
  "latitude": "Latitude: {latitude, number, precise}"
}

import {useTranslations} from 'next-intl';
 
function Component() {
  const t = useTranslations();
 
  t('ordered', {orderDate: new Date('2020-11-20T10:36:01.516Z')});
  t('latitude', {latitude: 47.414329182});
}

Formats are automatically inherited from the server side if you wrap the relevant components in a NextIntlClientProvider that is rendered by a Server Component.

Error handling (onError & getMessageFallback)
By default, when a message fails to resolve or when the formatting failed, an error will be printed on the console. In this case ${namespace}.${key} will be rendered instead to keep your app running.

This behavior can be customized with the onError and getMessageFallback configuration option.

i18n/request.ts
import {getRequestConfig} from 'next-intl/server';
import {IntlErrorCode} from 'next-intl';
 
export default getRequestConfig(async () => {
  return {
    onError(error) {
      if (error.code === IntlErrorCode.MISSING_MESSAGE) {
        // Missing translations are expected and should only log an error
        console.error(error);
      } else {
        // Other errors indicate a bug in the app and should be reported
        reportToErrorTracking(error);
      }
    },
 
    getMessageFallback({namespace, key, error}) {
      const path = [namespace, key].filter((part) => part != null).join('.');
 
      if (error.code === IntlErrorCode.MISSING_MESSAGE) {
        return path + ' is not yet translated';
      } else {
        return 'Dear developer, please fix this message: ' + path;
      }
    }
 
    // ...
  };
});

Note that onError and getMessageFallback are not automatically inherited by Client Components. If you want to make this functionality available in Client Components too, you can however create a client-side provider that defines these props.

Last updated on March 12, 2025

Routing
Routing APIs are only needed when you’re using i18n routing.

next-intl integrates with the routing system of Next.js in two places:

Middleware: Negotiates the locale and handles redirects & rewrites (e.g. / → /en)
Navigation APIs: Lightweight wrappers around Next.js’ navigation APIs like <Link />
This enables you to express your app in terms of APIs like <Link href="/about">, while aspects like the locale and user-facing pathnames are automatically handled behind the scenes (e.g. /de/ueber-uns).

defineRouting
The routing configuration that is shared between the middleware and the navigation APIs can be defined with the defineRouting function.

src/i18n/routing.ts
import {defineRouting} from 'next-intl/routing';
 
export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'de'],
 
  // Used when no locale matches
  defaultLocale: 'en'
});

Depending on your routing needs, you may wish to consider further settings—see below.

localePrefix
By default, the pathnames of your app will be available under a prefix that matches your directory structure (e.g. /en/about → app/[locale]/about/page.tsx). You can however adapt the routing to optionally remove the prefix or customize it per locale by configuring the localePrefix setting.

localePrefix: 'always' (default)
By default, pathnames always start with the locale (e.g. /en/about).

routing.ts
import {defineRouting} from 'next-intl/routing';
 
export const routing = defineRouting({
  // ...
  localePrefix: 'always'
});

localePrefix: 'as-needed'
If you want to use no prefix for the default locale (e.g. /about) while keeping it for other locales (e.g. /de/about), you can configure your routing accordingly:

routing.ts
import {defineRouting} from 'next-intl/routing';
 
export const routing = defineRouting({
  // ...
  localePrefix: 'as-needed'
});

Note that:

If you use this routing strategy, make sure that your middleware matcher detects unprefixed pathnames.
The middleware will by default set a cookie to remember the user’s locale preference. If no explicit locale prefix is present in the pathname, then locale detection will potentially redirect users to the latest locale that was matched based on the cookie value (e.g. / → /de).
If a superfluous locale prefix like /en/about is requested, the middleware will automatically redirect to the unprefixed version /about. This can be helpful in case you’re redirecting from another locale and you want to update a potential cookie value first (e.g. <Link /> relies on this mechanism).
localePrefix: 'never'
If you’d like to provide a locale to next-intl, e.g. based on user settings, you can consider setting up next-intl without i18n routing. This way, you don’t need to use the routing integration in the first place.

However, you can also configure the middleware to never show a locale prefix in the URL, which can be helpful in the following cases:

You want to use domain-based routing and have only one locale per domain
You want to use a cookie to determine the locale while enabling static rendering
routing.ts
import {defineRouting} from 'next-intl/routing';
 
export const routing = defineRouting({
  // ...
  localePrefix: 'never'
});

In this case, requests for all locales will be rewritten to have the locale only prefixed internally. You still need to place all your pages inside a [locale] folder for the routes to be able to receive the locale param.

Note that:

If you use this routing strategy, make sure that your middleware matcher detects unprefixed pathnames.
Alternate links are disabled in this mode since URLs might not be unique per locale. Due to this, consider including these yourself, or set up a sitemap that links localized pages via alternates.
You can consider increasing the maxAge attribute of the locale cookie to a longer duration to remember the user’s preference across sessions.
prefixes
If you’d like to customize the user-facing prefix, you can provide a locale-based mapping:

routing.ts
import {defineRouting} from 'next-intl/routing';
 
export const routing = defineRouting({
  locales: ['en-US', 'de-AT', 'zh'],
  defaultLocale: 'en-US',
  localePrefix: {
    mode: 'always',
    prefixes: {
      'en-US': '/us',
      'de-AT': '/eu/at'
      // (/zh will be used as-is)
    }
  }
});

Note that:

You should adapt your middleware matcher to match the custom prefixes.
Custom prefixes are only visible to the user and rewritten internally to the corresponding locale. Therefore, the [locale] segment corresponds to the locale, not the prefix.
pathnames
Many apps choose to localize pathnames, especially when search engine optimization is relevant.

Example:

/en/about
/de/ueber-uns
Since you typically want to define these routes only once internally, you can use the next-intl middleware to rewrite such incoming requests to shared pathnames.

routing.ts
import {defineRouting} from 'next-intl/routing';
 
export const routing = defineRouting({
  locales: ['en-US', 'en-UK', 'de'],
  defaultLocale: 'en-US',
 
  // The `pathnames` object holds pairs of internal and
  // external paths. Based on the locale, the external
  // paths are rewritten to the shared, internal ones.
  pathnames: {
    // If all locales use the same pathname, a single
    // external path can be used for all locales
    '/': '/',
    '/blog': '/blog',
 
    // If some locales use different paths, you can
    // specify the relevant external pathnames
    '/about': {
      de: '/ueber-uns'
    },
 
    // Dynamic params are supported via square brackets
    '/news/[articleSlug]': {
      de: '/neuigkeiten/[articleSlug]'
    },
 
    // Static pathnames that overlap with dynamic segments
    // will be prioritized over the dynamic segment
    '/news/just-in': {
      de: '/neuigkeiten/aktuell'
    },
 
    // Also (optional) catch-all segments are supported
    '/categories/[...slug]': {
      de: '/kategorien/[...slug]'
    }
  }
});

Localized pathnames map to a single internal pathname that is created via the file-system based routing in Next.js. In the example above, /de/ueber-uns will be handled by the page at /[locale]/about/page.tsx.

domains
If you want to serve your localized content based on different domains, you can provide a list of mappings between domains and locales via the domains setting.

Examples:

us.example.com: en-US
ca.example.com: en-CA
ca.example.com/fr: fr-CA
fr.example.com: fr-FR
In many cases, domains are combined with a localePrefix setting to achieve results as shown above. Also custom prefixes can be used to customize the user-facing prefix per locale.

routing.ts
import {defineRouting} from 'next-intl/routing';
 
export const routing = defineRouting({
  locales: ['en-US', 'en-CA', 'fr-CA', 'fr-FR'],
  defaultLocale: 'en-US',
  domains: [
    {
      domain: 'us.example.com',
      defaultLocale: 'en-US',
      locales: ['en-US']
    },
    {
      domain: 'ca.example.com',
      defaultLocale: 'en-CA',
      locales: ['en-CA', 'fr-CA']
    },
    {
      domain: 'fr.example.com',
      defaultLocale: 'fr-FR',
      locales: ['fr-FR']
    }
  ],
  localePrefix: {
    mode: 'as-needed',
    prefixes: {
      // Cleaner prefix for `ca.example.com/fr`
      'fr-CA': '/fr'
    }
  }
});

Locales are required to be unique across domains, therefore regional variants are typically used to avoid conflicts. Note however that you don’t necessarily need to provide messages for each locale if the overall language is sufficient for your use case.

If no domain matches, the middleware will fall back to the general defaultLocale (e.g. on localhost).

localeDetection
The middleware will detect a matching locale based on your routing configuration & the incoming request and will either pass the request through for a matching locale or redirect to one that matches.

If you want to rely entirely on the URL to resolve the locale, you can set the localeDetection property to false. This will disable locale detection based on the accept-language header and a potentially existing cookie value from a previous visit.

routing.ts
import {defineRouting} from 'next-intl/routing';
 
export const routing = defineRouting({
  // ...
  localeDetection: false
});

In this case, only the locale prefix and a potentially matching domain are used to determine the locale.

localeCookie
If a user changes the locale to a value that doesn’t match the accept-language header, next-intl will set a session cookie called NEXT_LOCALE that contains the most recently detected locale. This is used to remember the user’s locale preference for subsequent requests.

By default, the cookie will be configured with the following attributes:

sameSite: This value is set to lax so that the cookie can be set when coming from an external site.
path: This value is not set by default, but will use the value of your basePath if configured.
If you have more specific requirements, you can adjust these settings accordingly:

routing.ts
import {defineRouting} from 'next-intl/routing';
 
export const routing = defineRouting({
  // ...
 
  // Will be merged with the defaults
  localeCookie: {
    // Custom cookie name
    name: 'USER_LOCALE',
    // Expire in one year
    maxAge: 60 * 60 * 24 * 365
  }
});

… or turn the cookie off entirely:

routing.ts
import {defineRouting} from 'next-intl/routing';
 
export const routing = defineRouting({
  // ...
 
  localeCookie: false
});

alternateLinks
The middleware automatically sets the link header to inform search engines that your content is available in different languages. Note that this automatically integrates with your routing strategy and will generate the correct links based on your configuration.

However, there are cases where you may want to provide these links yourself:

You have pages that are only available for certain locales
You’re using an external system like a CMS to manage localized slugs of your pages
In this case, you can opt-out of this behavior by setting alternateLinks to false.

routing.ts
import {defineRouting} from 'next-intl/routing';
 
export const routing = defineRouting({
  // ...
 
  alternateLinks: false
});

If you decide to manage alternate links yourself, a good option can be to include them in a sitemap.

next.config.ts
Apart from your routing configuration, next-intl will also incorporate settings from next.config.ts.

basePath
The next-intl middleware as well as the navigation APIs will automatically pick up a basePath that you might have configured in your next.config.js.

Note however that you should make sure that your middleware matcher handles the root of your base path:

middleware.ts
export const config = {
  // The `matcher` is relative to the `basePath`
  matcher: [
    // This entry handles the root of the base
    // path and should always be included
    '/'
 
    // ... other matcher config
  ]
};

trailingSlash
If you have trailingSlash set to true in your Next.js config, this setting will be taken into account by the middleware and the navigation APIs.

Note that if you’re using pathnames, your internal and external pathnames can be defined either with or without a trailing slash as they will be normalized internally.

Last updated on March 21, 2025

Middleware
The middleware is only needed when you’re using i18n routing.

The middleware can be created via createMiddleware.

It receives a routing configuration and takes care of:

Locale negotiation
Applying relevant redirects & rewrites
Providing alternate links for search engines
Example:

middleware.ts
import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
 
export default createMiddleware(routing);
 
export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
};

Locale detection
The locale is negotiated based on your routing configuration, taking into account your settings for localePrefix, domains, localeDetection, and localeCookie.

Prefix-based routing (default)
By default, prefix-based routing is used to determine the locale of a request.

In this case, the locale is detected based on these priorities:

A locale prefix is present in the pathname (e.g. /en/about)
A cookie is present that contains a previously detected locale
A locale can be matched based on the accept-language header
As a last resort, the defaultLocale is used
To change the locale, users can visit a prefixed route. This will take precedence over a previously matched locale that is saved in a cookie or the accept-language header and will update a previous cookie value.

Example workflow:

A user requests / and based on the accept-language header, the en locale is matched.
The user is redirected to /en.
The app renders <Link locale="de" href="/">Switch to German</Link> to allow the user to change the locale to de.
When the user clicks on the link, a request to /de is initiated.
The middleware will add a cookie to remember the preference for the de locale.
The user later requests / again and the middleware will redirect to /de based on the cookie.
Domain-based routing
If you’re using domain-based routing, the middleware will match the request against the available domains to determine the best-matching locale. To retrieve the domain, the host is read from the x-forwarded-host header, with a fallback to host (hosting platforms typically provide these headers out-of-the-box).

The locale is detected based on these priorities:

A locale prefix is present in the pathname (e.g. ca.example.com/fr)
A locale is stored in a cookie and is supported on the domain
A locale that the domain supports is matched based on the accept-language header
As a fallback, the defaultLocale of the domain is used
Since the middleware is aware of all your domains, if a domain receives a request for a locale that is not supported (e.g. en.example.com/fr), it will redirect to an alternative domain that does support the locale.

Example workflow:

The user requests us.example.com and based on the defaultLocale of this domain, the en locale is matched.
The app renders <Link locale="fr" href="/">Switch to French</Link> to allow the user to change the locale to fr.
When the link is clicked, a request to us.example.com/fr is initiated.
The middleware recognizes that the user wants to switch to another domain and responds with a redirect to ca.example.com/fr.
Matcher config
The middleware is intended to only run on pages, not on arbitrary files that you serve independently of the user locale (e.g. /favicon.ico).

A popular strategy is to match all routes that don’t start with certain segments (e.g. /_next) and also none that include a dot (.) since these typically indicate static files. However, if you have some routes where a dot is expected (e.g. /users/jane.doe), you should explicitly provide a matcher for these.

middleware.ts
export const config = {
  // Matcher entries are linked with a logical "or", therefore
  // if one of them matches, the middleware will be invoked.
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)',
 
    // However, match all pathnames within `/users`, optionally with a locale prefix
    '/([\\w-]+)?/users/(.+)'
  ]
};

Note that some third-party providers like Vercel Analytics typically use internal endpoints that are then rewritten to an external URL (e.g. /_vercel/insights/view). Make sure to exclude such requests from your middleware matcher so they aren’t rewritten by accident.

Composing other middlewares
By calling createMiddleware, you’ll receive a function of the following type:

function middleware(request: NextRequest): NextResponse;

If you need to incorporate additional behavior, you can either modify the request before the next-intl middleware receives it, modify the response or even create the middleware based on dynamic configuration.

middleware.ts
import createMiddleware from 'next-intl/middleware';
import {NextRequest} from 'next/server';
 
export default async function middleware(request: NextRequest) {
  // Step 1: Use the incoming request (example)
  const defaultLocale = request.headers.get('x-your-custom-locale') || 'en';
 
  // Step 2: Create and call the next-intl middleware (example)
  const handleI18nRouting = createMiddleware({
    locales: ['en', 'de'],
    defaultLocale
  });
  const response = handleI18nRouting(request);
 
  // Step 3: Alter the response (example)
  response.headers.set('x-your-custom-locale', defaultLocale);
 
  return response;
}
 
export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(de|en)/:path*']
};

Example: Additional rewrites
If you need to handle rewrites apart from the ones provided by next-intl, you can adjust the pathname of the request before invoking the next-intl middleware (based on “A/B Testing with Cookies” by Vercel).

This example rewrites requests for /[locale]/profile to /[locale]/profile/new if a special cookie is set.

middleware.ts
import createMiddleware from 'next-intl/middleware';
import {NextRequest} from 'next/server';
 
export default async function middleware(request: NextRequest) {
  const [, locale, ...segments] = request.nextUrl.pathname.split('/');
 
  if (locale != null && segments.join('/') === 'profile') {
    const usesNewProfile =
      (request.cookies.get('NEW_PROFILE')?.value || 'false') === 'true';
 
    if (usesNewProfile) {
      request.nextUrl.pathname = `/${locale}/profile/new`;
    }
  }
 
  const handleI18nRouting = createMiddleware({
    locales: ['en', 'de'],
    defaultLocale: 'en'
  });
  const response = handleI18nRouting(request);
  return response;
}
 
export const config = {
  matcher: ['/', '/(de|en)/:path*']
};

Note that if you use a localePrefix other than always, you need to adapt the handling appropriately to handle unprefixed pathnames too. Also, make sure to only rewrite pathnames that will not lead to a redirect, as otherwise rewritten pathnames will be redirected to.

Example: Integrating with Clerk
@clerk/nextjs provides a middleware that can be combined with other middlewares like the one provided by next-intl. By combining them, the middleware from @clerk/next will first ensure protected routes are handled appropriately. Subsequently, the middleware from next-intl will run, potentially redirecting or rewriting incoming requests.

middleware.ts
import {clerkMiddleware, createRouteMatcher} from '@clerk/nextjs/server';
import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
 
const handleI18nRouting = createMiddleware(routing);
 
const isProtectedRoute = createRouteMatcher(['/:locale/dashboard(.*)']);
 
export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
 
  return handleI18nRouting(req);
});
 
export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(de|en)/:path*']
};

(based on @clerk/nextjs@^6.0.0)

Example: Integrating with Supabase Authentication
In order to use Supabase Authentication with next-intl, you need to combine the Supabase middleware with the one from next-intl.

You can do so by following the setup guide from Supabase and adapting the middleware utils to accept a response object that’s been created by the next-intl middleware instead of creating a new one:

utils/supabase/middleware.ts
import {createServerClient} from '@supabase/ssr';
import {NextResponse, type NextRequest} from 'next/server';
 
export async function updateSession(
  request: NextRequest,
  response: NextResponse
) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({name, value}) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({name, value, options}) =>
            response.cookies.set(name, value, options)
          );
        }
      }
    }
  );
 
  const {
    data: {user}
  } = await supabase.auth.getUser();
 
  return response;
}

Now, we can integrate the Supabase middleware with the one from next-intl:

middleware.ts
import createMiddleware from 'next-intl/middleware';
import {type NextRequest} from 'next/server';
import {routing} from './i18n/routing';
import {updateSession} from './utils/supabase/middleware';
 
const handleI18nRouting = createMiddleware(routing);
 
export async function middleware(request: NextRequest) {
  const response = handleI18nRouting(request);
 
  // A `response` can now be passed here
  return await updateSession(request, response);
}
 
export const config = {
  matcher: ['/', '/(de|en)/:path*']
};

(based on @supabase/ssr@^0.5.0)

Example: Integrating with Auth.js (aka NextAuth.js)
The Next.js middleware of Auth.js requires an integration with their control flow to be compatible with other middlewares. The success callback can be used to run the next-intl middleware on authorized pages. However, public pages need to be treated separately.

For pathnames specified in the pages object (e.g. signIn), Auth.js will skip the entire middleware and not run the success callback. Therefore, we have to detect these pages before running the Auth.js middleware and only run the next-intl middleware in this case.

middleware.ts
import {withAuth} from 'next-auth/middleware';
import createMiddleware from 'next-intl/middleware';
import {NextRequest} from 'next/server';
import {routing} from './i18n/routing';
 
const publicPages = ['/', '/login'];
 
const handleI18nRouting = createMiddleware(routing);
 
const authMiddleware = withAuth(
  // Note that this callback is only invoked if
  // the `authorized` callback has returned `true`
  // and not for pages listed in `pages`.
  function onSuccess(req) {
    return handleI18nRouting(req);
  },
  {
    callbacks: {
      authorized: ({token}) => token != null
    },
    pages: {
      signIn: '/login'
    }
  }
);
 
export default function middleware(req: NextRequest) {
  const publicPathnameRegex = RegExp(
    `^(/(${locales.join('|')}))?(${publicPages
      .flatMap((p) => (p === '/' ? ['', '/'] : p))
      .join('|')})/?$`,
    'i'
  );
  const isPublicPage = publicPathnameRegex.test(req.nextUrl.pathname);
 
  if (isPublicPage) {
    return handleI18nRouting(req);
  } else {
    return (authMiddleware as any)(req);
  }
}
 
export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
};

(based on next-auth@^4.0.0)

Have a look at the next-intl with NextAuth.js example to explore a working setup.

Usage without middleware (static export)
If you’re using the static export feature from Next.js (output: 'export'), the middleware will not run. You can use prefix-based routing nontheless to internationalize your app, but a few tradeoffs apply.

Static export limitations:

Using a locale prefix is required (same as localePrefix: 'always')
The locale can’t be negotiated on the server (same as localeDetection: false)
You can’t use pathname localization, as these require server-side rewrites
Static rendering is required
Additionally, other limitations as documented by Next.js will apply too.

If you choose this approach, you might want to enable a redirect at the root of your app:

app/page.tsx
import {redirect} from 'next/navigation';
 
// Redirect the user to the default locale when `/` is requested
export default function RootPage() {
  redirect('/en');
}

Additionally, Next.js will ask for a root layout for app/page.tsx, even if it’s just passing children through:

app/layout.tsx
export default function RootLayout({children}) {
  return children;
}

Troubleshooting
”The middleware doesn’t run for a particular page.”
To resolve this, make sure that:

The middleware is set up in the correct file (e.g. src/middleware.ts).
Your middleware matcher correctly matches all routes of your application, including dynamic segments with potentially unexpected characters like dots (e.g. /users/jane.doe).
In case you’re composing other middlewares, ensure that the middleware is called correctly.
In case you require static rendering, make sure to follow the static rendering guide instead of relying on hacks like force-static.
”My page content isn’t localized despite the pathname containing a locale prefix.”
This is very likely the result of your middleware not running on the request. As a result, a potential fallback from i18n/request.ts might be applied.

”Unable to find next-intl locale because the middleware didn’t run on this request and no locale was returned in getRequestConfig.”
If the middleware is not expected to run on this request (e.g. because you’re using a setup without i18n routing), you should explicitly return a locale from getRequestConfig to recover from this error.

If the middleware is expected to run, verify that your middleware is set up correctly.

Note that next-intl will invoke the notFound() function to abort the render if no locale is available after getRequestConfig has run. You should consider adding a not-found page due to this.

Last updated on March 21, 2025


    Internationalization of Server & Client Components
React Server Components allow you to implement components that remain server-side only if they don’t require React’s interactive features, such as useState and useEffect.

This applies to handling internationalization too.

page.tsx
import {useTranslations} from 'next-intl';
 
// Since this component doesn't use any interactive features
// from React, it can be run as a Server Component.
 
export default function HomePage() {
  const t = useTranslations('HomePage');
  return <h1>{t('title')}</h1>;
}

Moving internationalization to the server side unlocks new levels of performance, leaving the client side for interactive features.

Benefits of server-side internationalization:

Your messages never leave the server and don’t need to be passed to the client side
Library code for internationalization doesn’t need to be loaded on the client side
No need to split your messages, e.g. based on routes or components
No runtime cost on the client side
Using internationalization in Server Components
Server Components can be declared in two ways:

Async components
Non-async, regular components
In a typical app, you’ll likely find both types of components. next-intl provides corresponding APIs that work for the given component type.

Async components
These are primarly concerned with fetching data and can not use hooks. Due to this, next-intl provides a set of awaitable versions of the functions that you usually call as hooks from within components.

page.tsx
import {getTranslations} from 'next-intl/server';
 
export default async function ProfilePage() {
  const user = await fetchUser();
  const t = await getTranslations('ProfilePage');
 
  return (
    <PageLayout title={t('title', {username: user.name})}>
      <UserDetails user={user} />
    </PageLayout>
  );
}

These functions are available:

getTranslations
getFormatter
getNow
getTimeZone
getMessages
getLocale
Non-async components
Components that aren’t declared with the async keyword and don’t use interactive features like useState, are referred to as shared components. These can render either as a Server or Client Component, depending on where they are imported from.

In Next.js, Server Components are the default, and therefore shared components will typically execute as Server Components:

UserDetails.tsx
import {useTranslations} from 'next-intl';
 
export default function UserDetails({user}) {
  const t = useTranslations('UserProfile');
 
  // This component will execute as a Server Component by default.
  // However, if it is imported from a Client Component, it will
  // execute as a Client Component.
  return (
    <section>
      <h2>{t('title')}</h2>
      <p>{t('followers', {count: user.numFollowers})}</p>
    </section>
  );
}

If you import useTranslations, useFormatter, useLocale, useNow and useTimeZone from a shared component, next-intl will automatically provide an implementation that works best for the environment this component executes in (server or client).

Using internationalization in Client Components
Depending on your situation, you may need to handle internationalization in Client Components. Providing all messages to the client side is the easiest way to get started, therefore next-intl automatically does this when you render NextIntlClientProvider. This is a reasonable approach for many apps.

However, you can be more selective about which messages are passed to the client side if you’re interested in optimizing the performance of your app.

There are several options for using translations from next-intl in Client Components, listed here in order of enabling the best performance:

Option 1: Passing translated labels to Client Components
The preferred approach is to pass the processed labels as props or children from a Server Component.

FAQEntry.tsx
import {useTranslations} from 'next-intl';
import Expandable from './Expandable'; // A Client Component
import FAQContent from './FAQContent';
 
export default function FAQEntry() {
  // Call `useTranslations` in a Server Component ...
  const t = useTranslations('FAQEntry');
 
  // ... and pass translated content to a Client Component
  return (
    <Expandable title={t('title')}>
      <FAQContent content={t('description')} />
    </Expandable>
  );
}

Expandable.tsx
'use client';
 
import {useState} from 'react';
 
function Expandable({title, children}) {
  const [expanded, setExpanded] = useState(false);
 
  function onToggle() {
    setExpanded(!expanded);
  }
 
  return (
    <div>
      <button onClick={onToggle}>{title}</button>
      {expanded && <div>{children}</div>}
    </div>
  );
}

By doing this, we can use interactive features from React like useState on translated content, even though the translation only runs on the server side.

Learn more in the Next.js docs: Passing Server Components to Client Components as Props

Option 2: Moving state to the server side
You might run into cases where you have dynamic state, such as pagination, that should be reflected in translated messages.

Pagination.tsx
function Pagination({curPage, totalPages}) {
  const t = useTranslations('Pagination');
  return <p>{t('info', {curPage, totalPages})}</p>;
}

You can still manage your translations on the server side by using:

Page or search params
Cookies
Database state
In particular, page and search params are often a great option because they offer additional benefits such as preserving the state of the app when the URL is shared, as well as integration with the browser history.

There’s an article on Smashing Magazine about using next-intl in Server Components which explores the usage of search params through a real-world example (specifically the section about adding interactivity).

Option 3: Providing individual messages
If you need to incorporate dynamic state into components that can not be moved to the server side, you can wrap these components with NextIntlClientProvider and provide the relevant messages.

Counter.tsx
import pick from 'lodash/pick';
import {NextIntlClientProvider, useMessages} from 'next-intl';
import ClientCounter from './ClientCounter';
 
export default function Counter() {
  // Receive messages provided in `i18n/request.ts` …
  const messages = useMessages();
 
  return (
    <NextIntlClientProvider
      messages={
        // … and provide the relevant messages
        pick(messages, 'ClientCounter')
      }
    >
      <ClientCounter />
    </NextIntlClientProvider>
  );
}

Option 4: Providing all messages
If you’re building a highly dynamic app where most components use React’s interactive features, you may prefer to make all messages available to Client Components—this is the default behavior of next-intl.

layout.tsx
import {NextIntlClientProvider} from 'next-intl';
 
export default async function RootLayout(/* ... */) {
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}

Troubleshooting
”Failed to call useTranslations because the context from NextIntlClientProvider was not found.”
You might encounter this error or a similar one referencing useFormatter while working on your app.

This can happen because:

You’re intentionally calling the hook from a Client Component, but NextIntlClientProvider is not present as an ancestor in the component tree. If this is the case, you can wrap your component in NextIntlClientProvider to resolve this error.
The component that calls the hook accidentally ended up in a client-side module graph, but you expected it to render as a Server Component. If this is the case, try to pass this component via children to the Client Component instead.
”Functions cannot be passed directly to Client Components because they’re not serializable.”
You might encounter this error when you try to pass a non-serializable prop to NextIntlClientProvider.

The component accepts the following props that are not serializable:

onError
getMessageFallback
To configure these, you can wrap NextIntlClientProvider with another component that is marked with 'use client' and defines the relevant props.

See: How can I provide non-serializable props like onError to NextIntlClientProvider?

Server Actions, Metadata & Route Handlers
There are a few places in Next.js apps where you can apply internationalization outside of React components:

Metadata API
Server Actions
Open Graph images
Manifest
Sitemap
Route Handlers
next-intl/server provides a set of awaitable functions that can be used in these cases.

Metadata API
To internationalize metadata like the page title, you can use functionality from next-intl in the generateMetadata function that can be exported from pages and layouts.

layout.tsx
import {getTranslations} from 'next-intl/server';
 
export async function generateMetadata({params}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'Metadata'});
 
  return {
    title: t('title')
  };
}

By passing an explicit locale to the awaitable functions from next-intl, you can make the metadata handler eligible for static rendering if you’re using i18n routing.

Server Actions
Server Actions provide a mechanism to execute server-side code that is invoked by the client. In case you’re returning user-facing messages, you can use next-intl to localize them based on the user’s locale.

import {getTranslations} from 'next-intl/server';
 
async function loginAction(data: FormData) {
  'use server';
 
  const t = await getTranslations('LoginForm');
  const areCredentialsValid = /* ... */;
  if (!areCredentialsValid) {
    return {error: t('invalidCredentials')};
  }
}

Note that when you’re displaying messages generated in Server Actions to the user, you should consider the case if the user can switch the locale while the message is displayed to ensure that the UI is localized consistently. If you’re using a [locale] segment as part of your routing strategy then this is handled automatically. If you’re not, you might want to clear the message manually, e.g. by resetting the state of the respective component via key={locale}.

Open Graph images
If you’re programmatically generating Open Graph images, you can call functions from next-intl in the exported component:

app/[locale]/opengraph-image.tsx
import {ImageResponse} from 'next/og';
import {getTranslations} from 'next-intl/server';
 
export default async function OpenGraphImage({params}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'OpenGraphImage'});
  return new ImageResponse(<div style={{fontSize: 128}}>{t('title')}</div>);
}

Next.js will create a public route based on the segment where opengraph-image.tsx is placed, e.g.:

http://localhost:3000/en/opengraph-image?f87b2d56cee109c7

However, if you’re using i18n routing and you’ve customized the localePrefix setting, this route might not be accessible since Next.js doesn’t know about potential rewrites of the middleware.

If this applies to your app, you can adapt your matcher to bypass requests to the opengraph-image.tsx file:

middleware.ts
// ...
 
export const config = {
  matcher: [
    // Skip all paths that should not be internationalized
    '/((?!api|_next|_vercel|.*/opengraph-image|.*\\..*).*)'
 
    // ...
  ]
};

Manifest
Since the manifest file needs to be placed in the root of the app folder (outside the [locale] dynamic segment), you need to provide a locale explicitly since next-intl can’t infer it from the pathname:

app/manifest.ts
import {MetadataRoute} from 'next';
import {getTranslations} from 'next-intl/server';
 
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  // Pick a locale that is representative of the app
  const locale = 'en';
 
  const t = await getTranslations({
    namespace: 'Manifest',
    locale
  });
 
  return {
    name: t('name'),
    start_url: '/',
    theme_color: '#101E33'
  };
}

Sitemap
If you’re using a sitemap to inform search engines about all pages of your site, you can attach locale-specific alternate entries to every URL in the sitemap to indicate that a particular page is available in multiple languages or regions.

Note that by default, next-intl returns the link response header to instruct search engines that a page is available in multiple languages. While this sufficiently links localized pages for search engines, you may choose to provide this information in a sitemap in case you have more specific requirements.

Next.js supports providing alternate URLs per language via the alternates entry. You can construct a list of entries for each pathname and locale as follows:

app/sitemap.ts
import {MetadataRoute} from 'next';
import {Locale} from 'next-intl';
import {routing, getPathname} from '@/i18n/routing';
 
// Adapt this as necessary
const host = 'https://acme.com';
 
export default function sitemap(): MetadataRoute.Sitemap {
  // Adapt this as necessary
  return [...getEntries('/'), ...getEntries('/users')];
}
 
type Href = Parameters<typeof getPathname>[0]['href'];
 
function getEntries(href: Href) {
  return routing.locales.map((locale) => ({
    url: getUrl(href, locale),
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((cur) => [cur, getUrl(href, cur)])
      )
    }
  }));
}
 
function getUrl(href: Href, locale: Locale) {
  const pathname = getPathname({locale, href});
  return host + pathname;
}

Depending on if you’re using the pathnames setting, dynamic params can either be passed as:

// 1. A final string (when not using `pathnames`)
getEntries('/users/1');
 
// 2. An object (when using `pathnames`)
getEntries({
  pathname: '/users/[id]',
  params: {id: '1'}
});

Keep in mind:

Each pathname should have a separate entry for every locale that your app supports.
Also the locale of a given pathname should be included in the alternates object.
(working implementation)

Route Handlers
You can use next-intl in Route Handlers too. The locale can either be received from a search param, a layout segment or by parsing the accept-language header of the request.

app/api/hello/route.tsx
import {NextResponse} from 'next/server';
import {hasLocale} from 'next-intl';
import {getTranslations} from 'next-intl/server';
import {routing} from '@/i18n/routing';
 
export async function GET(request) {
  // Example: Receive the `locale` via a search param
  const {searchParams} = new URL(request.url);
  const locale = searchParams.get('locale');
  if (!hasLocale(routing.locales, locale)) {
    return NextResponse.json({error: 'Invalid locale'}, {status: 400});
  }
 
  const t = await getTranslations({locale, namespace: 'Hello'});
  return NextResponse.json({title: t('title')});
}

Last updated on March 12, 2025

nternationalization in Next.js error files
The Next.js App Router’s file convention provides two files that can be used for error handling:

not-found.js
error.js
This page provides practical guides for these cases.

Tip: You can have a look at the App Router example to explore a working app with error handling.

not-found.js
This section is only relevant if you’re using i18n routing.

Next.js renders the closest not-found page when a route segment calls the notFound function. We can use this mechanism to provide a localized 404 page by adding a not-found file within the [locale] folder.

app/[locale]/not-found.tsx
import {useTranslations} from 'next-intl';
 
export default function NotFoundPage() {
  const t = useTranslations('NotFoundPage');
  return <h1>{t('title')}</h1>;
}

Note however that Next.js will only render this page when the notFound function is called from within a route, not for all unknown routes in general.

Catching unknown routes
To catch unknown routes too, you can define a catch-all route that explicitly calls the notFound function.

app/[locale]/[...rest]/page.tsx
import {notFound} from 'next/navigation';
 
export default function CatchAllPage() {
  notFound();
}

After this change, all requests that are matched within the [locale] segment will render the not-found page when an unknown route is encountered (e.g. /en/unknown).

Catching non-localized requests
When the user requests a route that is not matched by the next-intl middleware, there’s no locale associated with the request (depending on your matcher config, e.g. /unknown.txt might not be matched).

You can add a root not-found page to handle these cases too.

app/not-found.tsx
'use client';
 
import Error from 'next/error';
 
export default function NotFound() {
  return (
    <html lang="en">
      <body>
        <Error statusCode={404} />
      </body>
    </html>
  );
}

Note that the presence of app/not-found.tsx requires that a root layout is available, even if it’s just passing children through.

app/layout.tsx
// Since we have a root `not-found.tsx` page, a layout file
// is required, even if it's just passing children through.
export default function RootLayout({children}) {
  return children;
}

For the 404 page to render, we need to call the notFound function in the root layout when we detect an incoming locale param that isn’t valid.

app/[locale]/layout.tsx
import {hasLocale} from 'next-intl';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
 
export default function LocaleLayout({children, params}) {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
 
  // ...
}

error.js
When an error file is defined, Next.js creates an error boundary within your layout that wraps pages accordingly to catch runtime errors:

<RootLayout>
  <ErrorBoundary fallback={<Error />}>
    <Page />
  </ErrorBoundary>
</RootLayout>

Schematic component hierarchy that Next.js creates internally.

Since the error file must be defined as a Client Component, you have to use NextIntlClientProvider to provide messages in case the error file renders.

layout.tsx
import pick from 'lodash/pick';
import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
 
export default async function RootLayout(/* ... */) {
  const messages = await getMessages();
 
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider
          locale={locale}
          // Make sure to provide at least the messages for `Error`
          messages={pick(messages, 'Error')}
        >
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

Once NextIntlClientProvider is in place, you can use functionality from next-intl in the error file:

error.tsx
'use client';
 
import {useTranslations} from 'next-intl';
 
export default function Error({error, reset}) {
  const t = useTranslations('Error');
 
  return (
    <div>
      <h1>{t('title')}</h1>
      <button onClick={reset}>{t('retry')}</button>
    </div>
  );
}

Note that error.tsx is loaded right after your app has initialized. If your app is performance-sensitive and you want to avoid loading translation functionality from next-intl as part of this bundle, you can export a lazy reference from your error file:

error.tsx
'use client';
 
import {lazy} from 'react';
 
// Move error content to a separate chunk and load it only when needed
export default lazy(() => import('./Error'));

Last updated on March 12, 2025

Markdown (MDX)
Especially for sites where the content varies significantly by locale and may require a different structure, it can be helpful to use Markdown or MDX to provide your localized content. To consume this content in a Next.js app, you can use the @next/mdx package, which allows you to import and render MDX content.

While you can create entire pages using page.mdx files, in an app that uses the [locale] segment, it can be beneficial to import localized MDX content based on the user’s locale into a single page.tsx file.

After following the setup instructions for @next/mdx, you can consider placing your localized MDX files next to a page that will render them:

src
└── app
    └── [locale]
        ├── page.tsx
        ├── en.mdx
        └── de.mdx

Now, in page.tsx, you can import the MDX content based on the user’s locale:

src/app/[locale]/page.tsx
import {notFound} from 'next/navigation';
 
export default async function HomePage({params}) {
  const {locale} = await params;
 
  try {
    const Content = (await import(`./${locale}.mdx`)).default;
    return <Content />;
  } catch (error) {
    notFound();
  }
}

In this example, an MDX file might look like this:

src/app/[locale]/en.mdx
import Portrait from '@/components/Portrait';
 
# Home
 
Welcome to my site!
 
<Portrait />

Components that invoke hooks from next-intl like useTranslations can naturally be used in MDX content and will respect the user’s locale.

