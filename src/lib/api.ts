const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://144.76.153.210:5021';
import { WA_Organization } from '@/types';

export interface DashboardData {
  status: string;
  data: {
    proxyStatus: {
      isWorking: boolean;
      lastCheck: string;
      message: string;
    };
    stats: {
      readySessions: number;
      notReadySessions: number;
      totalClients: number;
      totalSentMessages: number;
    };
    lastClients: Array<{
      name: string;
      email: string | null;
      registeredAt: string;
    }>;
    servers: Array<{
      serverCode: string;
      type: string;
      ip: string;
      port: number;
      status: string;
      maxSessions: number;
      connectedSessions: number;
    }>;
    lastSessions: Array<{
      name: string;
      clientName: string;
      status: string;
      registeredAt: string;
    }>;
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  const response = await fetch(`${BASE_URL}/ESAPI/DASHBOARD/get_data`);
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data');
  }
  return response.json();
}

export interface CustomersResponse {
  status: boolean;
  message: string;
  data: {
    customers: Array<{
      CISEQ: number;
      CIORG: string;
      CINA: string | null;
      CINE: string | null;
      CIN3: any;
      CIDE: any;
      CIPH1: string | null;
      CIPH2: any;
      CIPH3: any;
      CICO: string;
      CIADD: string | null;
      CIURL: any;
      CIEM: any;
      CIMAN: string | null;
      CILAN: string;
      CIID: string;
      JTID: number;
      CITYP: number;
      CIST: number;
      CINU: number;
      CIFD: string | null;
      CITD: string | null;
      CIDLM: number;
      CITK: string;
      CIIP: string;
      CIPO: string;
      CIAF1: any;
      CIAF2: any;
      CIAF3: any;
      CIAF4: any;
      CIAF6: any;
      CIAF7: any;
      CIAF8: any;
      CIAF9: any;
      CIAF10: any;
      SUID: string | null;
      DATEI: string | null;
      DEVI: string | null;
      SUCH: any;
      DATEU: string | null;
      DEVU: any;
      GUID: string | null;
      RES: any;
    }>;
  };
}

export async function getCustomers(): Promise<CustomersResponse> {
  const response = await fetch(`${BASE_URL}/ESAPI/EWA/V3/es/get_all_cus`);

  if (!response.ok) {
    throw new Error('Failed to fetch customers');
  }
  return response.json();
}

export interface ServersResponse {
  status: boolean;
  message: string;
  data: {
    servers: Array<{
      SISEQ: number;
      SISN: string;
      SITY: string;
      SIIP: string;
      SIPO: number;
      SIPT: string;
      SIST: number;
      DEFN: number;
      SIRM: string;
      SIRRW: number;
      SIRT: string;
      SIRP: string;
      SIMS: number;
      SIDE: string;
      GUID: string;
      [key: string]: any;
    }>;
  };
}

export async function getServers(): Promise<ServersResponse> {
  const response = await fetch(`${BASE_URL}/ESAPI/SERVER/all`);
  if (!response.ok) {
    throw new Error('Failed to fetch servers');
  }
  return response.json();
}

// --- Customer Management ---

export interface AddCustomerRequest {
  name: string;
  name2?: string;
  name3?: string;
  detail?: string;
  phone: string;
  phone2?: string;
  phone3?: string;
  email: string;
  address: string;
  webSite?: string;
  country: string;
  manager?: string;
  lan: string;
  ciid?: string;
  jtid?: number;
  suTyp: number;
  cinu: number;
  cifd: string;
  citd: string;
}

export interface AddCustomerResponse {
  success: boolean;
  message: string;
  data: {
    org: string;
    token: string;
    ip: string;
    port: string;
    orgid: number;
  };
  code: number;
}

export interface GenericResponse {
  success: boolean;
  message: string;
  data: any;
  code: number;
}

