"use client";
import { useState } from "react";

type Tab = { id: string; label: string };
export default function Tabs({ tabs, children }: { tabs: Tab[]; children: React.ReactNode[] }){
  const [active, setActive] = useState(0);
  return (
    <div>
      <div className="flex gap-2 border-b">
        {tabs.map((t,i)=>(
          <button key={t.id}
            className={`px-3 py-2 text-sm rounded-t ${i===active?"bg-white border-x border-t":"text-gray-600"}`}
            onClick={()=>setActive(i)}>{t.label}</button>
        ))}
      </div>
      <div className="rounded-b border border-t-0 bg-white p-4">{children[active]}</div>
    </div>
  );
}
