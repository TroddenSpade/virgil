# Prompt — add a new book to the Virgil library

You are the maintainer of this repository. Turn the text I provide into a complete,
faithful new book in the Virgil Latin library: create its data module, register it in
the library, populate its chapter vocabulary and notes, regenerate the dictionary and
lexicon, and verify everything.

Work directly in the repository with your file-editing and shell tools. Do not only
describe the changes: make them, run the generators and validators, and report the
result.

---

## 1. Inputs

I will provide the text and whatever metadata I know. Fill gaps with conservative
defaults and list every assumption in your final report. Do not invent missing
historical facts, authorship, or publication data.

```
BOOK METADATA
- Title:
- Latin title:
- Short title:
- Author:
- Edition / year / publisher / ISBN:
- Language (usually Latin; may be bilingual):
- Level label (e.g. "Reader — 12 Latin stories"):
- Shelf stage: beginner | intermediate | advanced
- Kind: coursebook | reader | workbook | commentary | reference
- Unit names (e.g. Capitulum/Capitula, Colloquium/Colloquia, Pars/Partes):
- Accent: wine | laurel | gold | ivory
- Source / rights note:

TEXT TO ADD
-----------
{{PASTE THE COMPLETE TEXT HERE}}
```

If the text is long, process it chapter by chapter and keep a checklist so no section is
lost or duplicated.

---

## 2. Non-negotiable rules

1. **Fidelity first.** Preserve the source's wording, spelling, punctuation, speaker
   labels, section order, and verse line breaks. Do not translate, summarize, modernize,
   or "improve" the Latin. Do not add sentences that are not in the source.
2. **Preserve macra.** If the edition prints long-vowel marks (ā ē ī ō ū ȳ), keep every
   one. If it does not, add macra only where a reliable reference makes them certain;
   list uncertain forms in your report.
3. **Only Latin in `paragraphs`.** English belongs in `title`, `gloss`, `english`,
   `overview`, descriptions, and `extras`, never in the running Latin text.
4. **Clean OCR, do not rewrite.** Fix obvious character-level OCR errors (u/v, i/j,
   f/ſ, broken ligatures, stray symbols) and report genuinely uncertain readings.
   Never silently replace a doubtful word with a plausible one.
5. **Do not hand-edit generated files.** Never edit `*.generated.js` directly. Regenerate
   them with the scripts below.
6. **Do not change existing books** unless the new book genuinely requires a shared
   helper change. Do not reorder existing books on the shelf.
7. **Do not lower validation thresholds** or add bulk exceptions to make a check pass.
   Fix the data instead.
8. **Respect performance.** Keep the new book as plain JS data. The full dictionary is
   large and must remain lazily loaded; do not import it into the main app shell.
9. **Do not commit** unless I explicitly ask. Leave the working tree ready for review.

---

## 3. Repository map

Read these before editing:

```
src/data/library.js                     book registry, shelf order, level groups, hero marks
src/data/<slug>/index.js                exports `book` and `chapters`
src/data/<slug>/outline.js              table of contents
src/data/<slug>/<chapter>.js            one file per chapter
src/data/<slug>/extras.js               optional front/back matter
scripts/build-chapter-keywords.mjs      keyword generation; contains a hard-coded MODULES list
scripts/build-dictionary.mjs            generates dictionary, index, reading lexicon, paradigms
scripts/validate-dictionary.mjs         hard dictionary/lexicon quality gate
scripts/build-learning-path.mjs         optional Iter road placement
```

Generated files (never edit by hand):

```
src/data/dictionary.generated.js
src/data/dictionary-index.generated.js
src/data/reading-vocabulary.generated.js
src/data/paradigm-rules.generated.js
src/data/chapter-keywords.generated.js
src/data/learning-path.generated.js
```

Before writing, read the modules closest to the new book in kind:

- coursebook: `src/data/familia-romana/`
- reader/dialogue: `src/data/colloquia-personarum/`
- verse: `src/data/vergil-aeneis-i-et-iv/`
- prose author: `src/data/caesar-de-bello-gallico-vii/`
- workbook/exercises: `src/data/exercitia-latina/`

Follow their structure and naming rather than inventing a new schema.

---

## 4. Choose the identity

Derive:

- `slug` and `id`: lowercase kebab-case, stable, URL-safe, unique. Use the same value
  for the folder name unless an existing convention requires otherwise.
- `title`, `latinTitle`, `shortTitle`, `author`, `edition`, `year`, `publisher`, `isbn`.
- `kind`: `reference` only for a full-text source browser; `reader` for a reading
  edition; `workbook` for exercises; `commentary` for running commentary; otherwise
  `coursebook`.
