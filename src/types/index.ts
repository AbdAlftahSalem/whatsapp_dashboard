export interface WA_Device {
  id: number;
  user: string;
  name: string;
  phone: string;
  connectStatue: 'authenticated' | 'close' | 'open' | 'connecting';
  active: boolean;
  userActive: boolean;
  messageSuccess: number;
  messageSendNo: number;
  createAt: string;
  orgId?: number;
  orgName?: string;
}

export interface WA_Organization {
  id: number;
  org: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  address: string;
  active: boolean;
  deviceNumber: number;
  endDate?: string;
  createdAt?: string;
}

export interface AdminUser {
  id: number;
  name: string;
  token: string;
}

export interface DashboardStats {
  totalOrganizations: number;
  activeOrganizations: number;
  totalDevices: number;
  connectedDevices: number;
  totalMessages: number;
  successRate: number;
}
