import React, { useState } from 'react';
import { Building2, Plus, Trash2, MapPin, Users, DollarSign, X } from 'lucide-react';

export const PropertiesSection = ({ properties, currency = '₹', onCreateProperty, onDeleteProperty }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Apartment',
    address: '',
    city: '',
    state: '',
    units_count: '6',
    default_rent: '20000'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return;
    await onCreateProperty(formData);
    setIsModalOpen(false);
    setFormData({
      name: '',
      type: 'Apartment',
      address: '',
      city: '',
      state: '',
      units_count: '6',
      default_rent: '20000'
    });
  };

  const propertyList = Array.isArray(properties) ? properties : [];

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">Managed Properties & Estates</h2>
          <p className="text-xs text-slate-400">Manage residential apartments, villas, and commercial rentals</p>
        </div>

        <button
          data-tour="add-property-btn"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Property</span>
        </button>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {propertyList.length === 0 ? (
          <div className="col-span-full p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
            <Building2 className="w-10 h-10 text-indigo-400 mx-auto" />
            <h4 className="font-bold text-white text-sm">No Properties Added Yet</h4>
            <p className="text-xs text-slate-400">Click "Add Property" above to create your first building or apartment.</p>
          </div>
        ) : (
          propertyList.map(property => (
          <div
            key={property.id}
            className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700 hover:border-slate-600 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                  {property.type || 'Apartment'}
                </span>
              </div>

              <h3 className="text-base font-bold text-white mt-3">{property.name}</h3>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                <span>{property.address ? `${property.address}, ${property.city}` : 'No address specified'}</span>
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Occupied Units</span>
                  <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                    {property.occupied_units || 0} / {property.units_count || 1}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Total Monthly Rent</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 block">
                    {currency}{Number(property.total_rent || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">
                Collected: <strong className="text-white">{currency}{Number(property.collected_rent || 0).toLocaleString()}</strong>
              </span>
              <button
                onClick={() => onDeleteProperty(property.id)}
                className="p-1.5 text-slate-500 hover:text-rose-400 transition rounded-lg hover:bg-slate-900"
                title="Delete Property"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )))}
      </div>

      {/* Add Property Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                <span>Add New Property</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Property Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Skyline Heights Apartments"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Property Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Apartment">Apartment Complex</option>
                    <option value="Villa">Independent Villa</option>
                    <option value="Commercial">Commercial Office / Complex</option>
                    <option value="PG / Co-living">PG / Co-living Hostels</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Total Units Count</label>
                  <input
                    type="number"
                    placeholder="8"
                    value={formData.units_count}
                    onChange={(e) => setFormData({ ...formData, units_count: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Street Address</label>
                <input
                  type="text"
                  placeholder="e.g. 42 Orchid Boulevard, Block C"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Bangalore"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">State / Province</label>
                  <input
                    type="text"
                    placeholder="e.g. Karnataka"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg shadow-indigo-600/30 transition active:scale-95"
                >
                  Save Property
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
