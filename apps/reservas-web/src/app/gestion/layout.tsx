export default function GestionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50" style={{ color: "#171717", background: "#ffffff" }}>
      {children}
    </div>
  );
}
