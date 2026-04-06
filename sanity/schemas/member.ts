import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'member',
  title: 'Member',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name' },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'businessName',
      title: 'Business Name',
      type: 'string',
    }),
    defineField({
      name: 'sector',
      title: 'Sector',
      type: 'reference',
      to: [{ type: 'sector' }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'city',
      title: 'City',
      type: 'string',
      options: {
        list: [
          'Fresno',
          'Clovis',
          'Visalia',
          'Bakersfield',
          'Modesto',
          'Madera',
          'Hanford',
          'Other',
        ],
      },
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.max(150),
    }),
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'website',
      title: 'Website',
      type: 'url',
    }),
    defineField({
      name: 'linkedin',
      title: 'LinkedIn',
      type: 'url',
    }),
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
    }),
    defineField({
      name: 'isMentor',
      title: 'Is Mentor',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'mentorExpertise',
      title: 'Mentor Expertise',
      type: 'array',
      of: [{ type: 'string' }],
      hidden: ({ parent }) => !parent?.isMentor,
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'memberSince',
      title: 'Member Since',
      type: 'number',
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
    }),
  ],
})