- `level`: the descriptive shelf label, e.g. `Reader — 12 Latin stories`.
- `accent`: one of `wine`, `laurel`, `gold`, `ivory`.
- Shelves: add the slug to the appropriate shelf in `src/data/library.js`.
  Course and reader books go in exactly one group of `levelGroups`
  (`beginner`, `intermediate`, or `advanced`). New original Latin editions go in
  `authorShelf`, the Latin-named **Auctōrēs Latīnī** shelf, which starts empty
  and is reserved for original works. A book may appear in both if it belongs
  on the learning path too.

Write a 2–3 sentence `summary` and a longer `description` in the voice of the existing
books. Write chapter `tagline`/`overview` text only from what the source supports.

---

## 5. Create the data module

Create `src/data/<slug>/outline.js`, one file per chapter, `index.js`, and `extras.js`
if the text has front or back matter.

### `outline.js`

```js
// Table of contents. Latin headings from the book; English titles are reading aids.
export const outline = [
  { number: 1, roman: 'I', slug: 'chapter-i', latinTitle: 'CAPITVLVM PRIMVM', title: 'Chapter I' },
  { number: 2, roman: 'II', slug: 'chapter-ii', latinTitle: 'CAPITVLVM SECVNDVM', title: 'Chapter II' },
]
```

For verse, add `verseCount` to the outline entry. Preserve the printed numbering; if
none is printed, assign sequential Arabic numbers and Roman numerals and say so.

### Chapter file (`chapter-01.js`)

```js
const chapter = {
  number: 1,
  roman: 'I',
  slug: 'chapter-i',
  latinTitle: 'CAPITVLVM PRIMVM',
  title: 'Chapter I',
  tagline: 'One-line English orientation, only if supported by the text.',
  status: 'complete',
  complete: true,
  overview: 'A short English overview of what this chapter contains.',
  objectives: ['What the reader should notice or learn.'],

  readings: [
    {
      id: 'lectio-prima',
      latinTitle: 'LĒCTIŌ PRĪMA',
      title: 'The first reading',
      personae: 'Persōnae: Mārcus, Iūlia', // dialogue only; otherwise omit
      hideHead: false,                     // true when the reading has no separate heading
      paragraphs: [
        'Latin text, one paragraph or one verse line per entry.',
        'Use {i}…{/i} for italics and {b}…{/b} for bold. Use {{1}} to anchor note 1.',
      ],
      notes: [
        { term: 'arma, -ōrum n pl', gloss: 'bella' },
      ],
    },
  ],

  grammar: [
    {
      id: 'grammar-topic',
      latinTitle: 'DE CASIBVS',
      title: 'The cases',
      intro: 'Short English explanation.',
      paradigms: [
        {
          caption: 'first declension',
          head: ['', 'Singulāris', 'Plūrālis'],
          rows: [['nōm.', 'rosa', 'rosae']],
        },
      ],
      points: ['A key point about the forms or usage.'],
    },
  ],

  vocabulary: [
    { latin: 'rosa, rosae', english: 'rose', pos: 'noun (f.)' },
    { latin: 'amō, amāre, amāvī, amātus', english: 'love', pos: 'verb' },
    { latin: 'magnus, -a, -um', english: 'big, great', pos: 'adjective' },
  ],

  pensa: [
    {
      id: 'pensum-a',
      latinLabel: 'PĒNSVM A',
      title: 'Complete the endings',
      instruction: 'Complete each word with the missing ending.',
      type: 'fill',
      items: ['Rōma in Itali{{ā}} est.'],
    },
    {
      id: 'pensum-b',
      latinLabel: 'PĒNSVM B',
      title: 'Answer in Latin',
      instruction: 'Answer each question.',
      type: 'questions',
      items: [{ q: 'Ubi est Rōma?', a: 'Rōma in Italiā est.' }],
    },
  ],
}

export default chapter
```

Field notes:

- `number` must be an integer; `roman` a string; `slug` unique within the book.
- `complete: true` and `status: 'complete'` make the chapter routable. Use `false` /
  `'planned'` only for outlined chapters whose text you do not have.
- `readings` is the only required content array. `grammar`, `vocabulary`, `pensa`,
  `overview`, `objectives`, `tagline`, `notes` are optional but strongly encouraged.
- `paragraphs` may contain inline markup only: `{i}…{/i}`, `{b}…{/b}`, `{{n}}` note
  anchors. Do not use Markdown, HTML, or backticks in Latin text.
