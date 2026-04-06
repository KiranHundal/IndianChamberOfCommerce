import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'memberCount',
      title: 'Member Count',
      type: 'number',
      initialValue: 200,
    }),
    defineField({
      name: 'sectorCount',
      title: 'Sector Count',
      type: 'number',
      initialValue: 12,
    }),
    defineField({
      name: 'eventsPerYear',
      title: 'Events Per Year',
      type: 'number',
      initialValue: 40,
    }),
    defineField({
      name: 'yearsEstablished',
      title: 'Years Established',
      type: 'number',
    }),
    defineField({
      name: 'heroHeadline',
      title: 'Hero Headline',
      type: 'string',
    }),
    defineField({
      name: 'heroSubtext',
      title: 'Hero Subtext',
      type: 'text',
    }),
    defineField({
      name: 'address',
      title: 'Address',
      type: 'string',
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
      name: 'instagramHandle',
      title: 'Instagram Handle',
      type: 'string',
    }),
    defineField({
      name: 'linkedinUrl',
      title: 'LinkedIn URL',
      type: 'url',
    }),
    defineField({
      name: 'facebookUrl',
      title: 'Facebook URL',
      type: 'url',
    }),
    defineField({
      name: 'whatsappNumber',
      title: 'WhatsApp Number',
      type: 'string',
    }),
    defineField({
      name: 'tallyMembershipFormId',
      title: 'Tally Membership Form ID',
      type: 'string',
    }),
    defineField({
      name: 'tallyContactFormId',
      title: 'Tally Contact Form ID',
      type: 'string',
    }),
  ],
})
