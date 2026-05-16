import type { ReactNode } from 'react'
import { fromSqliteToCosmosDb } from './from-sqlite-to-cosmos-db'

export type BlogPost = {
  slug: string
  title: string
  subtitle?: string
  date: string
  readingTime?: string
  tags: string[]
  summary: string
  externalUrl?: string
  body: ReactNode
}

export const blogPosts: BlogPost[] = [fromSqliteToCosmosDb]

export const getPostBySlug = (slug: string): BlogPost | undefined =>
  blogPosts.find((p) => p.slug === slug)
