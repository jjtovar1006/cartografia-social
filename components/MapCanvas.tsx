import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, CircleMarker, Polyline, useMapEvents, Tooltip, Popup } from 'react-leaflet';
import { AreaRecord, LatLng } from '../types';
import { wktToPoints } from '../utils/geoUtils';
import { MousePointerClick, Layers, Edit3, CheckSquare, Square, Eraser } from 'lucide-react';
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

  // COLORES INSTITUCIONALES Y PATRIOS
  const COLOR_VINOTINTO = '#881337'; // Rose 900 - Color base institucional
  const COLOR_AMARILLO = '#eab308'; // Yellow 500 - Para resaltar edición/admin
  const COLOR_AZUL = '#2563eb'; // Blue 600 - Para dibujo activo (acción)

  return (
    <div className="relative h-full w-full rounded-lg overflow-hidden border border-slate-300 shadow-inner">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <ClickHandler onClick={handleMapClick} />

        {/* 1. Render Existing Polygons */}
        {showExisting && existingPolygons.map((poly) => {
          const polyPoints = wktToPoints(poly.GEOMETRIA_WKT);
          if (polyPoints.length === 0) return null;
          
          return (
            <Polygon 
              key={poly.ID_AREA}
              positions={polyPoints.map(p => [p.lat, p.lng] as [number, number])}
              pathOptions={{ 
                  // Si es Admin, bordes AMARILLOS para resaltar.
                  // Si es Usuario normal, todo VINOTINTO.
                  color: isAdmin ? COLOR_AMARILLO : COLOR_VINOTINTO, 
                  fillColor: COLOR_VINOTINTO, 
                  fillOpacity: isAdmin ? 0.5 : 0.4, 
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
              <Tooltip sticky direction="top">
                 <span className="font-bold text-rose-900">{poly.NOMBRE_AREA}</span>
                 {isAdmin && !isDrawing && <span className="block text-xs text-yellow-600 font-semibold">(Clic para editar)</span>}
              </Tooltip>
              {!isAdmin && (
                <Popup>
                    <div className="text-sm">
                    <strong className="block text-rose-900 border-b border-rose-100 pb-1 mb-1">{poly.NOMBRE_AREA}</strong>
                    <span className="text-slate-600 font-medium">{poly.TIPO_AREA}</span>
                    <br/>
                    <span className="text-xs text-slate-400">{poly.COMUNIDAD_ASOCIADA}</span>
                    </div>
                </Popup>
              )}
            </Polygon>
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
        <div className={`p-2 rounded-md shadow-lg border text-xs font-medium flex items-center gap-2 ${
            isDrawing ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-white border-slate-200 text-slate-600'
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
                className="bg-white p-2 rounded-md shadow-lg border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                title="Control de Capas"
            >
                <Layers className="w-5 h-5" />
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
                             {showExisting ? <CheckSquare className="w-4 h-4 text-rose-800" /> : <Square className="w-4 h-4 text-slate-400" />}
                             <span>Áreas Registradas</span>
                        </div>
                        <span className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded text-xs font-mono">{existingPolygons.length}</span>
                    </button>

                    <button 
                        onClick={() => setShowDrawing(!showDrawing)}
                        className="flex items-center justify-between p-2 rounded hover:bg-slate-50 text-sm text-slate-700 transition-colors"
                    >
                         <div className="flex items-center gap-2">
                             {showDrawing ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                             <span>Dibujo Actual</span>
                        </div>
                        {points.length > 0 && (
                            <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs font-mono">{points.length} pts</span>
                        )}
                    </button>
                </div>
            )}
        </div>

        {/* Action Hint */}
        {isAdmin && !isDrawing && (
             <div className="bg-yellow-50 p-2 rounded-md shadow-lg border border-yellow-200 text-xs font-bold text-yellow-800 flex items-center gap-2">
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