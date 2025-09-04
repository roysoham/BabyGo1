// SN: BABYGO-RESULTS-PAGE-20250903
import ResultsView from "@/components/ResultsView";

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  // Keep this file tiny; all logic sits in ResultsView.
  // (Server component)
  return <ResultsView searchParams={searchParams} />;
}