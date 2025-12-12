import React, { useState, useEffect } from 'react';
import MapCanvas from './components/MapCanvas';
import AreaForm from './components/AreaForm';
import Dashboard from './components/Dashboard';
import { SectorGeografico, AreaType, LatLng, CommunityStats, ViviendaRecord } from './types';
import { generateUniqueId, pointsToWKT, wktToPoints } from './utils/geoUtils';
// CAMBIO: Usamos el nuevo servicio de Supabase
import { saveAreaToSheet, fetchAreasFromSheet, fetchCommunityStats, updateAreaInSheet, fetchHouseholdsFromSheet } from './services/supabaseService';
import { ArrowLeft, LayoutDashboard, Lock, Unlock, ShieldCheck } from 'lucide-react';

function App() {
  // Navigation & Admin State
  const [view, setView] = useState<'dashboard' | 'map'>('dashboard');
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Application Data State
  const [communityStats, setCommunityStats] = useState<CommunityStats[]>([]);
  const [points, setPoints] = useState<LatLng[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  
  // Update Type for Supabase
  const [existingPolygons, setExistingPolygons] = useState<SectorGeografico[]>([]);
  const [households, setHouseholds] = useState<ViviendaRecord[]>([]);
  
  // Edit Mode State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [suggestedCenter, setSuggestedCenter] = useState<LatLng | null>(null);

  const [formData, setFormData] = useState({
    community: '',
    name: '',
    type: AreaType.LIMITE_COMUNAL,
    user: '',
    state: '',
    municipality: '',
    parish: ''
  });

  useEffect(() => {
    loadStats();
    loadPolygons();
    loadHouseholds();
  }, []);

  useEffect(() => {
    if (selectedCommunity) {
      const statMatch = communityStats.find(s => s.name === selectedCommunity);
      setFormData(prev => ({ 
          ...prev, 
          community: selectedCommunity,
          state: statMatch?.state || '',
          municipality: statMatch?.municipality || '',
          parish: statMatch?.parish || ''
      }));
      calculateSuggestedCenter(selectedCommunity);
    } else {
        setSuggestedCenter(null);
    }
  }, [selectedCommunity, communityStats, households]);

  const calculateSuggestedCenter = (communityName: string) => {
      // Filtrar por 'comunidad_asociada' (nuevo campo)
      const communityHouseholds = households.filter(h => h.comunidad_asociada === communityName);
      
      if (communityHouseholds.length > 0) {
          let latSum = 0;
          let lngSum = 0;
          let count = 0;

          communityHouseholds.forEach(h => {
             const lat = Number(h.latitud);
             const lng = Number(h.longitud);
             if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                 latSum += lat;
                 lngSum += lng;
                 count++;
             }
          });

          if (count > 0) {
              setSuggestedCenter({
                  lat: latSum / count,
                  lng: lngSum / count
              });
              return;
          }
      }
      setSuggestedCenter(null);
  };

  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      const stats = await fetchCommunityStats();
      setCommunityStats(stats);
    } catch (error) {
      console.error("Could not load stats", error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const loadPolygons = async () => {
    try {
      const data = await fetchAreasFromSheet();
      setExistingPolygons(data);
    } catch (error) {
      console.error("Could not load polygons", error);
    }
  };

  const loadHouseholds = async () => {
      try {
          const data = await fetchHouseholdsFromSheet();
          setHouseholds(data);
      } catch (error) {
          console.error("Could not load households", error);
      }
  };

  const handleSelectCommunity = (name: string) => {
    setSelectedCommunity(name);
    setView('map');
  };

  const handleBackToDashboard = () => {
    handleReset();
    setView('dashboard');
    setSelectedCommunity(null);
  };

  const handleReset = () => {
    setPoints([]);
    setIsDrawing(false);
    setEditingId(null);
    
    const statMatch = selectedCommunity ? communityStats.find(s => s.name === selectedCommunity) : null;
    
    setFormData({
      community: selectedCommunity || '',
      name: '',
      type: AreaType.LIMITE_COMUNAL,
      user: '',
      state: statMatch?.state || '',
      municipality: statMatch?.municipality || '',
      parish: statMatch?.parish || ''
    });
  };

  const toggleAdminMode = () => {
    if (isAdmin) {
        setIsAdmin(false);
        handleReset();
    } else {
        const password = window.prompt("Ingrese la clave de Administrador (Panel de Acceso):");
        if (password === "Apamate.25") {
            setIsAdmin(true);
            handleReset();
        } else if (password !== null) {
            alert("Contraseña incorrecta.");
        }
    }
  };

  const handleEditPolygon = (poly: SectorGeografico) => {
    if (!isAdmin) return;

    if (confirm(`¿Deseas editar el área "${poly.nombre_sector}"?`)) {
        setFormData({
            community: poly.nombre_sector, // Mapeo temporal simplificado
            name: poly.nombre_sector,
            type: AreaType.LIMITE_COMUNAL, // Default si no viene en DB
            user: 'Admin',
            state: poly.estado || '',
            municipality: poly.municipio || '',
            parish: poly.parroquia || ''
        });

        const polyPoints = wktToPoints(poly.geometria_poligono);
        setPoints(polyPoints);
        setEditingId(poly.id_sector);
        setIsDrawing(true);
    }
  };

  const handleSave = async () => {
    if (points.length < 3) return;
    setIsSaving(true);

    try {
        const commonData = {
            COMUNIDAD_ASOCIADA: formData.community, // Legacy prop name for UI
            TIPO_AREA: formData.type,
            NOMBRE_AREA: formData.name,
            GEOMETRIA_WKT: pointsToWKT(points),
            ESTADO: formData.state,
            MUNICIPIO: formData.municipality,
            PARROQUIA: formData.parish
        };

        if (editingId) {
            await updateAreaInSheet({
                ID_AREA: editingId,
                ...commonData
            });
            alert('✅ Área actualizada en Supabase.');
        } else {
            await saveAreaToSheet({
                ID_AREA: generateUniqueId(),
                ...commonData
            });
            alert('✅ Nueva área creada en Supabase.');
        }

        await loadPolygons();
        handleReset();

    } catch (error) {
      alert('❌ Error al guardar. Verifique conexión.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter polygons logic adaptation
  const filteredPolygons = existingPolygons
    .filter(p => selectedCommunity ? p.nombre_sector === selectedCommunity : true)
    .filter(p => p.id_sector !== editingId);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm z-10 sticky top-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
             {view === 'map' && (
                <button 
                  onClick={handleBackToDashboard}
                  className="mr-2 p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
                  title="Volver al Panel"
                >
                  <ArrowLeft size={20} />
                </button>
             )}
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-sm transition-colors ${isAdmin ? 'bg-yellow-500' : 'bg-rose-900'}`}>
              {isAdmin ? <ShieldCheck size={20} className="text-rose-900" /> : 'CS'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 hidden sm:block">
                  {isAdmin ? 'Panel de Administración' : 'Cartografía Social'}
              </h1>
              <h1 className="text-xl font-bold text-slate-800 sm:hidden">Gobierno Digital</h1>
              <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">
                {view === 'map' && selectedCommunity ? selectedCommunity : 'Gobierno Digital Comunitario'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <button
                onClick={toggleAdminMode}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isAdmin 
                    ? 'bg-yellow-400 text-yellow-900 border border-yellow-500 shadow-md' 
                    : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                }`}
             >
                {isAdmin ? <Unlock size={14} /> : <Lock size={14} />}
                {isAdmin ? 'Modo Editor' : 'Acceso Admin'}
             </button>
             {view === 'dashboard' && !isAdmin && (
                <span className="hidden md:flex bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold border border-blue-100 items-center gap-1">
                   <LayoutDashboard size={12} /> Panel Principal
                </span>
             )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full">
        {view === 'dashboard' ? (
            <Dashboard 
                stats={communityStats} 
                onSelectCommunity={handleSelectCommunity} 
                isLoading={isLoadingStats}
            />
        ) : (
            <div className="max-w-7xl mx-auto w-full p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in duration-300">
                <div className="lg:col-span-2 h-[500px] lg:h-[calc(100vh-140px)] rounded-xl shadow-lg border border-slate-300 bg-white overflow-hidden relative">
                <MapCanvas 
                    points={points} 
                    setPoints={setPoints} 
                    isDrawing={isDrawing} 
                    existingPolygons={filteredPolygons}
                    onPolygonClick={handleEditPolygon}
                    isAdmin={isAdmin}
                    suggestedCenter={suggestedCenter}
                />
                </div>
                <div className="lg:col-span-1 h-auto lg:h-[calc(100vh-140px)]">
                <AreaForm 
                    formData={formData}
                    setFormData={setFormData}
                    points={points}
                    isDrawing={isDrawing}
                    setIsDrawing={setIsDrawing}
                    handleReset={handleReset}
                    handleSave={handleSave}
                    isSaving={isSaving}
                    isEditing={!!editingId}
                    isAdmin={isAdmin}
                />
                </div>
            </div>
        )}
      </main>
    </div>
  );
}

export default App;