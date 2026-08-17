import { AtlasShell } from "@/components/layout/atlas-shell";
import { requireOwnerSession } from "@/lib/auth/guards";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireOwnerSession();

  return <AtlasShell>{children}</AtlasShell>;
}
