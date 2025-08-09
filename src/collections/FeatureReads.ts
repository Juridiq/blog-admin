import type { CollectionConfig } from 'payload'

export const FeatureReads: CollectionConfig = {
  slug: 'featureReads',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['feature', 'externalUserId', 'readAt'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'feature',
      type: 'relationship',
      relationTo: 'features',
      required: true,
      index: true,
    },
    {
      name: 'externalUserId',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'readAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date(),
    },
  ],
}
