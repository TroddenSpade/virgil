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

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
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
        <Route path="approach" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
