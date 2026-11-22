import { AuthProvider } from "@/contexts/AuthContext";


export const metadata = {
  title: {
    default: "Meu App",
    template: "%s | Newest",
  },
  description: "Faça parte de nossa comunidade!",
  icons: {
    icon: "/icon.png",
  },
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen">
        <main className="flex-1">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
