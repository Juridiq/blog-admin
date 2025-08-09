import payload from 'payload'
import type { CollectionConfig } from 'payload'
import type { PayloadRequest } from 'payload'

import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'

export const Features: CollectionConfig = {
  slug: 'features',
  auth: false,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'date'],
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterRead: [
      ({ doc }) => {
        if (doc?.description) {
          doc.descriptionHtml = convertLexicalToHTML({ data: doc.description })
        }
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'workspace',
      type: 'relationship',
      relationTo: 'workspaces',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'richText',
      required: true,
      editor: lexicalEditor({}),
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      defaultValue: () => new Date(),
      admin: {
        position: 'sidebar',
      },
    },
  ],
  endpoints: [
    {
      path: '/unread',
      method: 'get',
      handler: async (req: PayloadRequest) => {
        try {
          const userId = req.headers.get('x-user-id') as string
          if (!userId) {
            return Response.json({ error: 'missing userId' }, { status: 400 })
          }

          const limit = Number(req.query.limit ?? 10)
          const since = req.query.since ? new Date(String(req.query.since)) : undefined

          // 1) leituras do usuário
          const reads = await payload.find({
            collection: 'featureReads',
            where: { externalUserId: { equals: userId } },
            limit: 10000,
            depth: 0,
            req,
          })
          const readIds = new Set(reads.docs.map((r: any) => String(r.feature)))

          // 2) traga features e filtre localmente
          const featureQuery: any = { sort: '-date', limit: 100, req }
          if (since) {
            featureQuery.where = {
              ...(featureQuery.where || {}),
              date: { greater_than_equal: since.toISOString() },
            }
          }

          const all = await payload.find({ collection: 'features', ...featureQuery })
          const unread = all.docs.filter((f: any) => !readIds.has(String(f.id)))

          return Response.json({ total: unread.length, docs: unread.slice(0, limit) })
        } catch {
          return Response.json({ error: 'Internal server error' }, { status: 500 })
        }
      },
    },
    {
      path: '/mark-read',
      method: 'post',
      handler: async (req: PayloadRequest) => {
        try {
          const userId = req.headers.get('x-user-id') as string
          if (!userId) {
            return Response.json({ error: 'missing userId' }, { status: 400 })
          }

          const body = (await req.json?.()) || req.body
          const ids: string[] = Array.isArray(body?.featureIds) ? body.featureIds : []
          if (!ids.length) {
            return Response.json({ error: 'featureIds required' }, { status: 400 })
          }

          const results = await Promise.allSettled(
            ids.map(async (featureId) => {
              try {
                const existing = await payload.find({
                  collection: 'featureReads',
                  where: {
                    and: [
                      { feature: { equals: featureId } },
                      { externalUserId: { equals: userId } },
                    ],
                  },
                  limit: 1,
                  req,
                })
                if (existing.docs.length === 0) {
                  await payload.create({
                    collection: 'featureReads',
                    data: {
                      feature: Number(featureId),
                      externalUserId: userId,
                      readAt: new Date().toISOString(),
                    },
                    req,
                  })
                }
                return { success: true }
              } catch (error: any) {
                if (String(error?.message || '').includes('duplicate key')) {
                  return { success: true }
                }
                return { success: false, error: error?.message || 'unknown error' }
              }
            }),
          )

          const ok = results.filter(
            (r) => r.status === 'fulfilled' && (r.value as any).success,
          ).length
          return Response.json({ ok, total: ids.length })
        } catch {
          return Response.json({ error: 'Internal server error' }, { status: 500 })
        }
      },
    },
  ],
}
