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
  paymentMethod: text('payment_method'),
  amountPaid: integer('amount_paid'),
  paymentReference: text('payment_reference'),
  paymentDate: integer('payment_date', { mode: 'timestamp' }),
})

export const leaderVideos = sqliteTable('leader_videos', {
  leaderName: text('leader_name').primaryKey(),
  url: text('url').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),
  category: text('category').notNull(),
  vendor: text('vendor').notNull(),
  description: text('description'),
  amount: integer('amount').notNull(),
  paymentMethod: text('payment_method'),
  paymentReference: text('payment_reference'),
  expenseDate: integer('expense_date', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  createdBy: text('created_by'),
})

export const invitations = sqliteTable('invitations', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  name: text('name'),
  businessName: text('business_name'),
  suggestedTier: text('suggested_tier'),
  personalNote: text('personal_note'),
  sentAt: integer('sent_at', { mode: 'timestamp' }).notNull(),
  sentBy: text('sent_by'),
  convertedAt: integer('converted_at', { mode: 'timestamp' }),
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
export type Expense = typeof expenses.$inferSelect
export type NewExpense = typeof expenses.$inferInsert
export type Invitation = typeof invitations.$inferSelect
export type NewInvitation = typeof invitations.$inferInsert
