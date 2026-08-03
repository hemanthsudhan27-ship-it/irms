export interface IRolePermissions {
  all?: boolean;
  companies?: { create?: boolean; read?: boolean; update?: boolean; delete?: boolean };
  complexes?: { create?: boolean; read?: boolean; update?: boolean; delete?: boolean };
  floors?: { create?: boolean; read?: boolean; update?: boolean; delete?: boolean };
  units?: { create?: boolean; read?: boolean; update?: boolean; delete?: boolean };
  residents?: { create?: boolean; read?: boolean; update?: boolean; delete?: boolean };
  users?: { create?: boolean; read?: boolean; update?: boolean; delete?: boolean };
  reports?: { read?: boolean };
  dashboard?: { read?: boolean };
  profile?: { read?: boolean; update?: boolean };
  apartment?: { read?: boolean };
  notices?: { read?: boolean };
  maintenance?: { create?: boolean; read?: boolean };
}

export interface IRole {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  permissions: IRolePermissions;
  is_system_role: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}
