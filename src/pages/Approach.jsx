import { Link } from 'react-router-dom'
import { books, familiaRomanaBook } from '../data/library.js'
import { iterStages, iterLessonCount } from '../data/learning-path.generated.js'

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
const firstChapter = familiaRomanaBook.chapters[0]

const shelf = books.filter((book) => book.chapters?.length)
const textCount = shelf.reduce((total, book) => total + (book.chapterCount || 0), 0)
const goalBook = books.find((book) => book.isGoal)

const COURSE_SLUGS = [
  'familia-romana',
  'roma-aeterna',
  'learn-latin-from-the-romans',
  'latin-via-ovid',
]
const PRACTICE_SLUGS = [
  'exercitia-latina',
  'exercitia-latina-ii',
  'companion-to-familia-romana',
  'companion-to-roma-aeterna',
]

const bySlug = (slug) => shelf.find((book) => book.slug === slug)

const groups = [
  {
    label: 'The course',
    note: 'Where the Latin begins',
    items: COURSE_SLUGS.map(bySlug).filter(Boolean),
  },
  {
    label: 'Practice & companions',
    note: 'Exercises and explanations beside the text',
    items: PRACTICE_SLUGS.map(bySlug).filter(Boolean),
  },
  {
    label: 'Readers',
    note: 'More Latin, from dialogue to history',
    items: shelf.filter((book) => book.kind === 'reader'),
  },
]

function Incipit({ label, note }) {
  return (
    <div className="incipit">
      <p className="eyebrow">{label}</p>
      <span className="incipit__rule" aria-hidden="true" />
      {note && (
        <span className="incipit__note" aria-hidden="true">
          {note}
        </span>
      )}
    </div>
  )
}

const principles = [
  {
    num: 'I',
    title: 'Meaning before grammar',
    body: 'A new word never arrives alone. It comes inside a sentence whose sense is already clear from the words you know, from a picture, or from a note in the margin.',
  },
  {
    num: 'II',
    title: 'Latin explains Latin',
    body: 'The reading is not translated. Paraphrase, repetition and context do the work, so you learn to think in the language rather than to decode it.',
  },
  {
    num: 'III',
    title: 'Grammar after the reading',
    body: 'Once a form has been met in the text, the Grammatica Latina names it, tables it, and shows it again in sentences you have just read.',
  },
  {
    num: 'IV',
    title: 'Practice, then go on',
    body: 'Vocabula fixes the chapter’s words; the Pensā test them; the next chapter quietly assumes them. Nothing is left behind.',
  },
]

const chapterSteps = [
  {
    num: 'I',
    title: 'Lectio',
    body: 'The chapter itself: a continuous Latin reading, with marginal glosses and pictures for the new words and forms.',
  },
  {
    num: 'II',
    title: 'Grammatica',
    body: 'The grammar the reading has just shown you, with the paradigms set out as tables and tied back to the text.',
  },
  {
    num: 'III',
    title: 'Vocābula',
    body: 'The chapter’s new words, with macra, meanings and a flashcard trainer for the ones that will not stay put.',
  },
  {
    num: 'IV',
    title: 'Pēnsa',
    body: 'The original exercises, with instant checking and model answers — the place where reading turns into writing.',
  },
]

