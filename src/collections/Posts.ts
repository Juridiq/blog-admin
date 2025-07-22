import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'date', 'slug'],
  },
  access: {
    read: () => true,
  },
  fields: [
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
      name: 'authorImage',
      type: 'relationship',
      relationTo: 'media',
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
  ],
}
