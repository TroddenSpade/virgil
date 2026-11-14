import { Link } from 'react-router-dom'
import {
  books,
  familiaRomanaBook,
  romaAeternaBook,
  exercitiaBook,
  latinViaOvidBook,
  companionBook,
  colloquiaBook,
  fabulaeBook,
  sermonesBook,
  exercitiaIIBook,
  caesarBook,
  epitomeBook,
  petroniusBook,
  arsBook,
  companionRABook,
  aeneisBook,
  catilinaBook,
  amphitryoBook,
} from '../data/library.js'
import { iterStages, iterLessonCount } from '../data/learning-path.generated.js'
import { useProgress } from '../hooks/useLocalStorage.js'
import VirgilLines from '../components/VirgilLines.jsx'

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

const firstChapter = familiaRomanaBook.chapters[0]
const firstRomaAeternaChapter = romaAeternaBook.chapters[0]

// The shelf as the project really stands: every book that carries text.
const shelf = books.filter((book) => book.chapters?.length)
const bookCount = shelf.length
const textCount = shelf.reduce((total, book) => total + (book.chapterCount || 0), 0)
const stageCount = iterStages.length
const goalBook = books.find((book) => book.isGoal)

// The small-caps label, a rule, and a Latin note that open every section.
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

export default function Home() {
  const { count, percent } = useProgress(familiaRomanaBook.id, familiaRomanaBook.chapterCount)
  const romaProgress = useProgress(romaAeternaBook.id, romaAeternaBook.chapterCount)
  const companionProgress = useProgress(companionBook.id, companionBook.chapterCount)
  const colloquiaProgress = useProgress(colloquiaBook.id, colloquiaBook.chapterCount)
  const fabulaeProgress = useProgress(fabulaeBook.id, fabulaeBook.chapterCount)

  return (
    <>
      <section className="hero">
        <div className="container">
          {/* The framed leaf: the dedicatory box, with the poet's sketch
              faintly engraved behind the copy. */}
          <div className="hero__plate rise">
            <div className="hero__engraving" aria-hidden="true">
              <div className="hero__verses">
                <p className="hero__verses-label">Aeneis · Liber I</p>
                <p className="hero__verses-text" lang="la">
                  Arma virumque canō, Troiae quī prīmus ab ōrīs
                  <br />
                  Ītaliam fātō profugus Lāvīniaque vēnit
                  <br />
                  lītora, multum ille et terrīs iactātus et altō
                  <br />
                  vī superum saevae memorem Iūnōnis ob īram;
                  <br />
                  multa quoque et bellō passus, dum conderet urbem
                  <br />
                  īnferretque deōs Latiō, genus unde Latīnum
                  <br />
                  Albānīque patrēs atque altae moenia Rōmae.
                </p>
                <p className="hero__verses-ref">I.1–7</p>
              </div>
              <span className="hero__sketch" />
            </div>

            <div className="hero__inner">
              <div className="hero__copy">
                <Incipit label="Lingua Latina" note="Per Sē Illūstrāta" />
                <h1 className="hero__title">
                  Learn Latin,
                  <br />
                  and arrive at <em>Virgil</em>.
                </h1>
                <p className="hero__lead lead">
                  Virgil is a Latin reading project. You begin with the first sentence of Ørberg’s{' '}
                  <em>Familia Romana</em> — <span className="latin">Roma in Italiā est</span> — and, chapter by
                  chapter, read your way toward the poetry of the <em>Aeneid</em>. No translation. No memorising
                  word lists before you read. Just Latin, understood from the very first page.
                </p>
                <div className="hero__actions">
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
            </div>

            <dl className="hero__stats">
              <div className="hero__stat">
                <dt>Books</dt>
                <dd>{bookCount}</dd>
              </div>
              <div className="hero__stat">
                <dt>Texts &amp; chapters</dt>
                <dd>{textCount}</dd>
              </div>
              <div className="hero__stat">
                <dt>Itinerary lessons</dt>
                <dd>{iterLessonCount}</dd>
              </div>
              <div className="hero__stat">
                <dt>Stages</dt>
                <dd>{stageCount}</dd>
              </div>
            </dl>
            <p className="hero__note">
              An installable, offline reading app — {textCount} texts across {bookCount} books, and one road
              of {iterLessonCount} lessons to the <em>Aeneid</em>.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Incipit label="Ratiō" note="The method" />
          <h2>How the project works</h2>
          <div className="feature-grid">
            <article className="feature card">
              <span className="feature__num" aria-hidden="true">I</span>
              <h3>Read from day one</h3>
              <p>
                Following Ørberg’s direct method, every word is explained by the words around it, by pictures and
                by short marginal notes — so meaning comes first and grammar grows out of the reading.
              </p>
            </article>
            <article className="feature card">
              <span className="feature__num" aria-hidden="true">II</span>
              <h3>Grammar in context</h3>
              <p>
                Each chapter has a <em>Grammatica Latina</em> section with clear paradigms — singular and plural,
                the cases, the verb — always tied to sentences you have just read.
              </p>
            </article>
            <article className="feature card">
              <span className="feature__num" aria-hidden="true">III</span>
              <h3>Practise, then move on</h3>
              <p>
                The original exercises (<em>Pensum A, B, C</em>) are here with instant checking and model answers,
                and a vocabulary trainer with flashcards for every chapter.
              </p>
            </article>
            <article className="feature card">
              <span className="feature__num" aria-hidden="true">IV</span>
              <h3>Read the authors themselves</h3>
              <p>
                The road ends in real Latin: unadapted texts from the great writers — Ovid, Virgil, Caesar and
                Cicero — with vocabulary, scansion and commentary beside them, until you are reading the{' '}
                <em>Aeneid</em> in its own words.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <Incipit label="Bibliotheca" note={`${bookCount} books · ${textCount} texts`} />
          <h2>The texts</h2>
          <p className="lead" style={{ maxWidth: '64ch' }}>
            Familia Romana begins the course and Roma Aeterna carries it on, with the readers, the exercise
            books and the companions beside them — every text, marked as you read.
          </p>

          <div className="book-feature-list">
            <div className="book-feature card">
              <div className="book-feature__body">
                <p className="eyebrow">Now available</p>
                <h2>{familiaRomanaBook.title}</h2>
                <p>{familiaRomanaBook.summary}</p>
                <div className="book-feature__progress">
                  <div className="progress" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
                    <div className="progress__fill" style={{ width: `${percent}%` }} />
                  </div>
                  <span className="muted" style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8rem' }}>
                    {count} of {familiaRomanaBook.chapterCount} chapters marked as learned
                  </span>
                </div>
                <div className="hero__actions">
                  <Link className="btn btn--primary" to={`/library/${familiaRomanaBook.slug}`}>
                    Open the book
                  </Link>
                  <Link className="btn btn--ghost" to={`/library/${familiaRomanaBook.slug}/${firstChapter.slug}`}>
                    Start Capitulum I
                  </Link>
                </div>
              </div>
              <div className="book-feature__spine" aria-hidden="true">
                <span className="book-feature__spine-text">FAMILIA ROMANA</span>
              </div>
            </div>

            <div className="book-feature card">
              <div className="book-feature__body">
                <p className="eyebrow">Now available · Companion</p>
                <h2>{companionBook.title}</h2>
                <p>{companionBook.summary}</p>
                <div className="book-feature__progress">
                  <div className="progress" role="progressbar" aria-valuenow={companionProgress.percent} aria-valuemin={0} aria-valuemax={100}>
                    <div className="progress__fill" style={{ width: `${companionProgress.percent}%` }} />
                  </div>
                  <span className="muted" style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8rem' }}>
                    {companionProgress.count} of {companionBook.chapterCount} chapters marked as learned
                  </span>
                </div>
                <div className="hero__actions">
                  <Link className="btn btn--primary" to={`/library/${companionBook.slug}`}>
                    Open the Companion
                  </Link>
                  <Link className="btn btn--ghost" to={`/library/${companionBook.slug}/${companionBook.chapters[0].slug}`}>
                    Start Chapter I
                  </Link>
                </div>
              </div>
              <div className="book-feature__spine" aria-hidden="true" style={{ background: 'linear-gradient(160deg, #7a5a1f, #3c2a0c)' }}>
                <span className="book-feature__spine-text">COMES I</span>
              </div>
            </div>

            <div className="book-feature card">
              <div className="book-feature__body">
                <p className="eyebrow">Now available · Reader</p>
                <h2>{colloquiaBook.title}</h2>
                <p>{colloquiaBook.summary}</p>
                <div className="book-feature__progress">
                  <div className="progress" role="progressbar" aria-valuenow={colloquiaProgress.percent} aria-valuemin={0} aria-valuemax={100}>
                    <div className="progress__fill" style={{ width: `${colloquiaProgress.percent}%` }} />
                  </div>
                  <span className="muted" style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8rem' }}>
                    {colloquiaProgress.count} of {colloquiaBook.chapterCount} colloquia marked as learned
                  </span>
                </div>
                <div className="hero__actions">
                  <Link className="btn btn--primary" to={`/library/${colloquiaBook.slug}`}>
                    Open the reader
                  </Link>
                  <Link className="btn btn--ghost" to={`/library/${colloquiaBook.slug}/${colloquiaBook.chapters[0].slug}`}>
                    Start Colloquium I
                  </Link>
                </div>
              </div>
              <div className="book-feature__spine" aria-hidden="true" style={{ background: 'linear-gradient(160deg, var(--laurel), #2f4a28)' }}>
                <span className="book-feature__spine-text">COLLOQVIA</span>
              </div>
            </div>

            <div className="book-feature card">
              <div className="book-feature__body">
                <p className="eyebrow">Now available · Fables</p>
                <h2>{fabulaeBook.title}</h2>
                <p>{fabulaeBook.summary}</p>
                <div className="book-feature__progress">
                  <div className="progress" role="progressbar" aria-valuenow={fabulaeProgress.percent} aria-valuemin={0} aria-valuemax={100}>
                    <div className="progress__fill" style={{ width: `${fabulaeProgress.percent}%` }} />
                  </div>
                  <span className="muted" style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8rem' }}>
                    {fabulaeProgress.count} of {fabulaeBook.chapterCount} capitula marked as learned · {fabulaeBook.readingCount} fables
                  </span>
                </div>
                <div className="hero__actions">
                  <Link className="btn btn--primary" to={`/library/${fabulaeBook.slug}`}>
                    Open the fables
                  </Link>
                  <Link className="btn btn--ghost" to={`/library/${fabulaeBook.slug}/${fabulaeBook.chapters[0].slug}`}>
                    Start Capitulum XXVI
                  </Link>
                </div>
              </div>
              <div className="book-feature__spine" aria-hidden="true" style={{ background: 'linear-gradient(160deg, #6d5a2a, #2f2a17)' }}>
                <span className="book-feature__spine-text">FABVLAE SYRAE</span>
              </div>
            </div>

            <div className="book-feature card">
              <div className="book-feature__body">
                <p className="eyebrow">Now available · Pars II</p>
                <h2>{romaAeternaBook.title}</h2>
                <p>{romaAeternaBook.summary}</p>
                <div className="book-feature__progress">
                  <div className="progress" role="progressbar" aria-valuenow={romaProgress.percent} aria-valuemin={0} aria-valuemax={100}>
                    <div className="progress__fill" style={{ width: `${romaProgress.percent}%` }} />
                  </div>
                  <span className="muted" style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8rem' }}>
                    {romaProgress.count} of {romaAeternaBook.chapterCount} chapters marked as learned
                  </span>
                </div>
                <div className="hero__actions">
                  <Link className="btn btn--primary" to={`/library/${romaAeternaBook.slug}`}>
                    Open the book
                  </Link>
                  <Link className="btn btn--ghost" to={`/library/${romaAeternaBook.slug}/${firstRomaAeternaChapter.slug}`}>
                    Start Capitulum XXXVI
                  </Link>
                </div>
              </div>
              <div className="book-feature__spine" aria-hidden="true" style={{ background: 'linear-gradient(160deg, var(--bronze), #6f4c12)' }}>
                <span className="book-feature__spine-text">ROMA AETERNA</span>
              </div>
            </div>
          </div>

          <p className="home-more">
            <Link className="btn btn--ghost" to="/library">
              See the whole shelf →
            </Link>
          </p>
        </div>
      </section>

      <section className="section home-road-section">
        <div className="container">
          <Incipit label="Iter" note="The road to the Aeneid" />
          <h2>Where this is going</h2>
          <p className="lead" style={{ maxWidth: '62ch' }}>
            Nine stages carry you from the first sentence to the authors themselves — and on, past Caesar and
            Ovid, to the poetry of Virgil.
          </p>

          <ol className="home-road">
            {iterStages.map((stage, index) => (
              <li key={stage.id} className="home-road__stop">
                <span className="home-road__node" aria-hidden="true">
                  {ROMAN[index] || index + 1}
                </span>
                <div className="home-road__body">
                  <p className="home-road__latin latin">{stage.latin}</p>
                  <h3 className="home-road__title">{stage.title}</h3>
                  <p className="home-road__blurb">{stage.blurb}</p>
                  <p className="home-road__meta">
                    <span>{stage.lessonCount} lessons</span>
                    <Link to={`/iter#${stage.id}`}>Open in the itinerary →</Link>
                  </p>
                </div>
              </li>
            ))}

            {goalBook && (
              <li className="home-road__stop is-goal">
                <span className="home-road__node" aria-hidden="true">
                  ✶
                </span>
                <div className="home-road__body">
                  <p className="home-road__latin latin">{goalBook.latinTitle}</p>
                  <h3 className="home-road__title">{goalBook.title}</h3>
                  <p className="home-road__blurb">{goalBook.summary}</p>
                  <p className="home-road__meta">
                    <span>The destination · in preparation</span>
                  </p>
                </div>
              </li>
            )}
          </ol>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <VirgilLines />
        </div>
      </section>
    </>
  )
}
