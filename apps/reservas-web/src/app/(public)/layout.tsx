import { I18nProvider } from "@/lib/i18n/context";
import { PublicLayoutInner } from "./layout-inner";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <I18nProvider>
      <PublicLayoutInner>{children}</PublicLayoutInner>
    </I18nProvider>
  );
}
