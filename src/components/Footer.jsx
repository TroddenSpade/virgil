import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div className="site-footer__brand">
          <Logo size={46} />
          <div>
            <p className="site-footer__name">VIRGIL</p>
          </div>
        </div>

        <nav className="site-footer__nav" aria-label="Footer">
          <p className="site-footer__label">Index</p>
          <Link to="/library">Library</Link>
          <Link to="/iter">Iter</Link>
          <Link to="/dictionary">Dictionary</Link>
          <Link to="/wordlist">Wordlist</Link>
          <Link to="/profile">Profile</Link>
        </nav>

        <div className="site-footer__family">
          <p className="site-footer__label">Ex eādem officīnā</p>
          <a href="https://rhetoric.parsasam.ir">
            Rhetoric <span aria-hidden="true">↗</span>
          </a>
          <a href="https://cadence.parsasam.ir">
            Cadence <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>

      <div className="container site-footer__fine">
        <p>Text and exercises after H. H. Ørberg, Lingua Latina per se Illustrata.</p>
        <p className="latin">Arma virumque canō…</p>
      </div>
    </footer>
  )
}
