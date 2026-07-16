export async function register() {
  if (
    process.env.NEXT_RUNTIME !== "nodejs" ||
    process.env.NODE_ENV !== "development"
  ) {
    return;
  }

  const { seedDevAdmin } = await import("@/lib/dev-seed");
  await seedDevAdmin();
}
