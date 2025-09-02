export default function ProductsList({ items }:{ items:{name:string; store:string;}[] }){
  return (
    <ul className="list-disc pl-6 text-sm">
      {items.map((p,i)=>(<li key={i}>{p.name} — {p.store}</li>))}
    </ul>
  );
}
