'use client';

import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import { ScbColumn, ScbDataEntry, GeoJsonData, GeoJsonFeature } from '@/types';

// Fix för Leaflet ikoner i Next.js
// @ts-expect-error Leaflet icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapProps {
  year: string;
  data: ScbDataEntry[];
  columns: ScbColumn[];
  dataType: "BE0101J" | "HE0110" | "UF0506";
  selectedMunicipalities: string[];
  onMunicipalitySelect: (code: string) => void;
  geoJsonData: GeoJsonData | null;
}

const getColor = (d: number | null, dataType: string) => {
  if (d === null) return '#ececec';

  if (dataType === 'BE0101J') {
    return d > 500  ? '#006d2c' :
           d > 100  ? '#31a354' :
           d > 0    ? '#74c476' :
           d > -100 ? '#fcae91' :
           d > -500 ? '#fb6a4a' :
                      '#cb181d';
  } else if (dataType === 'HE0110') {
    return d > 350000 ? '#005a32' :
           d > 300000 ? '#238b45' :
           d > 250000 ? '#41ab5d' :
           d > 200000 ? '#74c476' :
                      '#a1d99b';
  } else {
    return d > 20000 ? '#54278f' :
           d > 10000 ? '#756bb1' :
           d > 5000  ? '#9e9ac8' :
           d > 2000  ? '#bcbddc' :
                      '#dadaeb';
  }
};

const Legend = ({ dataType }: { dataType: string }) => {
  const getGrades = () => {
    if (dataType === 'BE0101J') return [500, 100, 0, -100, -500];
    if (dataType === 'HE0110') return [350000, 300000, 250000, 200000];
    return [20000, 10000, 5000, 2000];
  };

  const grades = getGrades();

  return (
    <div className="leaflet-bottom leaflet-right">
      <div className="leaflet-control leaflet-bar p-3 bg-white/90 shadow-md rounded text-sm">
        <h4 className="font-bold mb-2">
          {dataType === 'BE0101J' ? 'Nettoflyttning' : 
           dataType === 'HE0110' ? 'Inkomst (kr)' : 
           'Högutbildade (antal)'}
        </h4>
        <div className="flex flex-col gap-1">
          {grades.map((grade, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-4 h-4 inline-block rounded-sm" style={{ background: getColor(grade + 1, dataType) }}></span>
              <span>{grade}+</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 inline-block rounded-sm" style={{ background: getColor(grades[grades.length - 1] - 1, dataType) }}></span>
            <span>&lt; {grades[grades.length - 1]}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const MapComponent = ({ year, data, columns, dataType, selectedMunicipalities, onMunicipalitySelect, geoJsonData }: MapProps) => {
  
  // Hitta värde för en kommun och år
  const getValue = (municipalityCode: string) => {
    if (!data || !columns || columns.length === 0) return null;
    
    const regionIdx = columns.findIndex((c) => c.code === "Region");
    const timeIdx = columns.findIndex((c) => c.code === "Tid");
    
    if (regionIdx === -1 || timeIdx === -1) return null;

    const entry = data.find((d) => 
      d.key[regionIdx] === municipalityCode && 
      d.key[timeIdx] === year
    );

    return entry ? parseFloat(entry.values[0]) : null;
  };

  const style = (feature: unknown) => {
    if (!feature) return {};
    const f = feature as GeoJsonFeature;
    const code = f.properties.id || f.properties.ref || f.properties.kod;
    const value = getValue(code || "");
    const isSelected = selectedMunicipalities.includes(code || "");
    
    return {
      fillColor: getColor(value, dataType),
      weight: isSelected ? 3 : 1,
      opacity: 1,
      color: isSelected ? '#333' : 'white',
      dashArray: isSelected ? '' : '3',
      fillOpacity: 0.7
    };
  };

  const onEachFeature = (feature: unknown, layer: L.Layer) => {
    const f = feature as GeoJsonFeature;
    const code = f.properties.id || f.properties.ref || f.properties.kod;
    const name = f.properties.kom_namn || f.properties.name || f.properties.namn;
    
    layer.bindTooltip(`${name} (${code})`, {
      permanent: false,
      direction: "top"
    });

    layer.on({
      click: () => {
        if (code) onMunicipalitySelect(code);
      },
    });
  };

  return (
    <MapContainer 
      center={[62.0, 15.0]} 
      zoom={5} 
      minZoom={4}
      maxBounds={[[55.0, 10.0], [70.0, 25.0]]}
      maxBoundsViscosity={1.0}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {geoJsonData && (
        <GeoJSON 
          data={geoJsonData} 
          style={style} 
          onEachFeature={onEachFeature} 
        />
      )}
      <Legend dataType={dataType} />
    </MapContainer>
  );
};

export default MapComponent;
