import { useEffect, useMemo, useState } from 'react'
import { iterStages, iterLessonCount } from '../data/learning-path.generated.js'
import { readBookProgress } from '../lib/progress.js'

/** The itinerary, its stages, and the next unlearned lesson. */
export function useLearningPath() {
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1)
    const onStorage = (event) => {
      if (
        event.type === 'storage' ||
        event.detail?.key?.startsWith('virgil:progress:')
      ) {
        refresh()
      }
    }
    window.addEventListener('virgil:storage', onStorage)
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', refresh)
    return () => {
      window.removeEventListener('virgil:storage', onStorage)
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  const path = useMemo(() => {
    const progress = new Map()
    for (const bookId of new Set(
      iterStages.flatMap((stage) => stage.lessons.map((lesson) => lesson.bookId)),
    )) {
      progress.set(bookId, new Set(readBookProgress(bookId)))
    }
    const isDone = (lesson) => progress.get(lesson.bookId)?.has(lesson.number) ?? false

    let doneCount = 0
    let next = null
    const stages = iterStages.map((stage, index) => {
      const learned = stage.lessons.filter(isDone).length
      if (!next) {
        const lesson = stage.lessons.find((item) => !isDone(item))
        if (lesson) next = { lesson, stage, index }
      }
      doneCount += learned
      return {
        ...stage,
        index,
        learned,
        percent: stage.lessonCount ? Math.round((learned / stage.lessonCount) * 100) : 0,
      }
    })

    return {
      stages,
      doneCount,
      percent: iterLessonCount ? Math.round((doneCount / iterLessonCount) * 100) : 0,
      next,
    }
  }, [revision])

  return path
}
