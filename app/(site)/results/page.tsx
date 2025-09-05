// app/(site)/results/page.tsx
import ResultsView from "@/components/ResultsView";

export default async function ResultsPage({ searchParams }: { searchParams: any }) {
  const flat = Object.fromEntries(Object.entries(searchParams || {}).map(([k,v])=>[k, Array.isArray(v)?v[0]:v]));
  return <ResultsView searchParams={flat} />;
}