import React, { useState, useMemo } from 'react';
import { CommunityStats } from '../types';
import { Users, Home, MapPin, ChevronRight, Activity, Flag, Search, Filter, Map, AlertCircle } from 'lucide-react';

interface DashboardProps {
  stats: CommunityStats[];
  onSelectCommunity: (name: string) => void;
  isLoading: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, onSelectCommunity, isLoading }) => {
  // Estados para el filtrado jerárquico
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('');
  const [selectedParish, setSelectedParish] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // 1. Obtener listas únicas para los selectores
  const states = useMemo(() => Array.from(new Set(stats.map(s => s.state).filter(Boolean))), [stats]);
  
  const municipalities = useMemo(() => {
    return Array.from(new Set(
        stats
        .filter(s => !selectedState || s.state === selectedState)
        .map(s => s.municipality)
        .filter(Boolean)
    ));
  }, [stats, selectedState]);

  const parishes = useMemo(() => {
    return Array.from(new Set(
        stats
        .filter(s => (!selectedState || s.state === selectedState) && 
                     (!selectedMunicipality || s.municipality === selectedMunicipality))
        .map(s => s.parish)
        .filter(Boolean)
    ));
  }, [stats, selectedState, selectedMunicipality]);

  // 2. Filtrar las comunidades
  const filteredStats = useMemo(() => {
    return stats.filter(community => {
        const matchState = !selectedState || community.state === selectedState;
        const matchMuni = !selectedMunicipality || community.municipality === selectedMunicipality;
        const matchParish = !selectedParish || community.parish === selectedParish;
        const matchSearch = !searchTerm || 
                            community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            community.municipality?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchState && matchMuni && matchParish && matchSearch;
    });
  }, [stats, selectedState, selectedMunicipality, selectedParish, searchTerm]);

  // 3. Totales dinámicos basados en el filtro
  const totalFamilies = filteredStats.reduce((acc, curr) => acc + curr.families, 0);
  const totalPopulation = filteredStats.reduce((acc, curr) => acc + curr.population, 0);
  const totalCommunities = filteredStats.length;

  // Determinar si mostrar resultados (Solo si hay filtro activo)
  const showResults = selectedState !== '' || selectedMunicipality !== '' || selectedParish !== '' || searchTerm !== '';

  // Resetear filtros dependientes
  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedState(e.target.value);
    setSelectedMunicipality('');
    setSelectedParish('');
  };

  const handleMuniChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMunicipality(e.target.value);
    setSelectedParish('');
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      
      {/* 1. COMPENDIO GENERAL (Resumen) */}
      <section className="bg-gradient-to-br from-rose-900 to-rose-800 rounded-2xl shadow-xl p-6 md:p-8 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <Map size={200} />
        </div>

        <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">
                <Flag className="text-yellow-400" />
                Compendio General
            </h2>
            <p className="text-rose-200 mb-8 max-w-2xl">
                Resumen estadístico de la cartografía social.
                {selectedState || selectedMunicipality ? (
                   <span className="font-semibold text-yellow-300 ml-1">
                     Filtro: {selectedState} {selectedMunicipality && `/ ${selectedMunicipality}`} {selectedParish && `/ ${selectedParish}`}
                   </span>
                ) : ' Visualización Nacional'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1 */}
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 hover:bg-white/20 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-yellow-500 rounded-lg text-white shadow-lg">
                            <Home size={20} />
                        </div>
                        <span className="text-rose-100 font-medium">Consejos Comunales</span>
                    </div>
                    <div className="text-3xl font-bold">{totalCommunities}</div>
                    <div className="text-xs text-rose-200 mt-1">Registrados en la selección</div>
                </div>

                {/* Card 2 */}
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 hover:bg-white/20 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg">
                            <Users size={20} />
                        </div>
                        <span className="text-blue-100 font-medium">Población Total</span>
                    </div>
                    <div className="text-3xl font-bold">{totalPopulation.toLocaleString()}</div>
                    <div className="text-xs text-blue-200 mt-1">Habitantes estimados</div>
                </div>

                 {/* Card 3 */}
                 <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 hover:bg-white/20 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-600 rounded-lg text-white shadow-lg">
                            <Activity size={20} />
                        </div>
                        <span className="text-red-100 font-medium">Familias</span>
                    </div>
                    <div className="text-3xl font-bold">{totalFamilies.toLocaleString()}</div>
                    <div className="text-xs text-red-200 mt-1">Grupos familiares</div>
                </div>
            </div>
        </div>
      </section>

      {/* 2. SECCIÓN DE BÚSQUEDA Y FILTRO JERÁRQUICO */}
      <section className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4 text-rose-900 border-b border-rose-100 pb-3">
             <Filter className="w-5 h-5" />
             <h2 className="font-bold text-lg">Buscador y Filtros Territoriales</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
             {/* Estado */}
             <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Estado</label>
                <div className="relative">
                    <select 
                        value={selectedState} 
                        onChange={handleStateChange}
                        disabled={states.length === 0}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none appearance-none cursor-pointer disabled:opacity-50"
                    >
                        <option value="">{states.length === 0 && !isLoading ? "Sin datos cargados" : "Todos los Estados"}</option>
                        {states.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronRight className="w-4 h-4 text-slate-400 absolute right-3 top-3 rotate-90 pointer-events-none" />
                </div>
             </div>

             {/* Municipio */}
             <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Municipio</label>
                <div className="relative">
                    <select 
                        value={selectedMunicipality} 
                        onChange={handleMuniChange}
                        disabled={!selectedState && municipalities.length > 50}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none appearance-none disabled:opacity-50 cursor-pointer"
                    >
                        <option value="">Todos los Municipios</option>
                        {municipalities.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <ChevronRight className="w-4 h-4 text-slate-400 absolute right-3 top-3 rotate-90 pointer-events-none" />
                </div>
             </div>

             {/* Parroquia */}
             <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Parroquia</label>
                <div className="relative">
                    <select 
                        value={selectedParish} 
                        onChange={(e) => setSelectedParish(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none appearance-none cursor-pointer"
                    >
                        <option value="">Todas las Parroquias</option>
                        {parishes.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <ChevronRight className="w-4 h-4 text-slate-400 absolute right-3 top-3 rotate-90 pointer-events-none" />
                </div>
             </div>

             {/* Búsqueda Directa */}
             <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Buscar Comunidad</label>
                <div className="relative">
                    <input 
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Nombre de comunidad..."
                        className="w-full p-2.5 pl-10 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
             </div>
        </div>
        
        {/* Mensaje de Debug si no hay filtros */}
        {states.length === 0 && !isLoading && stats.length > 0 && (
             <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-200 flex items-center gap-2">
                 <AlertCircle size={14} />
                 <span>
                     <strong>Atención:</strong> Se encontraron datos de comunidades, pero no se detectaron Estados ni Municipios. 
                     Verifique que las columnas en su hoja de cálculo se llamen exactamente 
                     <code>ESTADO</code>, <code>MUNICIPIO</code>, <code>PARROQUIA</code> (sin espacios extra).
                 </span>
             </div>
        )}
      </section>

      {/* 3. LISTADO DE COMUNIDADES (Solo visible al filtrar) */}
      {showResults && (
          <section className="animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-1.5 bg-gradient-to-b from-yellow-400 via-blue-600 to-red-600 rounded-full shadow-sm"></div>
                    <h3 className="text-xl font-bold text-slate-800">Resultados ({filteredStats.length})</h3>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[1,2,3].map(i => <div key={i} className="h-48 bg-slate-200 rounded-xl"></div>)}
                </div>
            ) : filteredStats.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700">Sin resultados</h3>
                    <p className="text-slate-500 mt-1">No se encontraron comunidades con los filtros actuales.</p>
                    <button 
                        onClick={() => {setSelectedState(''); setSearchTerm('');}}
                        className="mt-4 text-rose-700 font-medium hover:underline"
                    >
                        Limpiar filtros
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStats.map((community) => (
                        <div key={community.name} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col">
                            <div className="bg-slate-50 border-b border-slate-100 p-4 border-l-4 border-l-rose-800 flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-slate-800 text-lg leading-tight mb-1" title={community.name}>
                                        {community.name}
                                    </h4>
                                    <div className="text-xs text-slate-500 flex flex-wrap gap-1 items-center">
                                        <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">{community.state || 'Estado'}</span>
                                        <ChevronRight size={10} className="text-slate-300" />
                                        <span className="text-slate-600">{community.municipality || 'Municipio'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                                        <span className="text-[10px] text-blue-600 uppercase font-bold tracking-wider block mb-1">Hogares</span>
                                        <div className="flex items-center gap-1.5 text-slate-700">
                                            <Home size={16} className="text-blue-600" />
                                            <span className="text-lg font-bold">{community.families}</span>
                                        </div>
                                    </div>
                                    <div className="bg-red-50/50 p-2 rounded-lg border border-red-100">
                                        <span className="text-[10px] text-red-600 uppercase font-bold tracking-wider block mb-1">Población</span>
                                        <div className="flex items-center gap-1.5 text-slate-700">
                                            <Users size={16} className="text-red-600" />
                                            <span className="text-lg font-bold">{community.population}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={() => onSelectCommunity(community.name)}
                                    className="w-full py-2.5 px-4 bg-slate-800 text-white rounded-lg font-medium flex items-center justify-center gap-2 group-hover:bg-rose-900 transition-colors shadow-sm"
                                >
                                    <MapPin size={16} className="text-yellow-400" />
                                    Ver Mapa Georreferenciado
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </section>
      )}

    </div>
  );
};

export default Dashboard;