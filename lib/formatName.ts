/**
 * Formats a user's name to show first name + last initial
 * @param firstName - User's first name
 * @param lastName - User's last name (optional)
 * @returns Formatted name like "John D." or just "John" if no last name
 */
export function formatDisplayName(firstName: string, lastName?: string | null): string {
  if (!lastName) {
    return firstName
  }
  
  return `${firstName} ${lastName.charAt(0).toUpperCase()}.`
}

/**
 * Gets display name for a user, showing "You" for current user or formatted name for others
 * @param user - User object with firstName and lastName
 * @param currentUserId - ID of the current logged-in user
 * @returns "You" if it's the current user, otherwise formatted name
 */
export function getDisplayName(
  user: { id: string; firstName: string; lastName?: string | null },
  currentUserId?: string
): string {
  if (currentUserId && user.id === currentUserId) {
    return 'You'
  }
  
  return formatDisplayName(user.firstName, user.lastName)
}