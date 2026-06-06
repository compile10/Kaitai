export type SessionUser = {
  name: string;
  email: string;
  role?: string | null;
};

export function isAdminUser(
  user: Pick<SessionUser, "role"> | null | undefined,
) {
  return (
    user?.role?.split(",").some((role) => role.trim() === "admin") ?? false
  );
}
