// app/(site)/results/page.tsx
import ResultsView from "@/components/ResultsView";

export const dynamic = "force-dynamic"; // keep it simple for dev

export default async function Page(props: { searchParams: Record<string, any> }) {
  return <ResultsView searchParams={props.searchParams} />;
}