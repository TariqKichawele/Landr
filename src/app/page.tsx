import { SignInButton, UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  return (
    <div>
      <SignInButton />
      <UserButton />
      <ThemeToggle />
    </div>
  );
}
