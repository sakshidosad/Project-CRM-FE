import React, { useState, useMemo, useRef } from 'react';
import { Plus, Search, Download, Upload, Edit, Trash2, Users } from 'lucide-react';
import { useCRM } from '../../contexts/CRMContext';
import { useAuth } from '../../contexts/AuthContext';
import { canManageClients, canDeleteClients, canViewAllClients, isReadOnly } from '../../utils/permissions';
import { exportClientsToCSV, importClientsFromCSV } from '../../utils/csvUtils';
import ClientForm from './ClientForm';
import { Client } from '../../contexts/CRMContext';

const ClientList = () => {
  const { clients, addClient, updateClient, deleteClient } = useCRM();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredClients = useMemo(() => {
    if (!user) return [];
    
    let clientsToShow = canViewAllClients(user.role) 
      ? clients 
      : clients.filter(client => client.createdBy === user.id);

    if (searchTerm) {
      clientsToShow = clientsToShow.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedTag) {
      clientsToShow = clientsToShow.filter(client =>
        client.tags.includes(selectedTag)
      );
    }

    return clientsToShow;
  }, [clients, user, searchTerm, selectedTag]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    filteredClients.forEach(client => {
      client.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [filteredClients]);

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleDelete = async (clientId: string) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      await deleteClient(clientId);
    }
  };

  const handleFormSubmit = async (clientData: Omit<Client, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>) => {
    if (editingClient) {
      await updateClient(editingClient.id, clientData);
    } else {
      await addClient(clientData);
    }
    setShowForm(false);
    setEditingClient(undefined);
  };

  const handleExport = () => {
    exportClientsToCSV(filteredClients);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const importedClients = await importClientsFromCSV(file);
      for (const clientData of importedClients) {
        if (clientData.name && clientData.email) {
          await addClient(clientData as Omit<Client, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>);
        }
      }
      alert(`Successfully imported ${importedClients.length} clients!`);
    } catch (error) {
      alert('Error importing clients. Please check your CSV format.');
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!user) return null;

  const canManage = canManageClients(user.role);
  const canDelete = canDeleteClients(user.role);
  const readOnly = isReadOnly(user.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Clients</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your client relationships</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Download size={20} />
            Export CSV
          </button>
          
          {canManage && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleImport}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Upload size={20} />
                Import CSV
              </button>
              
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus size={20} />
                Add Client
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        {allTags.length > 0 && (
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Tags</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        )}
      </div>

      {/* Client Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <div key={client.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{client.name}</h3>
                {client.company && (
                  <p className="text-gray-600 dark:text-gray-400">{client.company}</p>
                )}
              </div>
              
              <div className="flex gap-1">
                {!readOnly && canManage && (
                  <button
                    onClick={() => handleEdit(client)}
                    className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                )}
                
                {canDelete && (
                  <button
                    onClick={() => handleDelete(client.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <p className="text-gray-600 dark:text-gray-400">
                <span className="font-medium">Email:</span> {client.email}
              </p>
              {client.phone && (
                <p className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Phone:</span> {client.phone}
                </p>
              )}
              {client.address && (
                <p className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Address:</span> {client.address}
                </p>
              )}
            </div>

            {client.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {client.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {client.notes && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {client.notes}
                </p>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Created {new Date(client.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Users size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No clients found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm || selectedTag ? 'Try adjusting your filters' : 'Get started by adding your first client'}
          </p>
          {canManage && !searchTerm && !selectedTag && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus size={20} />
              Add Client
            </button>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <ClientForm
          client={editingClient}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingClient(undefined);
          }}
        />
      )}
    </div>
  );
};

export default ClientList;