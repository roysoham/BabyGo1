export default function SafetyList({ items }:{ items:{city:string; type:string; name:string; speaksEnglish:boolean; phone:string;}[] }){
  return (
    <div className="space-y-2">
      {items.map((s,i)=>(
        <div key={i} className="rounded-xl border p-3">
          <div className="font-medium">{s.type}: {s.name}</div>
          <div className="text-xs text-gray-600">English: {String(s.speaksEnglish)} · Phone: {s.phone}</div>
        </div>
      ))}
    </div>
  );
}
