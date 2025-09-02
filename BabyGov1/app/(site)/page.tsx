import SearchForm from "../../components/SearchForm";

export default function HomePage() {
  return (
    <section className="space-y-4 p-4">
      <SearchForm />
      <p className="text-sm text-gray-600">
        BabyGo: plan family trips with age-aware Baby Comfort Score.
      </p>
    </section>
  );
}
