import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, CircleMarker, Polyline, useMapEvents, Tooltip, Popup, Marker } from 'react-leaflet';
import { AreaRecord, LatLng, AreaType } from '../types';
import { wktToPoints, getPolygonCentroid } from '../utils/geoUtils';
import { MousePointerClick, Layers, Edit3, CheckSquare, Square, Eraser, MapPin, Filter } from 'lucide-react';
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
  existingPolygons?: AreaRecord[];
  onPolygonClick?: (poly: AreaRecord) => void;
  isAdmin?: boolean;
}

const ClickHandler: React.FC<{ onClick: (e: L.LeafletMouseEvent) => void }> = ({ onClick }) => {
  useMapEvents({
    click: onClick,
  });
  return null;
};

const MapCanvas: React.FC<MapCanvasProps> = ({ 
    points, 
    setPoints, 
    isDrawing, 
    existingPolygons = [], 
    onPolygonClick,
    isAdmin = false
}) => {
  const [center, setCenter] = useState<[number, number]>([10.4806, -66.9036]);
  
  // Layer Visibility State
  const [showPolygons, setShowPolygons] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showDrawing, setShowDrawing] = useState(true);
  
  // Filter State
  const [selectedAreaTypes, setSelectedAreaTypes] = useState<AreaType[]>(Object.values(AreaType));
  
  const [isLayersMenuOpen, setIsLayersMenuOpen] = useState(false);

  useEffect(() => {
    // Si hay polígonos existentes, centrar en el primero para mejor UX
    if (existingPolygons.length > 0) {
        const firstPoly = wktToPoints(existingPolygons[0].GEOMETRIA_WKT);
        if (firstPoly.length > 0) {
            setCenter([firstPoly[0].lat, firstPoly[0].lng]);
            return;
        }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setCenter([position.coords.latitude, position.coords.longitude]);
      });
    }
  }, [existingPolygons]);

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (!isDrawing) return;
    setPoints([...points, { lat: e.latlng.lat, lng: e.latlng.lng }]);
  };

  const removeLastPoint = () => {
    setPoints(points.slice(0, -1));
  };

  const toggleAreaType = (type: AreaType) => {
    if (selectedAreaTypes.includes(type)) {
      setSelectedAreaTypes(selectedAreaTypes.filter(t => t !== type));
    } else {
      setSelectedAreaTypes([...selectedAreaTypes, type]);
    }
  };

  const polylinePositions = points.map(p => [p.lat, p.lng] as [number, number]);

  // COLORES INSTITUCIONALES Y PATRIOS
  const COLOR_VINOTINTO = '#881337'; // Rose 900
  const COLOR_AMARILLO = '#eab308'; // Yellow 500
  const COLOR_AZUL = '#2563eb'; // Blue 600

  // Helper to get color based on type (Optional visual distinction)
  const getPolyColor = (type: AreaType) => {
      if (isAdmin) return COLOR_AMARILLO;
      switch(type) {
          case AreaType.ZONA_AGRICOLA: return '#16a34a'; // Green
          case AreaType.ZONA_RIESGO: return '#ea580c'; // Orange
          case AreaType.EQUIPAMIENTO: return '#2563eb'; // Blue
          default: return COLOR_VINOTINTO;
      }
  };

  return (
    <div className="relative h-full w-full rounded-lg overflow-hidden border border-slate-300 shadow-inner">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <ClickHandler onClick={handleMapClick} />

        {/* 1. Render Existing Data */}
        {existingPolygons.map((poly) => {
          // Filter logic
          if (!selectedAreaTypes.includes(poly.TIPO_AREA)) return null;

          const polyPoints = wktToPoints(poly.GEOMETRIA_WKT);
          if (polyPoints.length === 0) return null;
          const centroid = getPolygonCentroid(polyPoints);
          const color = getPolyColor(poly.TIPO_AREA);

          return (
            <React.Fragment key={poly.ID_AREA}>
                {/* A. POLYGONS LAYER */}
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
                            <span className="font-bold text-slate-900">{poly.NOMBRE_AREA}</span>
                            <br/>
                            <span className="text-xs text-slate-500">{poly.TIPO_AREA}</span>
                        </Tooltip>
                    </Polygon>
                )}

                {/* B. MARKERS LAYER (Points of Coordinates per Community) */}
                {showMarkers && centroid && !isDrawing && (
                    <Marker position={[centroid.lat, centroid.lng]}>
                        <Popup>
                            <div className="text-sm min-w-[150px] p-1">
                                <div className="flex items-center gap-2 mb-2 border-b border-rose-100 pb-2">
                                    <MapPin size={16} className="text-rose-800" />
                                    <strong className="block text-rose-900 text-base">{poly.NOMBRE_AREA}</strong>
                                </div>
                                
                                <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full mb-2 font-medium border border-blue-100">
                                    {poly.TIPO_AREA}
                                </span>
                                
                                <div className="space-y-1">
                                    <div className="text-xs text-slate-500">
                                        <span className="font-semibold text-slate-700">Comunidad:</span> {poly.COMUNIDAD_ASOCIADA}
                                    </div>
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

        {/* 2. Render Current Drawing (AZUL) */}
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

      </MapContainer>

      {/* Floating Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end gap-2">
        
        {/* Status Badge */}
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
               {existingPolygons.length} áreas cargadas
             </>
           )}
        </div>

        {/* Layer Control */}
        <div className="relative">
            <button 
                onClick={() => setIsLayersMenuOpen(!isLayersMenuOpen)}
                className="bg-white/90 p-2 rounded-md shadow-lg border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors backdrop-blur-sm"
                title="Control de Capas y Filtros"
            >
                <Layers className="w-5 h-5" />
            </button>
            
            {isLayersMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-slate-200 p-3 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200 max-h-[80vh] overflow-y-auto">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-1">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Capas Visibles</span>
                    </div>
                    
                    <button 
                        onClick={() => setShowPolygons(!showPolygons)}
                        className="flex items-center justify-between p-2 rounded hover:bg-slate-50 text-sm text-slate-700 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                             {showPolygons ? <CheckSquare className="w-4 h-4 text-rose-800" /> : <Square className="w-4 h-4 text-slate-400" />}
                             <span>Polígonos (Áreas)</span>
                        </div>
                    </button>

                    <button 
                        onClick={() => setShowMarkers(!showMarkers)}
                        className="flex items-center justify-between p-2 rounded hover:bg-slate-50 text-sm text-slate-700 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                             {showMarkers ? <CheckSquare className="w-4 h-4 text-rose-800" /> : <Square className="w-4 h-4 text-slate-400" />}
                             <span>Puntos (Coordenadas)</span>
                        </div>
                    </button>

                    <button 
                        onClick={() => setShowDrawing(!showDrawing)}
                        className="flex items-center justify-between p-2 rounded hover:bg-slate-50 text-sm text-slate-700 transition-colors"
                    >
                         <div className="flex items-center gap-2">
                             {showDrawing ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                             <span>Dibujo Actual</span>
                        </div>
                    </button>

                    {/* NEW: Filter by Type Section */}
                    <div className="border-t border-slate-100 my-1 pt-2">
                        <div className="flex items-center gap-1.5 mb-2 px-1">
                            <Filter size={12} className="text-slate-400" />
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filtrar por Tipo</span>
                        </div>
                        
                        <div className="space-y-0.5">
                            {Object.values(AreaType).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => toggleAreaType(type)}
                                    className="flex items-center justify-between p-1.5 w-full rounded hover:bg-slate-50 text-xs text-slate-700 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        {selectedAreaTypes.includes(type) ? 
                                            <CheckSquare className="w-3.5 h-3.5 text-blue-600" /> : 
                                            <Square className="w-3.5 h-3.5 text-slate-400" />
                                        }
                                        <span className="truncate text-left">{type}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                         <button 
                            onClick={() => setSelectedAreaTypes(Object.values(AreaType))}
                            className="text-[10px] text-blue-600 hover:text-blue-800 font-medium mt-2 w-full text-center"
                        >
                            Seleccionar Todos
                        </button>
                    </div>

                </div>
            )}
        </div>

        {/* Eraser Tool */}
        {points.length > 0 && isDrawing && showDrawing && (
          <button 
            onClick={removeLastPoint}
            className="bg-white hover:bg-red-50 text-red-600 p-2 rounded-md shadow-lg border border-slate-200 flex items-center justify-center transition-colors"
            title="Borrar último punto"
          >
            <Eraser className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default MapCanvas;