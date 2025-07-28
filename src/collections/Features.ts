import type { CollectionConfig } from 'payload'

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
}
