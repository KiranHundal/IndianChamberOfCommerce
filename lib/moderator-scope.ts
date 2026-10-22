import { db } from './db'
import { boardMembers } from './schema'
import { eq } from 'drizzle-orm'

/**
 * Resolve the current user's own board_members.id by session email, or
 * null if they're not on the board. Used wherever a moderator action is
 * scoped to members they personally referred.
 *
 * The reverse-lookup is cheap (board_members has <20 rows) but it would
 * be worth caching in the JWT if the board ever grows.
 */
export async function getSessionBoardId(sessionEmail: string | null | undefined): Promise<string | null> {
  if (!sessionEmail) return null
  const [board] = await db
    .select({ id: boardMembers.id })
    .from(boardMembers)
    .where(eq(boardMembers.email, sessionEmail.toLowerCase().trim()))
    .limit(1)
  return board?.id || null
}

/**
 * Authorize a moderator action on a specific target row:
 *   - admin → always allowed (returns null)
 *   - moderator → allowed only when target.referredBy matches their own
 *     board_members.id (returns null); otherwise an error message
 *   - any other role → not authorized
 *
 * Call this with the session role, the session email, and the target's
 * referredBy. The returned string is suitable for a 403 response body.
 */
export async function assertModeratorOwnsTarget(
  role: string | undefined,
  sessionEmail: string | null | undefined,
  targetReferredBy: string | null | undefined,
): Promise<string | null> {
  if (role === 'admin') return null
  if (role !== 'moderator') return 'Not authorized for this action.'
  const myBoardId = await getSessionBoardId(sessionEmail)
  if (!myBoardId) return 'Moderator board attribution not found. Contact admin.'
  if (targetReferredBy !== myBoardId) {
    return 'Moderators can only act on members they personally referred.'
  }
  return null
}
