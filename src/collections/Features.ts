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
    create: () => true,
    update: () => true,
    delete: () => true,
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
      path: '/debug',
      method: 'get',
      handler: async (req: PayloadRequest) => {
        const payloadInstance = req.payload
        return Response.json({
          collections: payloadInstance.collections
            ? Object.keys(payloadInstance.collections)
            : 'não definido',
          hasFeatureReads: !!payloadInstance.collections?.['featureReads'],
          hasFeatures: !!payloadInstance.collections?.['features'],
          payloadVersion: payloadInstance.config?.admin
            ? 'admin configurado'
            : 'admin não configurado',
        })
      },
    },
    {
      path: '/unread',
      method: 'get',
      handler: async (req: PayloadRequest) => {
        try {
          const payloadInstance = req.payload

          console.log('[FEATURES UNREAD] Payload instance:', {
            hasCollections: !!payloadInstance.collections,
            collectionsCount: payloadInstance.collections
              ? Object.keys(payloadInstance.collections).length
              : 0,
            collections: payloadInstance.collections
              ? Object.keys(payloadInstance.collections)
              : [],
          })

          const userId = req.headers.get('x-user-id') as string
          if (!userId) {
            return Response.json({ error: 'missing userId' }, { status: 400 })
          }

          const limit = Number(req.query.limit ?? 10)
          const since = req.query.since ? new Date(String(req.query.since)) : undefined

          let reads: { docs: any[] } = { docs: [] }
          if (payloadInstance.collections['featureReads']) {
            try {
              reads = await payloadInstance.find({
                collection: 'featureReads',
                where: { externalUserId: { equals: userId } },
                limit: 10000,
                depth: 0,
                req,
              })
            } catch (error) {
              console.error('[FEATURES UNREAD] Erro ao buscar featureReads:', error)
            }
          } else {
            console.error('[FEATURES UNREAD] Collection featureReads não disponível')
          }

          const readIds = new Set(reads.docs.map((r: any) => String(r.feature)))

          const featureQuery: any = { sort: '-date', limit: 100, req }
          if (since) {
            featureQuery.where = {
              date: { greater_than_equal: since.toISOString() },
            }
          }

          if (!payloadInstance.collections['features']) {
            console.error('[FEATURES UNREAD] Collection features não disponível')
            return Response.json(
              {
                error: 'Features collection not available',
              },
              { status: 503 },
            )
          }

          const all = await payloadInstance.find({ collection: 'features', ...featureQuery })

          if (all.docs.length === 0) {
            return Response.json({ total: 0, docs: [] })
          }

          const unread = all.docs.filter((f: any) => !readIds.has(String(f.id)))

          const result = {
            total: unread?.length || 0,
            docs: unread?.slice(0, limit) || [],
            readIds: Array.from(readIds),
          }

          return Response.json(result)
        } catch (error) {
          console.error('[FEATURES UNREAD] Erro capturado:', {
            message: error instanceof Error ? error.message : 'Erro desconhecido',
            stack: error instanceof Error ? error.stack : undefined,
            error,
          })
          return Response.json(
            {
              error: 'Internal server error',
              details: error instanceof Error ? error.message : 'Erro desconhecido',
            },
            { status: 500 },
          )
        }
      },
    },
    {
      path: '/mark-read',
      method: 'post',
      handler: async (req: PayloadRequest) => {
        try {
          const payloadInstance = req.payload

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
                const existing = await payloadInstance.find({
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
                  await payloadInstance.create({
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
