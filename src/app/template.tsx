import { PageTransition } from "@/components/motion";

// A template re-mounts on every navigation (unlike a layout), so each page
// gets its own entrance animation.
export default function Template({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
