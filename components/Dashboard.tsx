import React from 'react';
import { CommunityStats } from '../types';
import { Users, Home, MapPin, ChevronRight, Activity } from 'lucide-react';

interface DashboardProps {
  stats: CommunityStats[];
  onSelectCommunity: (name: string) => void;
  isLoading: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, onSelectCommunity, isLoading }) => {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-12">
      
      {/* 1. Hero / History Section */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12 text-center md:text-left">
        <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
                <h2 className="text-3xl font-bold text-slate-800 mb-4">
                  Historia de la Comunidad
                </h2>
                <p className="text-slate-600 text-lg leading-relaxed mb-6">
                  Este espacio honra la memoria y el esfuerzo de nuestros habitantes. 
                  La cartografía social no es solo un mapa; es el reflejo de nuestras luchas, 
                  nuestros logros y la proyección de nuestro futuro. Aquí documentamos la realidad 
                  de nuestro territorio para construir, entre todos, el <strong>Plan de la Patria Comunal</strong>.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-3">
                        <div className="bg-blue-600 text-white p-2 rounded-full"><Users size={20} /></div>
                        <span className="font-semibold text-blue-900">Identidad</span>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center gap-3">
                        <div className="bg-emerald-600 text-white p-2 rounded-full"><Activity size={20} /></div>
                        <span className="font-semibold text-emerald-900">Organización</span>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex items-center gap-3">
                        <div className="bg-purple-600 text-white p-2 rounded-full"><MapPin size={20} /></div>
                        <span className="font-semibold text-purple-900">Territorio</span>
                    </div>
                </div>
            </div>
            <div className="w-full md:w-1/3">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl transform rotate-1 md:rotate-2 hover:rotate-0 transition-transform">
                    <h3 className="text-xl font-bold mb-2">Estado del Sistema</h3>
                    <ul className="space-y-3 opacity-90">
                        <li className="flex justify-between border-b border-blue-400 pb-2">
                            <span>Comunidades</span>
                            <span className="font-mono text-lg">{stats.length}</span>
                        </li>
                        <li className="flex justify-between border-b border-blue-400 pb-2">
                            <span>Total Familias</span>
                            <span className="font-mono text-lg">{stats.reduce((acc, curr) => acc + curr.families, 0)}</span>
                        </li>
                        <li className="flex justify-between">
                            <span>Población Total</span>
                            <span className="font-mono text-lg">{stats.reduce((acc, curr) => acc + curr.population, 0)}</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
      </section>

      {/* 2. Community List & Stats */}
      <section>
        <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-1 bg-blue-600 rounded-full"></div>
            <h3 className="text-2xl font-bold text-slate-800">Resumen por Consejo Comunal</h3>
        </div>

        {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[1,2,3].map(i => (
                    <div key={i} className="h-48 bg-slate-200 rounded-xl"></div>
                ))}
            </div>
        ) : stats.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
                <p className="text-slate-500">No hay datos de censo disponibles en la pestaña CENSO_HOGARES.</p>
                <p className="text-xs text-slate-400 mt-2">Asegúrate de conectar AppSheet y sincronizar datos.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.map((community) => (
                    <div key={community.name} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group">
                        <div className="bg-slate-50 border-b border-slate-100 p-4">
                            <h4 className="font-bold text-slate-800 truncate" title={community.name}>
                                {community.name}
                            </h4>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block mb-1">Hogares</span>
                                    <div className="flex items-center gap-2 text-slate-700">
                                        <Home size={18} className="text-blue-500" />
                                        <span className="text-xl font-bold">{community.families}</span>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block mb-1">Personas</span>
                                    <div className="flex items-center gap-2 text-slate-700">
                                        <Users size={18} className="text-emerald-500" />
                                        <span className="text-xl font-bold">{community.population}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Simple Visual Bar */}
                            <div className="mb-6">
                                <div className="text-xs text-slate-400 mb-1 flex justify-between">
                                    <span>Densidad relativa</span>
                                    <span>{(community.population / (community.families || 1)).toFixed(1)} hab/hogar</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-blue-400 to-emerald-400" 
                                        style={{ width: `${Math.min(100, (community.population / 20) * 10)}%` }} // Visual approximation
                                    ></div>
                                </div>
                            </div>

                            <button 
                                onClick={() => onSelectCommunity(community.name)}
                                className="w-full py-2 px-4 bg-slate-800 text-white rounded-lg font-medium flex items-center justify-center gap-2 group-hover:bg-blue-600 transition-colors"
                            >
                                <MapPin size={16} />
                                Ver Cartografía
                                <ChevronRight size={16} className="opacity-60" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </section>

    </div>
  );
};

export default Dashboard;