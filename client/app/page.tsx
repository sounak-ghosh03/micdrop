import { redirect } from "next/navigation";

// Root "/" redirects to the Home feed
export default function RootPage() {
   redirect("/home");
}
