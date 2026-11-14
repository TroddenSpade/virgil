import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { getBook } from '../data/library.js'
import Logo from './Logo.jsx'
import ThemeToggle from './ThemeToggle.jsx'

function pageContext(pathname) {
  const parts = pathname.split('/').filter(Boolean)
  if (!parts.length) return null
  if (parts[0] === 'library') {
    if (!parts[1]) return { root: { to: '/library', label: 'Library' } }
    const book = getBook(parts[1])
    if (!book) return { root: { to: '/library', label: 'Library' } }
    let page = null
    if (parts[2] === 'extra' && parts[3]) {
      const extra = book.extras?.find((item) => item.slug === parts[3])
      page = extra?.title || 'Reference'
    } else if (parts[2]) {
      const chapter = book.chapters?.find((item) => item.slug === parts[2])
      if (chapter) {
        page = chapter.latinTitle
          ? `${chapter.latinTitle}${chapter.title ? ` · ${chapter.title}` : ''}`
          : chapter.title
      }
    }
    return {
      root: { to: '/library', label: 'Library' },
      book: { to: `/library/${book.slug}`, label: book.shortTitle },
      page,
    }
  }
  if (parts[0] === 'wordlist') {
    return parts[1] === 'review'
      ? { root: { to: '/wordlist', label: 'Wordlist' }, page: 'Review' }
      : { page: 'Wordlist' }
  }
  const labels = {
    dictionary: 'Dictionary',
    approach: 'Approach',
    profile: 'Profile',
    library: 'Library',
    iter: 'Iter',
  }
  return { page: labels[parts[0]] || null }
}

export default function Header() {
  const { pathname } = useLocation()
  const context = pageContext(pathname)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!menuOpen) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <header className={`site-header${menuOpen ? ' site-header--menu-open' : ''}`}>
      <div className="container site-header__inner">
        <Link to="/" className="brand" aria-label="Virgil — home">
          <Logo size={40} className="brand__mark" />
          <span className="brand__text">
            <span className="brand__name">VIRGIL</span>
            <span className="brand__tag">PVBLIVS·VERGILIVS·MARO</span>
          </span>
        </Link>

        <button
          type="button"
          className="site-nav__toggle icon-btn"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="site-nav__toggle-bars" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>

        <nav
          id="site-menu"
          className={`site-nav${menuOpen ? ' is-open' : ''}`}
          aria-label="Primary"
        >
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/iter">Iter</NavLink>
          <NavLink to="/library">Library</NavLink>
          <NavLink to="/dictionary">Dictionary</NavLink>
          <NavLink to="/wordlist">Wordlist</NavLink>
          <NavLink to="/approach">Approach</NavLink>
          <NavLink to="/profile">Profile</NavLink>
          <ThemeToggle />
        </nav>
      </div>

      {menuOpen && (
        <button
          type="button"
          className="site-menu-backdrop"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {context && (
        <div className="site-header__context container" aria-label="Breadcrumb">
          {context.root && (
            <Link to={context.root.to} className="site-header__context-link">
              {context.root.label}
            </Link>
          )}
          {context.book && (
            <span className="site-header__context-book-group">
              <span className="site-header__context-sep" aria-hidden="true">·</span>
              <Link to={context.book.to} className="site-header__context-link site-header__context-book">
                {context.book.label}
              </Link>
            </span>
          )}
          {context.page && (
            <>
              {(context.root || context.book) && (
                <span className="site-header__context-sep" aria-hidden="true">·</span>
              )}
              <span className="site-header__context-page">{context.page}</span>
            </>
          )}
        </div>
      )}
    </header>
  )
}
