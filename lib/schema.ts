import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const members = sqliteTable('members', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  name: text('name').notNull(),
  phone: text('phone'),
  businessName: text('business_name'),
  city: text('city'),
  sector: text('sector'),
  membershipTier: text('membership_tier').notNull().default('individual'),
  status: text('status').notNull().default('pending'),
  role: text('role').notNull().default('member'),
  membershipNumber: text('membership_number').unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  approvedAt: integer('approved_at', { mode: 'timestamp' }),
  deactivatedAt: integer('deactivated_at', { mode: 'timestamp' }),
})

export const leaderVideos = sqliteTable('leader_videos', {
  leaderName: text('leader_name').primaryKey(),
  url: text('url').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const boardMembers = sqliteTable('board_members', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role').notNull().default('Board Member'),
  bio: text('bio'),
  photoUrl: text('photo_url'),
  email: text('email'),
  displayOrder: integer('display_order').notNull().default(100),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  welcomeEmailSentAt: integer('welcome_email_sent_at', { mode: 'timestamp' }),
})

export type Member = typeof members.$inferSelect
export type NewMember = typeof members.$inferInsert
export type LeaderVideo = typeof leaderVideos.$inferSelect
export type BoardMember = typeof boardMembers.$inferSelect
export type NewBoardMember = typeof boardMembers.$inferInsert
