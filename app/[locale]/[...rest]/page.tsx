import { notFound } from "next/navigation";

/** Any path other than the one page renders the localized 404. */
export default function CatchAll() {
  notFound();
}
