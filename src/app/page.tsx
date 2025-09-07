import { SignInButton, UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PricingTable } from "@/services/clerk/components/PricingTable";

export default function Home() {
  return (
    <div>
      <SignInButton />
      <UserButton />
      <ThemeToggle />
      <PricingTable />
    </div>
  );
}
