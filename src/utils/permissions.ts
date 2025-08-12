import { UserRole } from '../contexts/AuthContext';

export function canManageClients(role: UserRole): boolean {
  return role === 'admin' || role === 'sales';
}

export function canDeleteClients(role: UserRole): boolean {
  return role === 'admin';
}

export function canManageActivities(role: UserRole): boolean {
  return role === 'admin' || role === 'sales';
}

export function canViewAllClients(role: UserRole): boolean {
  return role === 'admin';
}

export function isReadOnly(role: UserRole): boolean {
  return role === 'support';
}