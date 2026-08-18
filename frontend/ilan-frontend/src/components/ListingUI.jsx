export function FilterInput({ label, ...props }) {
  return (
    <label className="block mb-4">
      <span className="block text-xs font-medium text-[#8B95A3] mb-1.5">
        {label}
      </span>
      <input
        {...props}
        className="w-full bg-[#0F1720] border border-[#232E3D] rounded-lg px-3 py-2 text-sm text-[#EDEFF2] placeholder-[#4A5568] outline-none focus:border-[#E8A33D] transition-colors"
      />
    </label>
  );
}

export function FilterSelect({ label, children, ...props }) {
  return (
    <label className="block mb-4">
      <span className="block text-xs font-medium text-[#8B95A3] mb-1.5">
        {label}
      </span>
      <select
        {...props}
        className="w-full bg-[#0F1720] border border-[#232E3D] rounded-lg px-3 py-2 text-sm text-[#EDEFF2] outline-none focus:border-[#E8A33D] transition-colors"
      >
        {children}
      </select>
    </label>
  );
}

export function ListingCard({ title, location, price, extraLines = [] }) {
  return (
    <div className="bg-[#161F2B] border border-[#232E3D] rounded-xl p-4 hover:border-[#E8A33D]/50 transition-colors">
      <h3 className="text-[#EDEFF2] font-medium text-sm mb-1 line-clamp-1">
        {title || "Başlıksız ilan"}
      </h3>
      <p className="text-[#8B95A3] text-xs mb-3">{location}</p>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#6B7688] mb-3">
        {extraLines.map((line, i) => (
          <span key={i}>{line}</span>
        ))}
      </div>
      <p className="text-[#E8A33D] font-semibold text-base">
        {price ? `${Number(price).toLocaleString("tr-TR")} TL` : "Fiyat yok"}
      </p>
    </div>
  );
}