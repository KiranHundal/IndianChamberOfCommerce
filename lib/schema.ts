import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const members = sqliteTable('members', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  businessName: text('business_name'),
  city: text('city'),
  sector: text('sector'),
  membershipTier: text('membership_tier').notNull().default('individual'),
  status: text('status').notNull().default('pending'),
  role: text('role').notNull().default('member'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  approvedAt: integer('approved_at', { mode: 'timestamp' }),
  deactivatedAt: integer('deactivated_at', { mode: 'timestamp' }),
})

export type Member = typeof members.$inferSelect
export type NewMember = typeof members.$inferInsert
