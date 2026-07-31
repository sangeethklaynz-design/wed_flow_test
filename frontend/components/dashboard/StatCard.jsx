export default function StatCard({ title, value, dotColor }) {
  return (
    <div className="bg-white rounded-2xl p-6 card-shadow flex flex-col justify-between h-full border border-border">
      <div className={`w-2.5 h-2.5 rounded-full mb-3 ${dotColor}`} />
      <div className="font-serif text-3xl font-bold text-navy mb-1">{value}</div>
      <div className="text-sm text-muted">{title}</div>
    </div>
  );
}
