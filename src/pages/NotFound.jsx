import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="section">
      <div className="container-narrow" style={{ textAlign: 'center', padding: '3rem 0' }}>
        <p className="eyebrow">Erratum</p>
        <h1>This page is not in the book.</h1>
        <p className="lead">The page you asked for could not be found.</p>
        <p>
          <Link className="btn btn--primary" to="/home">
            Return home
          </Link>
        </p>
      </div>
    </section>
  )
}
