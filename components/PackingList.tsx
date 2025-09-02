export default function PackingList({ age, templates }:{ age:string; templates: Record<string,string[]> }){
  const list = templates[age] || [];
  return (
    <ul className="list-disc pl-6 text-sm">
      {list.map((x,i)=>(<li key={i}>{x}</li>))}
    </ul>
  );
}