export async function addCustomer(data: AddCustomerRequest, token: string): Promise<AddCustomerResponse> {
  console.log('Add Customer Request:', data);
  const response = await fetch(`${BASE_URL}/ESAPI/EWA/V3/es/add_cus`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  console.log('Add Customer Response:', result);

  if (!response.ok) {
    console.log(`add customer error: ${response.statusText}`, result);
    throw new Error(result.message || 'Failed to add customer');
  }
  return result;
}

export async function deleteCustomer(org: string, token: string): Promise<GenericResponse> {
  const response = await fetch(`${BASE_URL}/ESAPI/EWA/V3/admin/del_cus`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ org }),
  });
  if (!response.ok) {
    throw new Error('Failed to delete customer');
  }
  return response.json();
}

export interface UpdateCustomerRequest {
  name?: string;
  phone?: string;
  address?: string;
  cinu?: number;
  citd?: string;
  [key: string]: any;
}

export async function updateCustomer(org: string, data: UpdateCustomerRequest, token: string): Promise<GenericResponse> {
  console.log('Update Customer Request:', { org, data });
  const response = await fetch(`${BASE_URL}/ESAPI/EWA/V2/es/upd_cus`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ org, data }),
  });

  const result = await response.json();
  console.log('Update Customer Response:', result);

  if (!response.ok) {
    throw new Error(result.message || 'Failed to update customer');
  }
  return result;
}

// --- User Management ---

export interface AddUserRequest {
  org: string;
  name: string;
  phone: string;
  pass: string;
  detail: string;
  lan: string;
}

export interface AddUserResponse {
  success: boolean;
  message: string;
  data: {
    org: string;
    token: string;
    orgid: number;
    user: string;
    pass: string;
    ip: string;
    port: string;
    id: number;
  };
  code: number;
}

export interface UpdateUserRequest {
  name?: string;
  detail?: string;
  phone?: string;
}

export async function addUser(data: AddUserRequest, token: string): Promise<AddUserResponse> {
  const response = await fetch(`${BASE_URL}/ESAPI/EWA/V3/admin/add_usr`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to add user');
  }
  return response.json();
}

export async function deleteUser(user: string, token: string): Promise<GenericResponse> {
  const response = await fetch(`${BASE_URL}/ESAPI/EWA/V3/admin/del_usr`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user }),
  });
  if (!response.ok) {
    throw new Error('Failed to delete user');
  }
  return response.json();
}

export async function updateUser(user: string, data: UpdateUserRequest, token: string): Promise<GenericResponse> {
  const response = await fetch(`${BASE_URL}/ESAPI/EWA/V3/admin/upd_usr`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user, data }),
  });
  if (!response.ok) {
    throw new Error('Failed to update user');
  }
  return response.json();
}

export async function getAllUsers(): Promise<UsersResponse> {
  const response = await fetch(`${BASE_URL}/ESAPI/EWA/V3/es/get_all_usr`);
  if (!response.ok) {
    throw new Error('Failed to fetch all users');
  }
  return response.json();
}

export interface UsersResponse {
  status: boolean;
  message: string;
  data: {
    Users: Array<{
      SOMSEQ: number;
      CIORG: string;
      SOMID: number;
      USER: string;
      PASS: string;
      PASS2: string;
      SOMPH: string | null;
      SOMNA: string | null;
      STMID: string;
      SOMTY: number;
      CITYP: number;
      CIST: number;
      SOMFD: string | null;
      SOMTD: string | null;
      SOMDLM: number;
      SOMST: string;
      SOMCST: string;
      SOMINI: number;
      SOMDE: string | null;
      SOMQR: string | null;
      SOMQR2: string | null;
      SOMQRN: number;
      SOMCO: string;
      SOMBT: string | null;
      CIID: string;
      JTID: number;
      BIID: number;
      SYID: number;
      SOMVR: string | null;
      SOMDSN: string | null;
      WAPHO: string | null;
      WANAM: string | null;
      WAPLA: string | null;
      WAOTH: string | null;
      SOMLAN: string;
      CITK: string;
      SOMSST: number;
      SOMBR: number;
      SOMAF1: any;
      SOMAF2: any;
      SOMAF3: any;
      SOMAF4: any;
      SOMAF5: any;
      SUID: string | null;
      DATEI: string | null;
      DEVI: string | null;
      SUCH: any;
      DATEU: string | null;
      DEVU: any;
      GUID: string | null;
      RES: any;
      SOMSVR: string;
      SOMRIU: string;
      SISN: string;
    }>;
  };
}
