import Papa from 'papaparse';
import { Client, Activity } from '../contexts/CRMContext';

export function exportClientsToCSV(clients: Client[]): void {
  const csvData = clients.map(client => ({
    Name: client.name,
    Company: client.company,
    Email: client.email,
    Phone: client.phone,
    Address: client.address,
    Notes: client.notes,
    Tags: client.tags.join(', '),
    'Created At': new Date(client.createdAt).toLocaleDateString(),
  }));

  const csv = Papa.unparse(csvData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `clients-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function importClientsFromCSV(file: File): Promise<Partial<Client>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        try {
          const clients = results.data.map((row: any) => ({
            name: row.Name || '',
            company: row.Company || '',
            email: row.Email || '',
            phone: row.Phone || '',
            address: row.Address || '',
            notes: row.Notes || '',
            tags: row.Tags ? row.Tags.split(', ').filter((tag: string) => tag.trim()) : [],
          }));
          resolve(clients);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}