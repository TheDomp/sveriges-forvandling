import { NextResponse } from 'next/server';
import { BE0101J_QUERY, HE0110_QUERY, UF0506_QUERY, SCB_API_BASE } from '@/lib/scb-queries';
import { promises as fs } from 'fs';
import path from 'path';

const CACHE_FILE = path.join(process.cwd(), 'src', 'data', 'cache.json');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { table } = body;

    // 1. Check Cache
    try {
      const cacheData = await fs.readFile(CACHE_FILE, 'utf-8');
      const cache = JSON.parse(cacheData);
      if (cache[table] && cache[table].timestamp > Date.now() - 1000 * 60 * 60 * 24) { // 24h cache
        console.log(`Serving ${table} from cache`);
        return NextResponse.json(cache[table].data);
      }
    } catch (_) {
      // Cache miss or error, proceed to fetch
    }

    let query;
    let url;

    if (table === 'BE0101J') {
      query = BE0101J_QUERY;
      url = `${SCB_API_BASE}/BE/BE0101/BE0101J/Flyttningar97`;
    } else if (table === 'HE0110') {
      query = HE0110_QUERY;
      url = `${SCB_API_BASE}/HE/HE0110/HE0110G/TabVX4bDispInkN`;
    } else if (table === 'UF0506') {
      query = UF0506_QUERY;
      url = `${SCB_API_BASE}/UF/UF0506/UF0506B/Utbildning`;
    } else {
      return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
    }

    // Vi agerar proxy
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`SCB API failed for ${table} with status ${response.status} ${response.statusText}: ${errorText}`);
      // Om SCB failar, kasta fel istället för mock-data
      return NextResponse.json({ error: `SCB API Error: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    const processedData = processData(data, table);

    // 2. Update Cache
    try {
      let cache: Record<string, { timestamp: number; data: ScbResponse }> = {};
      try {
        const cacheData = await fs.readFile(CACHE_FILE, 'utf-8');
        cache = JSON.parse(cacheData);
      } catch (_) {} // File might not exist yet

      cache[table] = {
        timestamp: Date.now(),
        data: processedData
      };
      
      await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
    } catch (e) {
      console.warn('Failed to write to cache file', e);
    }

    return NextResponse.json(processedData);

  } catch (error) {
    console.error('Error in SCB proxy:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

interface ScbColumn {
  code: string;
  text: string;
  type?: string;
}

interface ScbDataEntry {
  key: string[];
  values: string[];
}

interface ScbResponse {
  columns: ScbColumn[];
  data: ScbDataEntry[];
}

function processData(scbData: ScbResponse, table: string) {
  // Helper to find index of a column
  const getColIndex = (code: string) => scbData.columns.findIndex((c) => c.code === code);
  
  const regionIdx = getColIndex("Region");
  const timeIdx = getColIndex("Tid");
  const valueIdx = 0; // SCB values are usually in 'values' array item 0

  if (regionIdx === -1 || timeIdx === -1) return scbData; // Fallback

  // Map to store aggregated values: "Region-Year" -> Sum
  const aggMap = new Map<string, number>();

  scbData.data.forEach((entry) => {
    const region = entry.key[regionIdx];
    const year = entry.key[timeIdx];
    const val = parseFloat(entry.values[valueIdx]);

    if (isNaN(val)) return;

    // Filter: Only allow 4-digit region codes (municipalities)
    // Excludes "00" (Riket), "01" (Län), etc.
    if (!/^\d{4}$/.test(region)) return;

    // Specific logic per table
    if (table === 'BE0101J') {
       // BE0101J: We want Net Migration (BE0101AZ). 
       // Check ContentsCode if present
       const contentIdx = getColIndex("ContentsCode");
       if (contentIdx !== -1) {
         const content = entry.key[contentIdx];
         if (content !== "BE0101AZ") return; // Skip In/Out, only keep Net
       }
       // Sum over Sex (Kon) and Age (Alder) automatically by just accumulating for Region-Year
    } else if (table === 'UF0506') {
      // UF0506: Highly Educated (Level 5, 6, 7)
      const eduIdx = getColIndex("UtbildningsNiva");
      if (eduIdx !== -1) {
        const eduLevel = entry.key[eduIdx];
        if (!["5", "6", "7"].includes(eduLevel)) return; // Skip lower education
      }
    }
    
    // HE0110: No filtering needed (already specific in query)
    // But we need to convert "tkr" (thousands) to "kr"
    let finalVal = val;
    if (table === 'HE0110') {
      finalVal = val * 1000;
    }

    const key = `${region}-${year}`;
    const current = aggMap.get(key) || 0;
    aggMap.set(key, current + finalVal);
  });

  // Transform back to SCB-like structure
  const newData = Array.from(aggMap.entries()).map(([key, value]) => {
    const [region, year] = key.split('-');
    return {
      key: [region, year],
      values: [value.toString()]
    };
  });

  return {
    columns: [
      { code: "Region", text: "region" },
      { code: "Tid", text: "år" },
      { code: "Mätvariabel", text: "värde" }
    ],
    data: newData
  };
}