- `{{answer}}` blanks are for `pensa` fill items only, not for running readings.
- For verse, keep one verse per paragraph and set `verseCount` in the outline.
- Vocabulary `pos` should use the labels the existing data uses: `noun (m.)`,
  `noun (f.)`, `noun (n.)`, `adjective`, `verb`, `adverb`, `preposition`,
  `conjunction`, `pronoun`, `numeral`, `particle`, `interjection`.
- Include principal parts or noun genitives when the source gives them; the dictionary
  uses them to infer paradigms and principal parts.

### `index.js`

```js
import { outline } from './outline.js'
import { extras } from './extras.js' // omit if there is no front/back matter
import chapter01 from './chapter-01.js'
import chapter02 from './chapter-02.js'

const detailed = {
  1: chapter01,
  2: chapter02,
}

export const chapters = outline.map((entry) => {
  const content = detailed[entry.number]
  if (content) return { ...entry, ...content, complete: true, status: 'complete' }
  return {
    ...entry,
    complete: false,
    status: 'planned',
    readings: [],
    grammar: [],
    vocabulary: [],
    pensa: [],
  }
})

export const book = {
  id: '<slug>',
  slug: '<slug>',
  title: '<full title>',
  latinTitle: '<LATIN TITLE>',
  shortTitle: '<short title>',
  author: '<author>',
  edition: '<edition>',
  year: 2026,
  publisher: '<publisher>',
  isbn: '<isbn>',
  level: '<shelf label>',
  language: 'Latin',
  summary: '<2–3 sentences>',
  description: '<longer description>',
  accent: 'wine',
  status: 'active',
  kind: 'reader',
  unit: 'Capitulum',
  unitPlural: 'Capitula',
  readingUnit: 'capitulum',
  readingUnitPlural: 'capitula',
  collectionLabel: 'Capitula',
  readingLabel: 'Lēctiō',
  collectionNote: '<one sentence about the collection>',
  startLabel: 'Start Capitulum I',
  chapterCount: outline.length,
  readingCount: chapters.reduce((n, chapter) => n + (chapter.readings?.length || 0), 0),
  readyCount: chapters.filter((chapter) => chapter.complete).length,
  chapters,
  extras,
}

export default book
```

If publication details are unknown, use `edition: 'Digital edition'`,
`publisher: 'Private edition'`, `isbn: ''`, and flag the assumption. Do not leave
`publisher`/`year` undefined because the book page renders them directly.

### `extras.js` (only if needed)

Copy the block schema from an existing extras file. Supported block types include:

```js
{ t: 'p', text: '...' }
{ t: 'pre', text: '...' }
{ t: 'table', rows: [['header', 'header'], ['cell', 'cell']] }
```

Keep front matter, prefaces, indexes, and glossaries here. Do not put them in chapter
readings.

---

## 6. Register the book

Edit `src/data/library.js`:

1. Import the new module near the other imports:

```js
import { book as myBook, chapters as myChapters } from './<slug>/index.js'
```

2. Export a book entry before the `books` array:

```js
export const myBookEntry = {
  ...myBook,
  chapters: myChapters,
}
```

3. Add `myBookEntry` to the `books` array at the correct reading position.
4. Add the slug to `BOOK_ORDER` at that same position.
5. Add a `HERO_MARKS` entry keyed by the book **id**, e.g. `'<id>': 'MY BOOK'`.
6. Add the slug to the appropriate shelf: one group in `levelGroups` for course
   and reader books, and/or `authorShelf` for original editions. The page
   renders `libraryShelves`; a book may legitimately appear in both.

Do not rely on the fallback position or fallback `advanced` group; make the placement
explicit.

Then edit `scripts/build-chapter-keywords.mjs`:

1. Add the data folder name to `MODULES`.
2. Add an explicit `levelFor` branch for the new book (otherwise it defaults to
   `intermediate`), based on chapter numbers or the book's own progression.
3. Add a `textTypes` branch if the book needs a type label (`poetry`, `narrative`,
   `original-latin`, `adapted-latin`, etc.). Do not tag every chapter with every type.
4. If the book should appear on the Iter road, edit `scripts/build-learning-path.mjs`:
   add it to `CORE_BOOK`, `READER_BOOKS`, `AUTHOR_BOOKS`, or `ALTERNATIVE_BOOKS` as
   appropriate, and to `BOOK_RANK`. If it is supplementary, leave it off the road and
   say so.

---

