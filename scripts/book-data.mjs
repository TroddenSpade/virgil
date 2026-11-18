// Script-only access to the full book data.
//
// The app deliberately keeps full chapter text out of the eager registry and
// loads one book at a time. Build and validation scripts, however, need every
// chapter. This module merges the light registry with the full modules and
// attaches the generated keywords, without putting any of it in the app
// bundle.
import { booksMeta } from '../src/data/books-meta.generated.js'
import { chapterKeywords } from '../src/data/chapter-keywords.generated.js'
import { BOOK_MODULES } from './book-modules.mjs'

const modules = await Promise.all(
  BOOK_MODULES.map((name) => import(`../src/data/${name}/index.js`)),
)

const bySlug = new Map(
  modules.map((mod) => {
    const extras = mod.book.extras || mod.extras || []
    return [
      mod.book.slug,
      {
        book: mod.book,
        chapters: mod.chapters || [],
        extras,
      },
    ]
  }),
)

export const books = booksMeta.map((meta) => {
  const full = bySlug.get(meta.slug)
  if (!full) throw new Error(`No full data for ${meta.slug}`)

  const referenceIds = new Map(
    meta.chapters.map((chapter) => [chapter.number, chapter.referenceId]),
  )

  const chapters = full.chapters.map((chapter) => ({
    ...chapter,
    referenceId: referenceIds.get(chapter.number) || null,
    keywords: chapterKeywords[`${meta.slug}/${chapter.slug}`] || [],
  }))

  return {
    ...meta,
    ...full.book,
    chapters,
    extras: full.extras,
  }
})
