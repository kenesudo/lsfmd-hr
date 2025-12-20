export const USERNAME_REGEX = /^[a-z0-9._]+$/;

export const normalizeUsername = (username: string) => username.trim().toLowerCase();

export const isValidUsername = (username: string) => USERNAME_REGEX.test(normalizeUsername(username));

export const usernameToEmail = (username: string) => {
  const normalized = normalizeUsername(username);
  return `${normalized}@lsfmd.local`;
};
