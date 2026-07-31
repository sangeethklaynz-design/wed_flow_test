export default function RsvpBreakdown({ stats }) {
  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 card-shadow border border-border">
      <h2 className="font-serif font-bold text-xl text-navy mb-6">Guests RSVP</h2>
      
      <div className="space-y-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className={`w-2.5 h-2.5 rounded-full ${stat.color}`} />
              <span className="text-muted text-sm">{stat.label}</span>
            </div>
            <span className="font-serif font-bold text-lg text-navy">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
