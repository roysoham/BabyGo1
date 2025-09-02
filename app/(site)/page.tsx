import SearchForm from "@/components/SearchForm";
export default function HomePage() {
  return (
    <section className="space-y-4">
      <SearchForm />
      <p className="text-sm text-gray-600">Plan trips with BabyGo.</p>
    </section>
  );
}
