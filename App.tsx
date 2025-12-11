import React, { useState, useEffect } from 'react';
import MapCanvas from './components/MapCanvas';
import AreaForm from './components/AreaForm';
import Dashboard from './components/Dashboard';
import { AreaRecord, AreaType, LatLng, CommunityStats, HouseholdRecord } from './types';
import { generateUniqueId, getCurrentDateTime, pointsToWKT, wktToPoints } from './utils/geoUtils';
import { saveAreaToSheet, fetchAreasFromSheet, fetchCommunityStats, updateAreaInSheet, fetchHouseholdsFromSheet } from './services/sheetService';
import { ArrowLeft, LayoutDashboard, Lock, Unlock, ShieldCheck } from 'lucide-react';

function App() {
  // Navigation & Admin State
  const [view, setView] = useState<'dashboard' | 'map'>('dashboard');
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false); // Admin Toggle

  // Application Data State
  const [communityStats, setCommunityStats] = useState<CommunityStats[]>([]);
  const [points, setPoints] = useState<LatLng[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [existingPolygons, setExistingPolygons] = useState<AreaRecord[]>([]);
  const [households, setHouseholds] = useState<HouseholdRecord[]>([]);
  
  // Edit Mode State
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Suggested Center (Calculated from Census)
  const [suggestedCenter, setSuggestedCenter] = useState<LatLng | null>(null);

  // Form State Updated with Geography
  const [formData, setFormData] = useState({
    community: '',
    name: '',
    type: AreaType.LIMITE_COMUNAL,
    user: '',
    state: '',
    municipality: '',
    parish: ''
  });

  // Load stats and polygons on mount
  useEffect(() => {
    loadStats();
    loadPolygons(); // Pre-load polygons
    loadHouseholds(); // Load census data for referencing
  }, []);

  // When community changes via dashboard, update form default and try to pre-fill geography from stats
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

      // Calculate Suggested Center based on Households
      calculateSuggestedCenter(selectedCommunity);
    } else {
        setSuggestedCenter(null);
    }
  }, [selectedCommunity, communityStats, households]);

  const calculateSuggestedCenter = (communityName: string) => {
      // Filtrar hogares de esta comunidad
      const communityHouseholds = households.filter(h => h.COMUNIDAD === communityName);
      
      if (communityHouseholds.length > 0) {
          let latSum = 0;
          let lngSum = 0;
          let count = 0;

          communityHouseholds.forEach(h => {
             // Asegurar que sean números válidos
             const lat = Number(h.COORDENADA_LAT);
             const lng = Number(h.COORDENADA_LONG);
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
    setEditingId(null); // Exit edit mode
    
    // Reset form but keep geography if community is selected
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

  // Secure Admin Toggle
  const toggleAdminMode = () => {
    if (isAdmin) {
        setIsAdmin(false);
        handleReset();
    } else {
        const password = window.prompt("Ingrese la clave de Administrador (Panel de Acceso):");
        if (password === "Apamate.25") { // Clave actualizada
            setIsAdmin(true);
            handleReset();
        } else if (password !== null) {
            alert("Contraseña incorrecta.");
        }
    }
  };

  // Triggered when clicking a polygon on the map in Admin mode
  const handleEditPolygon = (poly: AreaRecord) => {
    if (!isAdmin) return;

    if (confirm(`¿Deseas editar el área "${poly.NOMBRE_AREA}"?`)) {
        // 1. Populate Form
        setFormData({
            community: poly.COMUNIDAD_ASOCIADA,
            name: poly.NOMBRE_AREA,
            type: poly.TIPO_AREA,
            user: poly.USUARIO_WKT,
            state: poly.ESTADO || '',
            municipality: poly.MUNICIPIO || '',
            parish: poly.PARROQUIA || ''
        });

        // 2. Convert WKT to points for the map editor
        const polyPoints = wktToPoints(poly.GEOMETRIA_WKT);
        setPoints(polyPoints);

        // 3. Set State
        setEditingId(poly.ID_AREA);
        setIsDrawing(true); // Enable drawing mode so points are editable
    }
  };

  const handleSave = async () => {
    if (points.length < 3) return;
    setIsSaving(true);

    try {
        const commonData = {
            COMUNIDAD_ASOCIADA: formData.community,
            TIPO_AREA: formData.type,
            NOMBRE_AREA: formData.name,
            GEOMETRIA_WKT: pointsToWKT(points),
            FECHA_ACTUALIZACION: getCurrentDateTime(),
            USUARIO_WKT: formData.user,
            ESTADO: formData.state,
            MUNICIPIO: formData.municipality,
            PARROQUIA: formData.parish
        };

        if (editingId) {
            // UPDATE EXISTING
            await updateAreaInSheet({
                ID_AREA: editingId,
                ...commonData
            });
            alert('✅ Área actualizada correctamente.');
        } else {
            // CREATE NEW
            await saveAreaToSheet({
                ID_AREA: generateUniqueId(),
                ...commonData
            });
            alert('✅ Nueva área creada exitosamente.');
        }

        await loadPolygons();
        handleReset();

    } catch (error) {
      alert('❌ Error al guardar. Revise la consola.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter polygons
  const filteredPolygons = existingPolygons
    .filter(p => selectedCommunity ? p.COMUNIDAD_ASOCIADA === selectedCommunity : true)
    .filter(p => p.ID_AREA !== editingId);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
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
             {/* Logo CS in Vinotinto */}
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
             {/* Admin Toggle - Amarillo en modo activo */}
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

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        
        {view === 'dashboard' ? (
            <Dashboard 
                stats={communityStats} 
                onSelectCommunity={handleSelectCommunity} 
                isLoading={isLoadingStats}
            />
        ) : (
            <div className="max-w-7xl mx-auto w-full p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in duration-300">
                {/* Left: Map Editor */}
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

                {/* Right: Sidebar Form */}
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