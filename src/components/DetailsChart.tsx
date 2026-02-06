'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { ScbColumn, ScbDataEntry, MunicipalityNameMap } from '@/types';

interface DetailsChartProps {
  selectedMunicipalities: string[];
  data: ScbDataEntry[];
  columns: ScbColumn[];
  dataType: string;
  municipalityNames: MunicipalityNameMap;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00C49F'];

const DetailsChart = ({ selectedMunicipalities, data, columns, dataType, municipalityNames }: DetailsChartProps) => {
  if (!selectedMunicipalities || selectedMunicipalities.length === 0) {
    return <div className="text-gray-500 text-center mt-10">Välj en eller flera kommuner för att se detaljer</div>;
  }

  const regionIndex = columns?.findIndex((c) => c.code === "Region");
  const timeIndex = columns?.findIndex((c) => c.code === "Tid");

  if (regionIndex === undefined || timeIndex === undefined || regionIndex === -1 || timeIndex === -1) {
     return <div>Laddar data...</div>;
  }

  // Samla alla unika år
  const years = Array.from(new Set(data.map(d => d.key[timeIndex]))).sort((a, b) => parseInt(a) - parseInt(b));

  // Skapa chart data struktur
  const chartData = years.map(year => {
    const entry: { [key: string]: number | string } = { year };
    selectedMunicipalities.forEach(code => {
      const dataPoint = data.find(d => d.key[regionIndex] === code && d.key[timeIndex] === year);
      if (dataPoint) {
        entry[code] = parseFloat(dataPoint.values[0]);
      }
    });
    return entry;
  });

  const getMeta = () => {
    switch(dataType) {
      case 'BE0101J': 
        return {
          title: 'Nettoflyttning',
          unit: 'personer',
          description: 'Visar skillnaden mellan inflyttade och utflyttade. Ett positivt värde betyder att fler flyttat in än ut, medan ett negativt värde betyder att fler flyttat ut.'
        };
      case 'HE0110': 
        return {
          title: 'Disponibel inkomst',
          unit: 'kr',
          description: 'Medianvärdet av disponibel inkomst per konsumtionsenhet för hushåll. Visar den ekonomiska standarden.'
        };
      case 'UF0506': 
        return {
          title: 'Högutbildade',
          unit: 'personer',
          description: 'Antal personer med eftergymnasial utbildning (3 år eller längre). Visar utbildningsnivån i kommunen.'
        };
      default: 
        return { title: 'Värde', unit: '', description: '' };
    }
  };

  const meta = getMeta();

  return (
    <div className="w-full bg-white p-6 rounded-lg shadow-md mt-4">
      <h3 className="text-xl font-bold mb-2">{meta.title}</h3>
      <p className="text-sm text-gray-600 mb-6">{meta.description}</p>
      
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis 
              dataKey="year" 
              tick={{fontSize: 12}}
              tickMargin={10}
            />
            <YAxis 
              tick={{fontSize: 12}}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: 'none',
                padding: '12px'
              }}
              itemStyle={{ fontSize: '13px', padding: '2px 0' }}
              labelStyle={{ fontWeight: 'bold', marginBottom: '8px', color: '#111' }}
              formatter={(value: number | string | undefined, name: string | undefined) => [`${value ? Number(value).toLocaleString() : ''} ${meta.unit}`, name]}
            />
            <Legend 
              verticalAlign="top" 
              height={36}
              iconType="circle"
            />
            {selectedMunicipalities.map((code, index) => (
              <Line 
                key={code}
                type="monotone" 
                dataKey={code} 
                name={municipalityNames[code] || code} 
                stroke={COLORS[index % COLORS.length]} 
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DetailsChart;
