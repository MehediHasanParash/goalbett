"use client"

import useSWR from "swr"

const fetcher = (url) => fetch(url).then((res) => res.json())

// Hook to get all sports
export function useSports(options = {}) {
  const { featured = false, category = null } = options

  let url = "/api/sports?"
  if (featured) url += "featured=true&"
  if (category) url += `category=${category}&`

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // Cache for 1 minute
  })

  return {
    sports: data?.data || [],
    isLoading,
    isError: error,
    mutate,
  }
}

// Hook to get a single sport by slug
export function useSport(slug) {
  const { data, error, isLoading } = useSWR(slug ? `/api/sports/${slug}` : null, fetcher, { revalidateOnFocus: false })

  return {
    sport: data?.data || null,
    isLoading,
    isError: error,
  }
}

// Hook to get leagues
export function useLeagues(options = {}) {
  const { sportSlug = null, sportId = null, featured = false, country = null } = options

  let url = "/api/leagues?"
  if (sportSlug) url += `sport=${sportSlug}&`
  if (sportId) url += `sportId=${sportId}&`
  if (featured) url += "featured=true&"
  if (country) url += `country=${country}&`

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  })

  return {
    leagues: data?.data || [],
    isLoading,
    isError: error,
    mutate,
  }
}
