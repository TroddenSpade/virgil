import { lazy } from 'react'
import { Navigate, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Library from './pages/Library.jsx'
import { useAccount } from './lib/account.jsx'

// Reading, practice and account pages are split into their own chunks. Home
// and Library stay eager: they are the two entry points and share the light
// book registry.
const Dictionary = lazy(() => import('./pages/Dictionary.jsx'))
const DictionaryDetail = lazy(() => import('./pages/DictionaryDetail.jsx'))
const ParadigmPage = lazy(() => import('./pages/ParadigmPage.jsx'))
const ParadigmPracticePage = lazy(() => import('./pages/ParadigmPracticePage.jsx'))
const Wordlist = lazy(() => import('./pages/Wordlist.jsx'))
const WordlistReview = lazy(() => import('./pages/WordlistReview.jsx'))
const Profile = lazy(() => import('./pages/Profile.jsx'))
const HodiePage = lazy(() => import('./pages/HodiePage.jsx'))
const BookPage = lazy(() => import('./pages/BookPage.jsx'))
const ChapterPage = lazy(() => import('./pages/ChapterPage.jsx'))
const ExtraPage = lazy(() => import('./pages/ExtraPage.jsx'))
const ReferencePage = lazy(() => import('./pages/ReferencePage.jsx'))
const Iter = lazy(() => import('./pages/Iter.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))

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
        <Route path="dictionary/:word/paradigm/practice" element={<ParadigmPracticePage />} />
        <Route path="dictionary/:word/paradigm" element={<ParadigmPage />} />
        <Route path="dictionary/:word" element={<DictionaryDetail />} />
        <Route path="wordlist" element={<Wordlist />} />
        <Route path="wordlist/review" element={<WordlistReview />} />
        <Route path="iter" element={<Iter />} />
        <Route path="profile" element={<Profile />} />
        <Route path="hodie" element={<HodiePage />} />
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