export default function Approach() {
  return (
    <section className="section approach-page">
      <div className="container">
        <header className="approach-hero rise">
          <span className="approach-hero__watermark" aria-hidden="true">
            RATIO
          </span>

          <div className="approach-hero__copy">
            <p className="eyebrow">Ratio docendī</p>
            <h1>The Approach</h1>
            <p className="lead">
              Virgil teaches Latin the way Ørberg’s <em>Lingua Latina</em> does: by reading, in Latin,
              from the very first sentence — then, chapter by chapter, out into the authors themselves.
            </p>
            <div className="approach-hero__actions">
              <Link
                className="btn btn--primary"
                to={`/library/${familiaRomanaBook.slug}/${firstChapter.slug}`}
              >
                Begin Capitulum I →
              </Link>
              <Link className="btn btn--ghost" to="/iter">
                Open the itinerary
              </Link>
            </div>
          </div>

          <dl className="approach-hero__stats">
            <div>
              <dt>Books</dt>
              <dd>{shelf.length}</dd>
            </div>
            <div>
              <dt>Texts &amp; chapters</dt>
              <dd>{textCount}</dd>
            </div>
            <div>
              <dt>Stages</dt>
              <dd>{iterStages.length}</dd>
            </div>
            <div>
              <dt>Itinerary lessons</dt>
              <dd>{iterLessonCount}</dd>
            </div>
          </dl>
        </header>

        <section className="approach-section">
          <Incipit label="Ratiō" note="The method" />
          <h2>Read first, then name it</h2>
          <p className="lead approach-lead">
            Most courses begin with a grammar table and a list of words. This one begins with a
            sentence. The grammar is not omitted — it is postponed until the reading has made it
            visible.
          </p>
          <div className="approach-principles">
            {principles.map((item) => (
              <article className="approach-principle card" key={item.num}>
                <span className="approach-principle__num" aria-hidden="true">
                  {item.num}
                </span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="approach-section">
          <Incipit label="Iter" note="The road to Virgil" />
          <div className="approach-section__head">
            <h2>From the first sentence to the Aeneid</h2>
            <Link className="back-link" to="/iter">
              Full itinerary →
            </Link>
          </div>
          <p className="lead approach-lead">
            Nine stages carry you from <em>Rōma in Italiā est</em> to the authors themselves. Read
            them in order, or open a stage and begin where your reading stands.
          </p>
          <ol className="approach-stages">
            {iterStages.map((stage, index) => (
              <li key={stage.id}>
                <Link className="approach-stage" to={`/iter#${stage.id}`}>
                  <span className="approach-stage__num" aria-hidden="true">
                    {ROMAN[index] || index + 1}
                  </span>
                  <span className="approach-stage__body">
                    <span className="approach-stage__latin latin">{stage.latin}</span>
                    <span className="approach-stage__title">{stage.title}</span>
                    <span className="approach-stage__blurb">{stage.blurb}</span>
                  </span>
                  <span className="approach-stage__count">{stage.lessonCount} lessons</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section className="approach-section">
          <Incipit label="Capitulum" note="Inside a chapter" />
          <h2>A chapter in four movements</h2>
          <div className="approach-steps">
            {chapterSteps.map((step) => (
              <article className="approach-step" key={step.num}>
                <span className="approach-step__num" aria-hidden="true">
                  {step.num}
                </span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
          <p className="approach-note">
            Not every book is a course: the readers, companions and original texts reuse the same
            shape — a text, the help it needs, and a way to practise what it has taught.
          </p>
        </section>

        <section className="approach-section">
          <Incipit label="Bibliotheca" note={`${shelf.length} books · ${textCount} texts`} />
          <div className="approach-section__head">
            <h2>The whole shelf</h2>
            <Link className="back-link" to="/library">
              Open the library →
            </Link>
          </div>
          <div className="approach-shelf">
            {groups.map((group) => (
              <article className="approach-shelf__group card" key={group.label}>
                <p className="eyebrow">{group.label}</p>
                <h3>{group.note}</h3>
                <ul>
                  {group.items.map((book) => (
                    <li key={book.slug}>
                      <Link to={`/library/${book.slug}`}>
                        <span>{book.shortTitle}</span>
                        <span className="approach-shelf__count">
                          {book.chapterCount || book.chapters.length}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          {goalBook && (
            <p className="approach-goal">
              And at the end of the road: <span className="latin">{goalBook.latinTitle}</span> — the{' '}
              <em>Aeneid</em>, the <em>Eclogues</em> and the <em>Georgics</em> in their own words.
            </p>
          )}
        </section>

        <section className="approach-section">
          <Incipit label="Instrumenta" note="For the reader" />
          <h2>The tools beside the text</h2>
          <div className="approach-tools">
            <Link className="approach-tool card" to="/dictionary">
              <span className="approach-tool__mark" aria-hidden="true">
                A
              </span>
              <h3>The Lexicon</h3>
              <p>
                Every form in the readings, its headword and sense, and the chapter it comes from.
                More than 30,000 words, with examples.
              </p>
              <span className="approach-tool__link">Open the dictionary →</span>
            </Link>
            <Link className="approach-tool card" to="/iter">
              <span className="approach-tool__mark" aria-hidden="true">
                VIA
              </span>
              <h3>The Iter</h3>
              <p>
                The whole course as one road: nine stages, every lesson, and a map that remembers
                what you have read.
              </p>
              <span className="approach-tool__link">Open the itinerary →</span>
            </Link>
            <Link className="approach-tool card" to="/library">
              <span className="approach-tool__mark" aria-hidden="true">
                LIB
              </span>
              <h3>The Library</h3>
              <p>
                The course, the exercise books, the companions, the readers and the authors — shelved
                together and labelled by grammar, theme and text.
              </p>
              <span className="approach-tool__link">Browse the library →</span>
            </Link>
            <Link className="approach-tool card" to="/profile">
              <span className="approach-tool__mark" aria-hidden="true">
                ME
              </span>
              <h3>Your reading</h3>
              <p>
                A local-first record of what you have read, with an optional copy in your account
                for another device.
              </p>
              <span className="approach-tool__link">Open your profile →</span>
            </Link>
          </div>
        </section>

        <section className="section-tight approach-close">
          <blockquote className="motto">
            <p className="motto__latin latin">Arma virumque canō, Troiae quī prīmus ab ōrīs</p>
            <footer className="motto__source">Vergil, Aeneid I.1</footer>
          </blockquote>
          <div className="approach-close__actions">
            <Link
              className="btn btn--primary"
              to={`/library/${familiaRomanaBook.slug}/${firstChapter.slug}`}
            >
              Begin Capitulum I →
            </Link>
            <Link className="btn btn--ghost" to="/iter">
              See the road first
            </Link>
          </div>
        </section>
      </div>
    </section>
  )
}
