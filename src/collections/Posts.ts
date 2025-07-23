import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'date', 'slug'],
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterRead: [
      ({ doc }) => {
        if (doc?.content) {
          doc.contentHtml = convertLexicalToHTML({ data: doc.content })
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
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
      },
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
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'thumbnail',
      type: 'relationship',
      relationTo: 'media',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      editor: lexicalEditor({}),
    },
    {
      name: 'description',
      type: 'text',
      required: false,
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      required: false,
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
