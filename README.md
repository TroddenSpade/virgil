# Virgil

**A Latin learning project — from Ørberg's _Familia Romana_ to the works of Virgil.**

🌐 **Live site:** https://virgil.parsasam.ir/

Virgil is an installable web app (PWA) that teaches Latin by reading. It begins with the first
sentence of Hans H. Ørberg's _Lingua Latina per se Illustrata, Pars I: Familia Romana_ and builds,
chapter by chapter, toward the poetry of the _Aeneid_.

> _Roma in Italia est._ — Rome is in Italy. That is the first sentence. Everything follows from it.

---

## What is in here

The site is organised as a **library of books**. The course books are open, together with the reference texts; Virgil's own works are the goal still on the roadmap.

| Section | Status | What it is |
| --- | --- | --- |
| **Lingua Latina: Pars I — Familia Romana** (Ørberg) | **Open** — 35 of 35 chapters written up | The core course. Each _capitulum_ is a full lesson. |
| **Lingua Latina: Exercitia Latina I** (Ørberg) | **Open** — 35 of 35 exercise chapters written up | The interactive exercise workbook that runs alongside _Familia Romana_. |
| **Lingua Latina: Pars II — Roma Aeterna** (Ørberg) | **Open** — 21 of 21 chapters written up | The sequel: Aeneas, the kings, and the Roman Republic in the words of the classical authors. |
| A Companion to Familia Romana (Neumann) | **Open** — full text reference | Grammar, translation help and cultural notes. |
| Learn Latin from the Romans (Dickey) | **Open** — full text reference | A grammar-based, second track. |
| **Latin via Ovid: A First Course** (Goldman & Nyenhuis) | **Open** — 40 of 40 lessons written up | A reading course built on Ovid's _Metamorphoses_, with Verba, Structure, exercises and etymology. |

### Every chapter is a self-contained lesson

Following Ørberg's direct method, each chapter contains:

- **Lectio** — the Latin reading, with marginal notes that gloss the new words and forms.
- **Grammatica Latina** — the grammar the reading has just demonstrated, with the paradigms.
- **Vocabula** — the chapter's new words, with a search and a flashcard trainer.
- **Pensa A · B · C** — the original exercises, with instant answer-checking and model answers.

Chapters are marked **learned** by the reader, and progress is shown per book.

### Dictionary

The site includes a searchable **Dictionary** at `/dictionary`, built from the vocabulary of both course
books. It contains every taught headword with its macra, part of speech, English meaning, the chapters in
which it appears, and examples drawn from the readings. The data is generated with:

```bash
node scripts/build-dictionary.mjs   # writes src/data/dictionary.generated.js
```

### Profile and cross-device progress

The **My Profile** page at `/profile` is local-first. Study state always lives in this browser;
sign in with an email link to keep a copy in Supabase and load it on another device. Learned
chapters, hand-saved and known words, and review history travel together — theme and install
preferences stay on the device.

To enable sync in a deployment:

1. Create a Supabase project.
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL editor. It creates
   `public.virgil_progress` with row-level security so each user can only reach their own row.
3. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` from **Project Settings → API**. Use the project root URL, not the
   `/rest/v1/` endpoint. Never use the `service_role` key in a Vite app.
4. In **Authentication → URL Configuration**, set the site URL and add the redirect URL
   `https://virgil.parsasam.ir/profile` (and `http://localhost:5173/profile` for local testing).
5. Rebuild. Without the two environment variables the app stays fully usable in local-only mode.

The same two variables must be available to the GitHub Pages build (for example as repository
Actions variables/secrets consumed by `.github/workflows/deploy.yml`).

### Completed lessons

| Book | Chapters | Contents |
| --- | --- | --- |
| **Familia Romana** | I–XXXV | All thirty-five capitula, each with reading, grammar, vocabulary and three _pensa_. |
| **Exercitia Latina I** | I–XXXV | All thirty-five exercise chapters, matching the reader chapter by chapter. |
| **Roma Aeterna** | XXXVI–LVI | All twenty-one capitula, following Aeneas from Troy and Rome from its first kings to the fall of the Republic. |
| **Latin via Ovid** | I–XL | All forty lessons, from the map of the world through Ovid's _Metamorphoses_ to Aeneas in Italy. |

