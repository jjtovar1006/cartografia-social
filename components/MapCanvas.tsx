import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, useMapEvents, Polyline, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import { AreaRecord, LatLng } from '../types';
import { wktToPoints } from '../utils/geoUtils';
import { MapPin, Eraser, MousePointerClick, Layers, Edit3, Eye, EyeOff, CheckSquare, Square } from 'lucide-react';
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
  const [showExisting, setShowExisting] = useState(true);
  const [showDrawing, setShowDrawing] = useState(true);
  const [isLayersMenuOpen, setIsLayersMenuOpen] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setCenter([position.coords.latitude, position.coords.longitude]);
      });
    }
  }, []);

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (!isDrawing) return;
    setPoints([...points, { lat: e.latlng.lat, lng: e.latlng.lng }]);
  };

  const removeLastPoint = () => {
    setPoints(points.slice(0, -1));
  };

  const polylinePositions = points.map(p => [p.lat, p.lng] as [number, number]);

  return (
    <div className="relative h-full w-full rounded-lg overflow-hidden border border-slate-300 shadow-inner">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <ClickHandler onClick={handleMapClick} />

        {/* 1. Render Existing Polygons (Controlled by Visibility State) */}
        {showExisting && existingPolygons.map((poly) => {
          const polyPoints = wktToPoints(poly.GEOMETRIA_WKT);
          if (polyPoints.length === 0) return null;
          
          return (
            <Polygon 
              key={poly.ID_AREA}
              positions={polyPoints.map(p => [p.lat, p.lng] as [number, number])}
              pathOptions={{ 
                  color: isAdmin ? '#d97706' : '#64748b', // Amber in admin mode, slate normally
                  fillColor: isAdmin ? '#fbbf24' : '#94a3b8', 
                  fillOpacity: 0.3, 
                  weight: isAdmin ? 2 : 1 
              }}
              eventHandlers={{
                  click: () => {
                      if (isAdmin && onPolygonClick && !isDrawing) {
                          onPolygonClick(poly);
                      }
                  }
              }}
            >
              <Tooltip sticky>
                 <span className="font-bold">{poly.NOMBRE_AREA}</span>
                 {isAdmin && !isDrawing && <span className="block text-xs text-amber-600">(Clic para editar)</span>}
              </Tooltip>
              {!isAdmin && (
                <Popup>
                    <div className="text-sm">
                    <strong className="block text-slate-800">{poly.NOMBRE_AREA}</strong>
                    <span className="text-slate-500">{poly.TIPO_AREA}</span>
                    <br/>
                    <span className="text-xs text-slate-400">{poly.COMUNIDAD_ASOCIADA}</span>
                    </div>
                </Popup>
              )}
            </Polygon>
          );
        })}

        {/* 2. Render Current Drawing / Editing (Controlled by Visibility State) */}
        {showDrawing && (
            <>
                {points.length > 0 && points.length < 3 && (
                  <Polyline positions={polylinePositions} color="blue" dashArray="5, 10" />
                )}

                {points.length >= 3 && (
                  <Polygon positions={polylinePositions} color="blue" fillColor="blue" fillOpacity={0.2} />
                )}

                {points.map((p, idx) => (
                  <CircleMarker 
                    key={`${p.lat}-${p.lng}-${idx}`} 
                    center={[p.lat, p.lng]} 
                    radius={5} 
                    pathOptions={{ color: 'white', fillColor: 'blue', fillOpacity: 1, weight: 2 }} 
                  />
                ))}
            </>
        )}

      </MapContainer>

      {/* Floating Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end gap-2">
        
        {/* Status Badge */}
        <div className={`p-2 rounded-md shadow-lg border text-xs font-medium flex items-center gap-2 ${
            isDrawing ? 'bg-white border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600'
        }`}>
           {isDrawing ? (
             <>
               <MousePointerClick className="w-4 h-4" />
               {isAdmin ? 'Editando Geometría' : 'Modo Dibujo'}
             </>
           ) : (
             <>
               <Layers className="w-4 h-4" />
               {existingPolygons.length} áreas cargadas
             </>
           )}
        </div>

        {/* Layer Control Button & Menu */}
        <div className="relative">
            <button 
                onClick={() => setIsLayersMenuOpen(!isLayersMenuOpen)}
                className="bg-white p-2 rounded-md shadow-lg border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                title="Control de Capas"
            >
                <Layers className="w-5 h-5" />
                <span className="sr-only">Capas</span>
            </button>
            
            {isLayersMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 p-3 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-1">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Capas Visibles</span>
                    </div>
                    
                    <button 
                        onClick={() => setShowExisting(!showExisting)}
                        className="flex items-center justify-between p-2 rounded hover:bg-slate-50 text-sm text-slate-700 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                             {showExisting ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                             <span>Áreas Registradas</span>
                        </div>
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-xs font-mono">{existingPolygons.length}</span>
                    </button>

                    <button 
                        onClick={() => setShowDrawing(!showDrawing)}
                        className="flex items-center justify-between p-2 rounded hover:bg-slate-50 text-sm text-slate-700 transition-colors"
                    >
                         <div className="flex items-center gap-2">
                             {showDrawing ? <CheckSquare className="w-4 h-4 text-amber-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                             <span>Dibujo Actual</span>
                        </div>
                        {points.length > 0 && (
                            <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-xs font-mono">{points.length} pts</span>
                        )}
                    </button>
                </div>
            )}
        </div>

        {/* Action Hint */}
        {isAdmin && !isDrawing && (
             <div className="bg-amber-50 p-2 rounded-md shadow-lg border border-amber-200 text-xs font-medium text-amber-800 flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                Selecciona un área
             </div>
        )}
        
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