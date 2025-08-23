export function formatNameWithLastInitial(firstName: string, lastName?: string | null): string {
  if (!lastName || lastName.length === 0) {
    return firstName;
  }
  return `${firstName} ${lastName.charAt(0).toUpperCase()}.`;
}