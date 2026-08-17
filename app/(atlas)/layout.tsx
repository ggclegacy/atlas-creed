import { AtlasShell } from "@/components/layout/atlas-shell";

export default function AtlasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AtlasShell>{children}</AtlasShell>;
}
