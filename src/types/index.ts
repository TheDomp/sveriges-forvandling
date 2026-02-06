export interface ScbColumn {
  code: string;
  text: string;
  type?: string;
}

export interface ScbDataEntry {
  key: string[];
  values: string[];
}

export interface ScbResponse {
  columns: ScbColumn[];
  data: ScbDataEntry[];
}

export interface MunicipalityNameMap {
  [code: string]: string;
}

export interface GeoJsonProperties {
  id?: string;
  ref?: string;
  kod?: string;
  kom_namn?: string;
  name?: string;
  namn?: string;
  [key: string]: unknown;
}

export interface GeoJsonGeometry {
  type: string;
  coordinates: unknown;
}

export interface GeoJsonFeature {
  type: "Feature";
  properties: GeoJsonProperties;
  geometry: GeoJsonGeometry;
}

export interface GeoJsonData {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}
