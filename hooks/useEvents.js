"use client"

import useSWR from "swr"

const fetcher = (url) => fetch(url).then((res) => res.json())

// Hook to get events with filters
export function useEvents(options = {}) {
  const { sportSlug = null, sportId = null, leagueId = null, status = null, featured = false, limit = 50 } = options

  let url = "/api/events?"
  if (sportSlug) url += `sport=${sportSlug}&`
  if (sportId) url += `sportId=${sportId}&`
  if (leagueId) url += `leagueId=${leagueId}&`
  if (status) url += `status=${status}&`
  if (featured) url += "featured=true&"
  url += `limit=${limit}&`

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    refreshInterval: status === "live" ? 10000 : 60000, // Refresh live events every 10s
  })

  return {
    events: data?.data || [],
    count: data?.count || 0,
    isLoading,
    isError: error,
    mutate,
  }
}

// Hook to get a single event with markets
export function useEvent(eventId, includeMarkets = true) {
  const { data, error, isLoading, mutate } = useSWR(
    eventId ? `/api/events/${eventId}?markets=${includeMarkets}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 15000, // Refresh every 15s for live odds
    },
  )

  return {
    event: data?.data?.event || null,
    markets: data?.data?.markets || [],
    isLoading,
    isError: error,
    mutate,
  }
}

// Hook to get live events
export function useLiveEvents(sportSlug = null) {
  let url = "/api/events/live"
  if (sportSlug) url += `?sport=${sportSlug}`

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 10000, // Refresh every 10s
  })

  return {
    liveEvents: data?.data || [],
    count: data?.count || 0,
    isLoading,
    isError: error,
    mutate,
  }
}

// Hook to get featured events
export function useFeaturedEvents(limit = 10) {
  const { data, error, isLoading, mutate } = useSWR(`/api/events/featured?limit=${limit}`, fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 30000,
  })

  return {
    featuredEvents: data?.data || [],
    isLoading,
    isError: error,
    mutate,
  }
}

// Hook to get markets for an event
export function useMarkets(eventId, category = null) {
  let url = eventId ? `/api/markets/${eventId}` : null
  if (url && category) url += `?category=${category}`

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 15000,
  })

  return {
    markets: data?.data || [],
    isLoading,
    isError: error,
    mutate,
  }
}
