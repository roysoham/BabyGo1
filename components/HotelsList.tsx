export default function HotelsList({ items }:{ items:{city:string; name:string; cribs:boolean; blackout:boolean; connecting:boolean; priceTier:string;}[] }){
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((h,i)=>(
        <div key={i} className="rounded-xl border p-3">
          <div className="font-medium">{h.name}</div>
          <div className="text-xs text-gray-600">Cribs: {String(h.cribs)} · Blackout: {String(h.blackout)} · Connecting: {String(h.connecting)}</div>
          <div className="text-xs">Price: {h.priceTier}</div>
        </div>
      ))}
    </div>
  );
}
