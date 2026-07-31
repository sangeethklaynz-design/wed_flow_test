export default function Countdown({ days, hours, minutes, seconds }) {
  const units = [
    { value: days, label: "Days" },
    { value: hours, label: "Hours" },
    { value: minutes, label: "Minutes" },
    { value: seconds, label: "Seconds" },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 card-shadow border border-border">
      <h2 className="font-serif font-bold text-xl text-navy mb-6">The Big Day</h2>
      
      <div className="flex justify-between md:justify-center md:space-x-4 lg:justify-start lg:space-x-8">
        {units.map((unit, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <div className="bg-white w-14 h-14 sm:w-16 sm:h-16 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-xl md:rounded-2xl flex items-center justify-center card-shadow border border-border mb-3">
              <span className="font-serif font-bold text-2xl sm:text-3xl md:text-3xl lg:text-4xl text-navy">{unit.value}</span>
            </div>
            <span className="text-muted text-xs md:text-sm">{unit.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
