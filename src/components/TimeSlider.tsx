'use client';

interface TimeSliderProps {
  year: string;
  years: string[];
  onChange: (year: string) => void;
}

const TimeSlider = ({ year, years, onChange }: TimeSliderProps) => {
  const currentIndex = years.indexOf(year);

  return (
    <div className="w-full p-4 bg-white rounded-lg shadow-md">
      <div className="flex justify-between mb-2">
        <span className="font-bold text-lg">År: {year}</span>
      </div>
      <input
        type="range"
        min="0"
        max={years.length - 1}
        value={currentIndex !== -1 ? currentIndex : 0}
        onChange={(e) => onChange(years[parseInt(e.target.value)])}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{years[0]}</span>
        <span>{years[years.length - 1]}</span>
      </div>
    </div>
  );
};

export default TimeSlider;
