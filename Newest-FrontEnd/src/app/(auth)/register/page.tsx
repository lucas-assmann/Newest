import { RegisterCard } from "@/components/register-card";

export const metadata = {
  title: "Criar conta",
};

export default function SignUp() {
  return (
    <div className="w-full h-screen flex justify-center items-center">
      <RegisterCard />
    </div>
  );
}