## 7. Vocabulary, notes, dictionary, lexicon

The dictionary and reading lexicon are generated, not authored separately. They become
complete through the chapter data:

- `chapter.vocabulary` supplies curated headwords and English senses.
- `reading.paragraphs` supply every inflected form found in the readings.
- `reading.notes` supply marginalia words that never appear in the running text.
- `chapter.number` + `book.slug` supply the source chapter shown on word pages.

Therefore:

1. Add a vocabulary entry for every distinct lemma a reader may not know, every proper
   name, and every word that Whitaker's Words would gloss misleadingly.
2. Use one entry per lemma, not one per inflected form. Put the lemma (and principal
   parts/genitive when known) in `latin`.
3. Add a `notes` entry for every marginal note in the source. `term` is the printed
   lemma; `gloss` is the printed explanation.
4. For a reader with a printed glossary, transcribe the glossary entries that belong to
   each chapter. If the glossary is book-wide, put it in `extras` and still add
   per-chapter vocabulary for the words actually used.
5. If a proper name or rare word is missing from the dictionary after generation, add it
   to that chapter's `vocabulary` rather than adding a special case to the build script.
6. Never add OCR debris, abbreviation fragments, or bare endings as vocabulary.

Run the generators only after the data is in place:

```bash
npm run keywords
node scripts/build-dictionary.mjs
npm run path          # only if the book was added to the Iter road
```

`npm run keywords` writes `chapter-keywords.generated.js`.
`node scripts/build-dictionary.mjs` writes the full dictionary, the lightweight index,
the reading vocabulary, and the paradigm rules.

---

## 8. Validate

Run all of these and fix every new failure:

```bash
node scripts/validate-dictionary.mjs
npm run validate:keywords
npm test
npm run build
```

Requirements:

- `validate-dictionary.mjs` must exit 0.
- Latin reading coverage must stay at or above the project threshold (99.5%). Do not
  lower it.
- No duplicate lemma ids, headwords, or word keys.
- No lemma without a usable English definition.
- No word without a lemma or with an invalid source.
- No new paradigm gaps.
- `validate:keywords` must exit 0.
- All tests pass.
- The production build succeeds. The build script already sets the required heap size.

If the validator reports missing Latin tokens, add the real words to the chapter
vocabulary (or correct the OCR) and rebuild. Do not classify real Latin as a fragment
just to silence the report.

If the book is structurally complex, add a small `scripts/validate-<slug>.mjs` in the
style of the existing per-book validators, and run it.

---

## 9. Browser QA

Start the dev server:

```bash
npm run dev
```

Check:

1. `/library` — the book appears under the correct shelf (Beginner, Intermediate,
   Advanced and/or the Auctōrēs Latīnī shelf), in the intended order, with accurate counts.
2. `/library/<slug>` — book page opens; chapter cards and first-chapter link work.
3. `/library/<slug>/<first-chapter-slug>` — reading renders with macra, italics, notes,
   vocabulary, grammar, and exercises.
4. Toggle **Lexicon mode**; click several words (including a proper name and a rare
   word); confirm the popover shows a sensible gloss and the paradigm/full-entry links
   open.
5. `/dictionary?q=<a word from the book>` — search finds the new forms; a detail page
   lists the new chapter among its sources; the paradigm page renders.
6. Check the browser console for errors.

Report the URLs you checked.

---

## 10. Final report

Return a concise report with:

```
BOOK ADDED
- Title / author / slug:
- Shelf stage and position:
- Chapters / readings:
- Vocabulary entries / notes:

FILES
- Created:
- Changed:

GENERATED
- chapter-keywords.generated.js
- dictionary.generated.js
- dictionary-index.generated.js
- reading-vocabulary.generated.js
- paradigm-rules.generated.js
- learning-path.generated.js (if applicable)

VALIDATION
- validate-dictionary.mjs: <summary lines / exit code>
- validate:keywords: <summary / exit code>
- npm test: <passed count>
- npm run build: <result and precache size>

QA
- URLs checked:
- Console errors: none / details

ASSUMPTIONS AND UNCERTAINTIES
- Metadata defaults:
- OCR or textual uncertainties:
- Anything intentionally left out:
```

Stop and ask me before proceeding if:

- the text is incomplete in a way that changes the book's structure,
- the title/author/rights are genuinely unknown and cannot be given a conservative
  default,
- a required change would modify an existing book or lower a validation threshold,
- or the text is too large to process faithfully without splitting it.

Otherwise, choose sensible defaults, make the changes, run the checks, and report.
