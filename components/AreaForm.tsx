import React from 'react';
import { AreaType, LatLng } from '../types';
import { Save, Map, Trash2, CheckCircle, Edit, AlertCircle, MapPin } from 'lucide-react';

interface AreaFormProps {
  formData: {
    community: string;
    name: string;
    type: AreaType;
    user: string;
    state: string;
    municipality: string;
    parish: string;
  };
  setFormData: (data: any) => void;
  points: LatLng[];
  isDrawing: boolean;
  setIsDrawing: (v: boolean) => void;
  handleReset: () => void;
  handleSave: () => void;
  isSaving: boolean;
  isEditing?: boolean;
  isAdmin?: boolean;
}

const AreaForm: React.FC<AreaFormProps> = ({
  formData,
  setFormData,
  points,
  isDrawing,
  setIsDrawing,
  handleReset,
  handleSave,
  isSaving,
  isEditing = false,
  isAdmin = false
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isValid = points.length >= 3 && formData.community && formData.name && formData.user;

  // View Mode (Non-Admin)
  if (!isAdmin) {
      return (
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 h-full flex flex-col justify-center items-center text-center">
            <div className="bg-white p-4 rounded-full shadow-sm mb-4 border border-rose-100">
                <Map className="w-8 h-8 text-rose-800" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Modo Visualización</h2>
            <p className="text-sm text-slate-500 mt-2 max-w-[200px]">
                Para editar o agregar nuevas áreas, active el <strong>Modo Editor</strong> en el panel superior.
            </p>
        </div>
      );
  }

  return (
    <div className={`p-6 rounded-xl shadow-sm border h-full flex flex-col ${isEditing ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-slate-200'}`}>
      <div className="mb-6">
        <h2 className={`text-xl font-bold flex items-center gap-2 ${isEditing ? 'text-yellow-800' : 'text-blue-800'}`}>
          {isEditing ? <Edit className="w-5 h-5" /> : <Map className="w-5 h-5 text-blue-600" />}
          {isEditing ? 'Editando Área' : 'Nueva Área'}
        </h2>
        <p className={`text-sm mt-1 ${isEditing ? 'text-yellow-700' : 'text-slate-500'}`}>
          {isEditing ? 'Modifique los puntos en el mapa o los datos.' : 'Complete la información para registrar.'}
        </p>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto pr-2">
        
        {/* Sección Geografía Política */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
             <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                 <MapPin size={12} /> Ubicación Política
             </div>
             
             <div className="grid grid-cols-2 gap-3">
                {/* Estado */}
                <div className="col-span-2">
                    <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="Estado (Ej: Miranda)"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                {/* Municipio */}
                <div>
                    <input
                        type="text"
                        name="municipality"
                        value={formData.municipality}
                        onChange={handleChange}
                        placeholder="Municipio"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                {/* Parroquia */}
                <div>
                    <input
                        type="text"
                        name="parish"
                        value={formData.parish}
                        onChange={handleChange}
                        placeholder="Parroquia"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
             </div>
        </div>

        {/* Community Field */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Comunidad / Consejo Comunal *
          </label>
          <input
            type="text"
            name="community"
            value={formData.community}
            onChange={handleChange}
            placeholder="Ej: Casco Central"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-semibold"
          />
        </div>

        {/* Name Field */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Nombre del Área (Polígono) *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ej: Zona de Cultivo Norte"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Type Field */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Tipo de Área *
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            {Object.values(AreaType).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

         {/* User Field */}
         <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Editado por (Usuario) *
          </label>
          <input
            type="text"
            name="user"
            value={formData.user}
            onChange={handleChange}
            placeholder="Su nombre"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Status Card */}
        <div className={`p-4 rounded-lg border ${points.length >= 3 ? 'bg-green-50 border-green-200' : 'bg-white border-slate-300'}`}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-slate-700">Geometría</span>
            <span className="text-xs font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
              {points.length} Puntos
            </span>
          </div>
          {points.length < 3 ? (
             <div className="text-xs text-red-600 flex items-center gap-1">
               <AlertCircle className="w-3 h-3" /> Requiere 3+ puntos
             </div>
          ) : (
            <div className="text-xs text-green-700 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Polígono válido
            </div>
          )}
        </div>
      </div>

      <div className="pt-6 border-t border-slate-100 mt-4 space-y-3">
        {!isDrawing ? (
           <button
           onClick={() => setIsDrawing(true)}
           className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md transition-all flex justify-center items-center gap-2"
         >
           <Map className="w-4 h-4" />
           Dibujar Nueva Área
         </button>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {/* Botón CANCELAR - Rojo */}
            <button
              onClick={handleReset}
              className="py-3 px-4 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-all flex justify-center items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Cancelar
            </button>
             {/* Botón GUARDAR - Azul (Crear) o Vinotinto (Editar) */}
             <button
              onClick={handleSave}
              disabled={!isValid || isSaving}
              className={`py-3 px-4 rounded-lg font-medium shadow-md transition-all flex justify-center items-center gap-2 text-white
                ${!isValid || isSaving ? 'bg-slate-400 cursor-not-allowed' : isEditing ? 'bg-rose-900 hover:bg-rose-800' : 'bg-blue-600 hover:bg-blue-700'}
              `}
            >
              {isSaving ? 'Guardando...' : isEditing ? 'Actualizar' : 'Guardar'}
              {!isSaving && <Save className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AreaForm;