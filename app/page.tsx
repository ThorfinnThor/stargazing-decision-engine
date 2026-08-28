import { HomePage } from "@/components/home-page";
import { LegalFooter } from "@/components/legal-footer";

export const dynamic = "force-static";

export default function Home() {
  return <><HomePage locale="en" /><LegalFooter locale="en" /></>;
}
