import { Navigate, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Library from './pages/Library.jsx'
import Dictionary from './pages/Dictionary.jsx'
import DictionaryDetail from './pages/DictionaryDetail.jsx'
import Wordlist from './pages/Wordlist.jsx'
import WordlistReview from './pages/WordlistReview.jsx'
import Profile from './pages/Profile.jsx'
import BookPage from './pages/BookPage.jsx'
import ChapterPage from './pages/ChapterPage.jsx'
import ExtraPage from './pages/ExtraPage.jsx'
import ReferencePage from './pages/ReferencePage.jsx'
import Iter from './pages/Iter.jsx'
import NotFound from './pages/NotFound.jsx'
import { useAccount } from './lib/account.jsx'

// The root is a doorway: returning readers go straight to their tabula,
// new ones to the front page. Wait for the stored session before choosing,
// so a signed-in reader never flashes the home page.
function StartRoute() {
  const { authState } = useAccount()

  if (authState === 'loading') {
    return (
      <section className="section">
        <div className="container">
          <p className="muted" role="status">Checking your session…</p>
        </div>
      </section>
    )
  }

  return <Navigate to={authState === 'signed-in' ? '/profile' : '/home'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<StartRoute />} />
        <Route path="home" element={<Home />} />
        <Route path="library" element={<Library />} />
        <Route path="dictionary" element={<Dictionary />} />
        <Route path="dictionary/:word" element={<DictionaryDetail />} />
        <Route path="wordlist" element={<Wordlist />} />
        <Route path="wordlist/review" element={<WordlistReview />} />
        <Route path="iter" element={<Iter />} />
        <Route path="profile" element={<Profile />} />
        <Route path="library/:bookSlug" element={<BookPage />} />
        <Route path="library/:bookSlug/read/:chapterId" element={<ReferencePage />} />
        <Route path="library/:bookSlug/extra/:extraSlug" element={<ExtraPage />} />
        <Route path="library/:bookSlug/:chapterSlug" element={<ChapterPage />} />
        {/* The approach now lives on the home page; keep old links working. */}
        <Route path="approach" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
