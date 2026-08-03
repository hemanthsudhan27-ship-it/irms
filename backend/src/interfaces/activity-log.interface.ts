export type LogAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'view' | 'assign' | 'unassign' | 'restore';

export interface IActivityLog {
  id: string;
  company_id: string | null;
  complex_id: string | null;
  user_id: string | null;
  action: LogAction;
  entity_type: string;
  entity_id: string | null;
  description: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, any>;
  created_at: Date;
}

export interface ICreateActivityLogDto {
  companyId?: string | null;
  complexId?: string | null;
  userId?: string | null;
  action: LogAction;
  entityType: string;
  entityId?: string | null;
  description?: string;
  oldValues?: Record<string, any> | null;
  newValues?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, any>;
}
