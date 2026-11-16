import { Link } from 'react-router-dom'
import { books, levelGroups } from '../data/library.js'

function BookCard({ book }) {
  const isActive = book.status === 'active'
  const Card = isActive ? Link : 'div'
  const cardProps = isActive
    ? { to: `/library/${book.slug}`, className: `book-card card is-active accent-${book.accent}` }
    : { className: `book-card card is-planned accent-${book.accent}` }
  return (
    <Card {...cardProps}>
      <div className="book-card__top">
        <span className="book-card__level">{book.level}</span>
        {isActive ? (
          <span className="tag tag--laurel">open</span>
        ) : (
          <span className="tag tag--gold">soon</span>
        )}
      </div>
      <h2 className="book-card__title">{book.title}</h2>
      {book.latinTitle && <p className="book-card__latin latin">{book.latinTitle}</p>}
      <p className="book-card__meta muted">
        {book.author}
        {book.year ? ` · ${book.year}` : ''}
      </p>
      <p className="book-card__summary">{book.summary}</p>
      {isActive && (
        <p className="book-card__cta">
          {book.chapterCount} {book.unitPlural || 'chapters'} ·{' '}
          {book.kind === 'reference'
            ? 'full text'
            : book.kind === 'commentary'
              ? `${book.readyCount} chapters`
              : book.kind === 'reader'
                ? book.readingCount
                  ? `${book.readingCount} ${book.readingUnitPlural || 'colloquia'}`
                  : `${book.readyCount} ${book.readingUnitPlural || 'colloquia'}`
                : book.kind === 'workbook'
                  ? book.readingCount
                    ? `${book.readingCount} ${book.readingUnitPlural || 'exercises'}`
                    : `${book.readyCount} capitula`
                  : `${book.readyCount} lessons`}{' '}
          <span aria-hidden="true">→</span>
        </p>
      )}
    </Card>
  )
}

export default function Library() {
  const levels = levelGroups
    .map((group) => ({
      ...group,
      books: books.filter((book) => book.levelGroup === group.id),
    }))
    .filter((group) => group.books.length)

  return (
    <section className="section">
      <div className="container">
        <p className="eyebrow">Bibliotheca</p>
        <h1>The Library</h1>
        <p className="lead" style={{ maxWidth: '90ch' }}>
          The whole course, arranged as a shelf of books. Familia Romana begins the course and Roma Aeterna
          carries it on through Aeneas and the Roman Republic, with the Exercitia Latina, the Colloquia Personarum,
          the Fabulae Syrae, the Sermones Romani and the Epitome Historiae Sacrae beside them. The companions offer
          chapter-by-chapter commentary on Familia Romana and Roma Aeterna, while Learn Latin from the Romans, Latin
          via Ovid, Exercitia Latina II and the Latin texts of Caesar, Vergil, Ovid, Petronius, Sallust, Cicero and
          Plautus are here in full. Together they lead from your first Latin sentence to the poetry of Virgil.
        </p>

        <nav className="library-levels" aria-label="Learning stages">
          {levels.map((group) => (
            <a key={group.id} href={`#level-${group.id}`} className="library-levels__link">
              <span className="library-levels__latin latin">{group.latin}</span>
              <span className="library-levels__title">{group.title}</span>
              <span className="library-levels__count">
                {group.books.length} {group.books.length === 1 ? 'book' : 'books'}
              </span>
            </a>
          ))}
        </nav>

        {levels.map((group) => (
          <section key={group.id} className="library-level" aria-labelledby={`level-${group.id}`}>
            <header className="library-level__head">
              <div>
                <p className="eyebrow">{group.latin}</p>
                <h2 className="library-level__title" id={`level-${group.id}`}>
                  {group.title}
                </h2>
              </div>
              <p className="library-level__count">
                {group.books.length} {group.books.length === 1 ? 'book' : 'books'}
              </p>
            </header>
            <p className="library-level__desc muted">{group.description}</p>

            <div className="book-grid">
              {group.books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}