---

## Design

Virgil is the third site in a small family, alongside
**[Rhetoric](https://rhetoric.parsasam.ir)** (a warm-paper writing studio) and
**[Cadence](https://cadence.parsasam.ir)** (a dark music-theory trainer). They share
warm paper, near-black ink, an editorial serif and Space Grotesk for the interface.
Virgil's own branch is **Tabula**: aged papyrus, verdigris bronze, oxblood, and the
lettering of Roman inscriptions. See [DESIGN.md](DESIGN.md) for the research, the
palette, the type system and the mark.

The mark is a Roman coin: an engraved, bronze-duotone portrait of Virgil from the
public-domain Vatican bust, inside a beaded ring inscribed `PVBLIVS · VERGILIVS · MARO`.
The source photograph is in [`public/art/`](public/art/), and the icons are
generated from it:

```bash
npm run icons      # python3 scripts/generate-icons.py (requires Pillow)
```

---

## Tech

- **React 19 + Vite 7**
- **React Router 7**
- **vite-plugin-pwa** — installable PWA with an offline-capable service worker
- **EB Garamond + Space Grotesk** — a self-hosted book face for the readings and
  inscriptional headings, and the shared interface grotesque. Two variable,
  subsetted WOFF2 families (latin + latin-ext) replace the former Google Fonts
  request, so there is no render-blocking third-party fetch and the type is
  available offline with the app shell.

Content is data-driven: each chapter is a module in `src/data/familia-romana/`,
`src/data/exercitia-latina/`, `src/data/roma-aeterna/` or `src/data/latin-via-ovid/`, so adding a
chapter means adding one file and listing it in the book's `outline.js`.

```
src/
├─ data/
│  ├─ library.js                 # the light registry: books, shelves, chapter outlines
│  ├─ book-loader.js             # loads one book's full text on demand (assets/books/)
│  ├─ books-meta.generated.js    # generated registry (scripts/build-books-meta.mjs)
│  ├─ printed-vocabulary.generated.js  # printed vocabulary for the wordlist
│  ├─ dictionary.generated.js    # the course dictionary (built by scripts/build-dictionary.mjs)
│  ├─ familia-romana/            # Pars I — 35 capitula
│  │  ├─ index.js                # book metadata + merges outline with content
│  │  ├─ outline.js              # the 35 chapter titles (table of contents)
│  │  └─ capitulum-01..35.js     # full lesson content
│  ├─ exercitia-latina/          # 35 exercise chapters
│  │  ├─ index.js
│  │  ├─ outline.js
│  │  └─ capitulum-01..35.js
│  ├─ roma-aeterna/              # Pars II — 21 capitula
│  │  ├─ index.js
│  │  ├─ outline.js
│  │  └─ capitulum-36..56.js
│  └─ latin-via-ovid/            # 40 lessons
│     ├─ index.js
│     ├─ outline.js
│     └─ capitulum-01..40.js
├─ components/                   # Reading, GrammarSection, Vocabulary, Pensum, …
├─ pages/                        # Home, Library, BookPage, ChapterPage, Wordlist, Profile
└─ hooks/                        # localStorage progress + PWA install prompt
```

### Exercise syntax

Exercise text uses `{{answer}}` (or `{{answer|alternative}}`) to mark a blank that the learner
fills in, e.g.:

```js
'Nilus fluvi{{us}} est. Nilus et Rhenus fluvi{{i}} sunt.'
```

Question exercises are `{ q: '…', a: '…' }` pairs that the learner can reveal.

---

## Getting started

```bash
npm install      # install dependencies
npm run dev      # start the dev server at http://localhost:5173
npm run build    # production build into dist/
npm run check:bundle  # fail if the initial JS grows past 1 MB
npm run validate:all  # per-book coverage/structure, dictionary and keyword checks
npm test         # run the wordlist, review, and lexicon tests (Vitest)
npm run preview  # serve the production build (needed to test the PWA)
npm run data     # regenerate books meta, keywords, itinerary and vocabulary
```

`validate:books` enforces a 99.5% Latin-coverage floor per book, rejects empty
chapters/readings and duplicate numbers or headings, and flags suspicious OCR
tokens. It writes every unresolved token, grouped by book, to
`reports/book-validation.json` — CI uploads that file as the `book-validation`
artifact.

To see the **install prompt**, run `npm run build && npm run preview` and open the site —
a browser (Chrome/Edge) will offer to install Virgil as an app. It also works offline once
loaded, thanks to the service worker.

### Deployment (GitHub Pages)

The site is deployed automatically to GitHub Pages by
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) on every push to `main`, and served
at the custom domain **https://virgil.parsasam.ir/**.

The custom domain serves the site from the root, so the production build uses a `base` of `/`
(`public/CNAME` pins the domain). SPAs get a `404.html` fallback (generated by
`scripts/postbuild.mjs`). To build for Pages locally:

```bash
npm run build:pages   # sets VITE_BASE=/ and writes dist/404.html + dist/.nojekyll
```

### Regenerating icons

The medallion icons are built from the public-domain Vatican bust in `public/art/`:

```bash
npm run icons        # python3 scripts/generate-icons.py (requires Pillow)
```

This writes the PWA icons, the Apple touch icon, the favicons and the SVG medallion.

---

## Notes on sources

The reading texts, grammar and exercises are adapted from the following course books:

- **H. H. Ørberg, _Lingua Latina per se Illustrata: Pars I — Familia Romana_** (2nd ed., Focus Publishing, 2012)
- **H. H. Ørberg, _Lingua Latina per se Illustrata: Pars II — Roma Aeterna_** (2nd ed., Hackett Publishing)
- **H. H. Ørberg, _Exercitia Latina I_** (Focus Publishing, 2005)
- **Norma Goldman & Jacob E. Nyenhuis, _Latin via Ovid: A First Course_** (2nd ed., Wayne State University Press, 1982)

They are re-typeset for the web. The PDFs/EPUBs of the source books are kept locally in `books/`
and are **not** tracked in git. The OCR text layer of the Roma Aeterna EPUB can be extracted for
authoring with:

```bash
python3 scripts/extract-roma-aeterna.py
python3 scripts/extract-latin-via-ovid.py   # dumps the Latin via Ovid reference blocks
```

### Reference books (OCR pipeline)

The browse-as-is reference books (the Companion, Learn Latin from the Romans, Latin via Ovid and
Exercitia Latina I) are extracted straight from the source editions. Sources whose PDF text layer
is missing or mangles the macra (*Exercitia Latina I* is a pure scan; *Latin via Ovid* renders
`Eurōpa` as `Eurdpa`) are transcribed page by page through a vision model, so every long vowel is
kept:

```bash
python3 scripts/ocr-book.py exercitia "books/<Exercitia Latina I>.pdf" --workers 4
python3 scripts/build-sources.py exercitia      # -> public/sources/exercitia/ + sources.generated.js
```

`ocr-book.py` renders each page with `pdftoppm`, asks the model to transcribe the main column and
then the side-margin column separately (marked `===MARGIN===`), and writes one JSON record per
page to `sources/raw/<slug>.jsonl` (resumable — already-done pages are skipped). The model and
endpoint are read from the OpenCode config (`provider.*.options`), and can be overridden with
`OCR_MODEL` / `NINE_ROUTER_KEY` / `NINE_ROUTER_BASE`.

`scripts/build-sources.py` turns that into the site's data: `public/sources/<slug>/*.json` for the
per-chapter text and `src/data/sources.generated.js` for the table of contents. It merges with the
existing generated file, so rebuilding one book leaves the others untouched.

---

## Roadmap

1. **Add the Companion** — grammar and translation help alongside the reading.
2. **Add a second track** — Dickey's _Learn Latin from the Romans_.
3. **Open Virgil** — the _Aeneid_, _Eclogues_ and _Georgics_, with vocabulary and scansion.

_Arma virumque cano…_
