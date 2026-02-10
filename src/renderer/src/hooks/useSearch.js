import { useState, useCallback } from 'react'

export function useSearch() {
  const [searchActive, setSearchActive] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [matchCount, setMatchCount] = useState(0)

  const matchInfo = searchQuery
    ? { activeMatchOrdinal: matchCount > 0 ? activeIndex + 1 : 0, matches: matchCount }
    : null

  const openSearch = useCallback(() => setSearchActive(true), [])

  const closeSearch = useCallback(() => {
    setSearchActive(false)
    setSearchQuery('')
    setActiveIndex(0)
    setMatchCount(0)
  }, [])

  const doSearch = useCallback((query) => {
    setSearchQuery(query)
    setActiveIndex(0)
  }, [])

  const findNext = useCallback(() => {
    setActiveIndex(prev => matchCount > 0 ? (prev + 1) % matchCount : 0)
  }, [matchCount])

  const findPrev = useCallback(() => {
    setActiveIndex(prev => matchCount > 0 ? (prev - 1 + matchCount) % matchCount : 0)
  }, [matchCount])

  return {
    searchActive, searchQuery, matchInfo,
    activeIndex, setMatchCount,
    openSearch, closeSearch, doSearch, findNext, findPrev
  }
}
