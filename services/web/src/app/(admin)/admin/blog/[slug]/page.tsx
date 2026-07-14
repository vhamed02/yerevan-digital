import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { serverAuthGet } from '@/lib/server-api'
import PostEditorClient from '@/components/admin/PostEditorClient'
import type { Post } from '@/types'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  return { title: `Edit post: ${slug} — Yerevan Digital Admin` }
}

export default async function PostEditorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await serverAuthGet<Post>(`/admin/posts/${slug}`)
  if (!post) notFound()
  return <PostEditorClient post={post} />
}
