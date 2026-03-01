export const getDisplayName = (user: {
  email: string;
  username?: string | null;
}): string => user.username || user.email;
