import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, CircleMarker, Polyline, useMapEvents, Tooltip, Popup, Marker, LayersControl } from 'react-leaflet';
import { SectorGeografico, LatLng, AreaType } from '../types';
import { wktToPoints, getPolygonCentroid } from '../utils/geoUtils';
import { MousePointerClick, Layers, CheckSquare, Square, Eraser, MapPin, Filter } from 'lucide-react';
import L from 'leaflet';

// Fix for default Leaflet marker icons in React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapCanvasProps {
  points: LatLng[];
  setPoints: (points: LatLng[]) => void;
  isDrawing: boolean;
  existingPolygons?: SectorGeografico[]; // Updated Type
  onPolygonClick?: (poly: SectorGeografico) => void;
  isAdmin?: boolean;
  suggestedCenter?: LatLng | null;
}

const ClickHandler: React.FC<{ onClick: (e: L.LeafletMouseEvent) => void }> = ({ onClick }) => {
  useMapEvents({
    click: onClick,
  });
  return null;
};

const MapUpdater: React.FC<{ center: LatLng | null }> = ({ center }) => {
  const map = useMapEvents({});
  useEffect(() => {
    if (center) {
      map.flyTo([center.lat, center.lng], 16, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
};

const MapCanvas: React.FC<MapCanvasProps> = ({ 
    points, 
    setPoints, 
    isDrawing, 
    existingPolygons = [], 
    onPolygonClick,
    isAdmin = false,
    suggestedCenter
}) => {
  const [center, setCenter] = useState<[number, number]>([10.4806, -66.9036]);
  
  // Layer Visibility State
  const [showPolygons, setShowPolygons] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showDrawing, setShowDrawing] = useState(true);
  
  const [isLayersMenuOpen, setIsLayersMenuOpen] = useState(false);

  useEffect(() => {
    if (suggestedCenter) {
      setCenter([suggestedCenter.lat, suggestedCenter.lng]);
      return;
    }
    if (existingPolygons.length > 0) {
        const firstPoly = wktToPoints(existingPolygons[0].geometria_poligono);
        if (firstPoly.length > 0) {
            setCenter([firstPoly[0].lat, firstPoly[0].lng]);
            return;
        }
    }
    if (navigator.geolocation && !suggestedCenter && existingPolygons.length === 0) {
      navigator.geolocation.getCurrentPosition((position) => {
        setCenter([position.coords.latitude, position.coords.longitude]);
      });
    }
  }, [existingPolygons, suggestedCenter]);

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (!isDrawing) return;
    setPoints([...points, { lat: e.latlng.lat, lng: e.latlng.lng }]);
  };

  const removeLastPoint = () => {
    setPoints(points.slice(0, -1));
  };

  const polylinePositions = points.map(p => [p.lat, p.lng] as [number, number]);
  
  // Colores fijos para esta versión
  const COLOR_VINOTINTO = '#881337'; 
  const COLOR_AMARILLO = '#eab308';
  const COLOR_AZUL = '#2563eb'; 

  return (
    <div className="relative h-full w-full rounded-lg overflow-hidden border border-slate-300 shadow-inner">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        
        <LayersControl position="bottomleft">
          <LayersControl.BaseLayer checked name="Mapa Callejero">
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Vista Satelital">
            <TileLayer
              attribution='Tiles &copy; Esri'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        
        <ClickHandler onClick={handleMapClick} />
        <MapUpdater center={suggestedCenter} />

        {/* 1. Render Existing Data (From Supabase) */}
        {existingPolygons.map((poly) => {
          const polyPoints = wktToPoints(poly.geometria_poligono);
          if (polyPoints.length === 0) return null;
          const centroid = getPolygonCentroid(polyPoints);
          const color = COLOR_VINOTINTO; 

          return (
            <React.Fragment key={poly.id_sector}>
                {showPolygons && (
                    <Polygon 
                    positions={polyPoints.map(p => [p.lat, p.lng] as [number, number])}
                    pathOptions={{ 
                        color: color, 
                        fillColor: color, 
                        fillOpacity: isAdmin ? 0.4 : 0.3, 
                        weight: isAdmin ? 3 : 2
                    }}
                    eventHandlers={{
                        click: () => {
                            if (isAdmin && onPolygonClick && !isDrawing) {
                                onPolygonClick(poly);
                            }
                        }
                    }}
                    >
                        <Tooltip sticky direction="top" opacity={0.9}>
                            <span className="font-bold text-slate-900">{poly.nombre_sector}</span>
                        </Tooltip>
                    </Polygon>
                )}

                {showMarkers && centroid && !isDrawing && (
                    <Marker position={[centroid.lat, centroid.lng]}>
                        <Popup>
                            <div className="text-sm min-w-[150px] p-1">
                                <div className="flex items-center gap-2 mb-2 border-b border-rose-100 pb-2">
                                    <MapPin size={16} className="text-rose-800" />
                                    <strong className="block text-rose-900 text-base">{poly.nombre_sector}</strong>
                                </div>
                                <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full mb-2 font-medium border border-blue-100">
                                    Límite Comunal
                                </span>
                                <div className="space-y-1">
                                    <div className="text-xs text-slate-500 font-mono bg-slate-50 p-1.5 rounded border border-slate-100 flex items-center justify-between">
                                        <span>Lat: {centroid.lat.toFixed(5)}</span>
                                        <span>Lng: {centroid.lng.toFixed(5)}</span>
                                    </div>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                )}
            </React.Fragment>
          );
        })}

        {/* 2. Render Current Drawing */}
        {showDrawing && (
            <>
                {points.length > 0 && points.length < 3 && (
                  <Polyline positions={polylinePositions} color={COLOR_AZUL} dashArray="5, 10" />
                )}
                {points.length >= 3 && (
                  <Polygon positions={polylinePositions} color={COLOR_AZUL} fillColor={COLOR_AZUL} fillOpacity={0.2} />
                )}
                {points.map((p, idx) => (
                  <CircleMarker 
                    key={`${p.lat}-${p.lng}-${idx}`} 
                    center={[p.lat, p.lng]} 
                    radius={5} 
                    pathOptions={{ color: 'white', fillColor: COLOR_AZUL, fillOpacity: 1, weight: 2 }} 
                  />
                ))}
            </>
        )}

        {suggestedCenter && isDrawing && points.length === 0 && (
           <Marker position={[suggestedCenter.lat, suggestedCenter.lng]} opacity={0.7}>
              <Popup>
                <div className="text-center">
                   <strong>Referencia</strong><br/>
                   Comience a dibujar aquí.
                </div>
              </Popup>
           </Marker>
        )}
      </MapContainer>

      {/* Floating Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end gap-2">
        <div className={`p-2 rounded-md shadow-lg border text-xs font-medium flex items-center gap-2 backdrop-blur-sm ${
            isDrawing ? 'bg-blue-50/90 border-blue-200 text-blue-800' : 'bg-white/90 border-slate-200 text-slate-600'
        }`}>
           {isDrawing ? (
             <>
               <MousePointerClick className="w-4 h-4" />
               {isAdmin ? 'Editando Geometría' : 'Modo Dibujo'}
             </>
           ) : (
             <>
               <Layers className="w-4 h-4 text-rose-800" />
               {existingPolygons.length} sectores
             </>
           )}
        </div>

        <div className="relative">
            <button 
                onClick={() => setIsLayersMenuOpen(!isLayersMenuOpen)}
                className="bg-white/90 p-2 rounded-md shadow-lg border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors backdrop-blur-sm"
            >
                <Layers className="w-5 h-5" />
            </button>
            
            {isLayersMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-slate-200 p-3 flex flex-col gap-2">
                    <button 
                        onClick={() => setShowPolygons(!showPolygons)}
                        className="flex items-center gap-2 p-2 hover:bg-slate-50 text-sm"
                    >
                        {showPolygons ? <CheckSquare className="text-rose-800" size={16}/> : <Square size={16}/>}
                        Polígonos
                    </button>
                    <button 
                        onClick={() => setShowMarkers(!showMarkers)}
                        className="flex items-center gap-2 p-2 hover:bg-slate-50 text-sm"
                    >
                        {showMarkers ? <CheckSquare className="text-rose-800" size={16}/> : <Square size={16}/>}
                        Marcadores
                    </button>
                    <button 
                        onClick={() => setShowDrawing(!showDrawing)}
                        className="flex items-center gap-2 p-2 hover:bg-slate-50 text-sm"
                    >
                        {showDrawing ? <CheckSquare className="text-blue-600" size={16}/> : <Square size={16}/>}
                        Dibujo Actual
                    </button>
                </div>
            )}
        </div>

        {points.length > 0 && isDrawing && showDrawing && (
          <button 
            onClick={removeLastPoint}
            className="bg-white hover:bg-red-50 text-red-600 p-2 rounded-md shadow-lg border border-slate-200 flex items-center justify-center transition-colors"
          >
            <Eraser className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default MapCanvas;