'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import TimeSlider from '@/components/TimeSlider';
import DetailsChart from '@/components/DetailsChart';
import { ScbColumn, ScbDataEntry, MunicipalityNameMap, GeoJsonData, GeoJsonFeature } from '@/types';

// Dynamisk import av MapComponent med SSR avstängt
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => <div className="h-96 w-full bg-gray-100 flex items-center justify-center">Laddar 2D-karta...</div>
});

export default function Home() {
  const [selectedYear, setSelectedYear] = useState<string>("2020");
  const [selectedMunicipalities, setSelectedMunicipalities] = useState<string[]>([]);
  const [dataType, setDataType] = useState<"BE0101J" | "HE0110" | "UF0506">("BE0101J");
  const [data, setData] = useState<ScbDataEntry[]>([]);
  const [columns, setColumns] = useState<ScbColumn[]>([]);
  const [loading, setLoading] = useState(false);
  const [geoJsonData, setGeoJsonData] = useState<GeoJsonData | null>(null);
  const [municipalityNames, setMunicipalityNames] = useState<MunicipalityNameMap>({});

  // Generera alla år från 1997 till 2024
  const years = Array.from({ length: 2024 - 1997 + 1 }, (_, i) => (1997 + i).toString()); 

  useEffect(() => {
    fetchData(dataType);
  }, [dataType]);

  useEffect(() => {
    // Ladda GeoJSON en gång
    fetch('/data/sweden-municipalities.geojson')
      .then(res => res.json())
      .then((data: GeoJsonData) => {
        // Validate and filter features to only include real municipalities
        // Must have a 4-digit code and a name
        const validFeatures = data.features.filter((f: GeoJsonFeature) => {
          const code = f.properties.id || f.properties.ref || f.properties.kod;
          const name = f.properties.kom_namn || f.properties.name || f.properties.namn;
          
          // Check for valid 4-digit code and existence of name
          return code && /^\d{4}$/.test(code) && name;
        });

        console.log(`Loaded ${validFeatures.length} valid municipalities out of ${data.features.length} features.`);

        const filteredData = { ...data, features: validFeatures };
        setGeoJsonData(filteredData);
        
        const names: Record<string, string> = {};
        validFeatures.forEach((f: GeoJsonFeature) => {
          const code = f.properties.id || f.properties.ref || f.properties.kod;
          const name = f.properties.kom_namn || f.properties.name || f.properties.namn;
          if (code && name) {
            names[code] = name;
          }
        });
        setMunicipalityNames(names);
      })
      .catch(err => console.error("Failed to load GeoJSON", err));
  }, []);

  const fetchData = async (table: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/scb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table })
      });
      const json = await res.json();
      if (json.data) {
        setData(json.data);
        setColumns(json.columns || []);
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMunicipalitySelect = (code: string) => {
    setSelectedMunicipalities(prev => {
      if (prev.includes(code)) {
        return prev.filter(c => c !== code);
      } else {
        return [...prev, code];
      }
    });
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50 text-gray-900">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Header & Controls */}
        <div className="lg:col-span-3">
          <h1 className="text-4xl font-bold mb-4 text-blue-900">Sveriges Förvandling</h1>
          <p className="mb-6 text-lg text-gray-700">Visualisering av demografi och ekonomi 1997-2024.</p>
          
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4">
              <button 
                className={`px-4 py-2 rounded ${dataType === 'BE0101J' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-600'}`}
                onClick={() => setDataType('BE0101J')}
              >
                Nettoflyttning
              </button>
              <button 
                className={`px-4 py-2 rounded ${dataType === 'HE0110' ? 'bg-green-600 text-white' : 'bg-white text-green-600 border border-green-600'}`}
                onClick={() => setDataType('HE0110')}
              >
                Hushållsinkomst
              </button>
              <button 
                className={`px-4 py-2 rounded ${dataType === 'UF0506' ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 border border-purple-600'}`}
                onClick={() => setDataType('UF0506')}
              >
                Högutbildade (Antal)
              </button>
            </div>
            
          </div>

          <TimeSlider 
            year={selectedYear} 
            years={years} 
            onChange={setSelectedYear} 
          />
        </div>

        {/* Karta */}
        <div className={`lg:col-span-2 h-[600px] rounded-xl shadow-lg overflow-hidden border border-gray-200 bg-white`}>
          <MapComponent 
            year={selectedYear} 
            data={data} 
            columns={columns} 
            dataType={dataType}
            selectedMunicipalities={selectedMunicipalities}
            onMunicipalitySelect={handleMunicipalitySelect}
            geoJsonData={geoJsonData}
          />
        </div>

        {/* Detaljer */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 h-full">
            <h2 className="text-2xl font-semibold mb-4">Detaljer</h2>
            {selectedMunicipalities.length > 0 ? (
              <>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold mb-1">Valda kommuner:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedMunicipalities.map(code => (
                        <span key={code} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          {municipalityNames[code] || code}
                          <button 
                            onClick={() => handleMunicipalitySelect(code)}
                            className="hover:text-blue-600 font-bold ml-1"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedMunicipalities([])}
                    className="text-xs text-red-600 hover:text-red-800 underline shrink-0 ml-2"
                  >
                    Rensa alla
                  </button>
                </div>
                
                <DetailsChart 
                  selectedMunicipalities={selectedMunicipalities}
                  data={data} 
                  columns={columns}
                  dataType={dataType}
                  municipalityNames={municipalityNames}
                />
              </>
            ) : (
              <p className="text-gray-500 italic">Klicka på en eller flera kommuner i kartan för att jämföra historik.</p>
            )}
            
            {loading && <p className="mt-4 text-blue-500">Laddar data...</p>}
          </div>
        </div>

      </div>
    </main>
  );
}
