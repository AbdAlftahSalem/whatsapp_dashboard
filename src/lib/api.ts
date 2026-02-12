const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://144.76.153.210:5021";
import { WA_Organization } from "@/types";

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
      totalConnectedSessions: number;
      subServers: Array<{
        type: string;
        ip: string;
        port: number;
        status: string;
        maxSessions: number;
      }>;
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
    throw new Error("Failed to fetch dashboard data");
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
    throw new Error("Failed to fetch customers");
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
    throw new Error("Failed to fetch servers");
  }
  return response.json();
}

export interface AddServerRequest {
  SISN?: string;        // رمز الخادم (Server Name/Code)
  SITY?: string;        // نوع الخدمة (Server Type)
  SIIP: string;         // عنوان IP (إجباري)
  SIPO: number;         // المنفذ (Port - إجباري)
  SIPT?: string;        // البروتوكول (HTTP, HTTPS, etc.)
  SIST?: number;        // حالة الخدمة
  DEFN?: number;        // السيرفر الافتراضي
  SIRM?: string;        // SERVICE_RUN_MODE
  SIRRW?: number;       // هل يتم Rewrite
  SIRT?: string;        // نوع التوجيه
  SIRP?: string;        // مسار التوجيه
  SIMS?: number;        // الحد الأقصى للجلسات
  SIAUY?: number;       // هل الخدمة تحتاج AUTH
  SIAUT?: string;       // نوع المصادقة
  SIAUC?: any;          // إعدادات المصادقة (JSON)
  SIWE?: number;        // وزن السيرفر
  SITMS?: number;       // مهلة الاتصال (ms)
  SIMC?: number;        // الحد الأقصى للاتصالات المتزامنة
  SIDE?: string;        // تفاصيل
  SIAF1?: string;       // حقل إضافي 1
  SIAF2?: string;       // حقل إضافي 2
  [key: string]: any;
}

export interface AddServerResponse {
  status: boolean;
  message: string;
  data?: {
    SISEQ: number;
    [key: string]: any;
  };
}

export async function addServer(serverData: AddServerRequest, token?: string): Promise<AddServerResponse> {
  const response = await fetch(`${BASE_URL}/ESAPI/SERVER/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    body: JSON.stringify(serverData)
  });
  if (!response.ok) {
    throw new Error("Failed to add server");
  }
  return response.json();
}

export interface DeleteServerResponse {
  status: boolean;
  message: string;
}

export async function deleteServer(serverId: number, token?: string): Promise<DeleteServerResponse> {
  const response = await fetch(`${BASE_URL}/ESAPI/SERVER/delete/${serverId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  });
  if (!response.ok) {
    throw new Error("Failed to delete server");
  }
  return response.json();
}

export interface UpdateServerRequest {
  SISN?: string;        // رمز الخادم (Server Name/Code)
  SITY?: string;        // نوع الخدمة (Server Type)
  SIIP?: string;        // عنوان IP
  SIPO?: number;        // المنفذ (Port)
  SIPT?: string;        // البروتوكول (HTTP, HTTPS, etc.)
  SIST?: number;        // حالة الخدمة
  DEFN?: number;        // السيرفر الافتراضي
  SIRM?: string;        // SERVICE_RUN_MODE
  SIRRW?: number;       // هل يتم Rewrite
  SIRT?: string;        // نوع التوجيه
  SIRP?: string;        // مسار التوجيه
  SIMS?: number;        // الحد الأقصى للجلسات
  SIAUY?: number;       // هل الخدمة تحتاج AUTH
  SIAUT?: string;       // نوع المصادقة
  SIAUC?: any;          // إعدادات المصادقة (JSON)
  SIWE?: number;        // وزن السيرفر
  SITMS?: number;       // مهلة الاتصال (ms)
  SIMC?: number;        // الحد الأقصى للاتصالات المتزامنة
  SIDE?: string;        // تفاصيل
  SIAF1?: string;       // حقل إضافي 1
  SIAF2?: string;       // حقل إضافي 2
  [key: string]: any;
}

export interface UpdateServerResponse {
  status: boolean;
  message: string;
  data?: {
    SISEQ: number;
    [key: string]: any;
  };
}

export async function updateServer(serverId: number, serverData: UpdateServerRequest, token?: string): Promise<UpdateServerResponse> {
  const response = await fetch(`${BASE_URL}/ESAPI/SERVER/update/${serverId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    body: JSON.stringify(serverData)
  });
  if (!response.ok) {
    throw new Error("Failed to update server");
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

export async function addCustomer(
  data: AddCustomerRequest,
  token: string,
): Promise<AddCustomerResponse> {
  console.log("Add Customer Request:", data);
  const response = await fetch(`${BASE_URL}/ESAPI/EWA/V3/es/add_cus`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  console.log("Add Customer Response:", result);

  if (!response.ok) {
    console.log(`add customer error: ${response.statusText}`, result);
    throw new Error(result.message || "Failed to add customer");
  }
  return result;
}

export async function deleteCustomer(
  org: string,
  token: string,
): Promise<GenericResponse> {
  const response = await fetch(`${BASE_URL}/ESAPI/EWA/V2/admin/del_cus`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ org }),
  });
  if (!response.ok) {
    throw new Error("Failed to delete customer");
  }
  return response.json();
}

export interface UpdateCustomerRequest {
  CINA?: string;
  CINE?: string;
  CIN3?: string;
  CIDE?: string;
  CIPH1?: string;
  CIPH2?: string;
  CIPH3?: string;
  CICO?: string;
  CIADD?: string;
  CIURL?: string;
  CIEM?: string;
  CIMAN?: string;
  CILAN?: string;
  CIID?: string;
  JTID?: number;
  CITYP?: number;
  CIST?: number;
  CINU?: number;
  CIFD?: string;
  CITD?: string;
  CIDLM?: number;
  CIAF1?: string;
  CIAF2?: string;
  CIAF3?: string;
  CIAF4?: string;
  CIAF5?: string;
  CIAF6?: string;
  CIAF7?: string;
  CIAF8?: string;
  CIAF9?: string;
  CIAF10?: string;
  [key: string]: any;
}

export async function updateCustomer(
  org: string,
  data: UpdateCustomerRequest,
  token: string,
): Promise<GenericResponse> {
  console.log("Update Customer Request:", { org, data });
  const response = await fetch(`${BASE_URL}/ESAPI/EWA/V2/es/upd_cus`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ org, data }),
  });

  const result = await response.json();
  console.log("Update Customer Response:", result);

  if (!response.ok) {
    throw new Error(result.message || "Failed to update customer");
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

export async function addUser(
  data: AddUserRequest,
  token: string,
): Promise<AddUserResponse> {
  const response = await fetch(`${BASE_URL}/ESAPI/EWA/V3/admin/add_usr`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to add user");
  }
  return response.json();
}

export async function deleteUser(
  user: string,
  token: string,
): Promise<GenericResponse> {
  const response = await fetch(`${BASE_URL}/ESAPI/EWA/V3/admin/del_usr`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user }),
  });
  if (!response.ok) {
    throw new Error("Failed to delete user");
  }
  return response.json();
}

export async function updateUser(
  user: string,
  data: UpdateUserRequest,
  token: string,
): Promise<GenericResponse> {
  const response = await fetch(`${BASE_URL}/ESAPI/EWA/V3/admin/upd_usr`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user, data }),
  });
  if (!response.ok) {
    throw new Error("Failed to update user");
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

export async function getAllUsers(): Promise<UsersResponse> {
  const response = await fetch(`${BASE_URL}/ESAPI/EWA/V3/es/get_all_usr`);
  if (!response.ok) {
    throw new Error("Failed to fetch all users");
  }
  return response.json();
}

export interface FullUsersResponse {
  status: boolean;
  message: string;
  data: {
    data: Array<{
      session_id: string;
      user_code: number;
      customer_number: number;
      customer_name: string;
      SOMNA: string | null;
      server_name: string;
      status: string;
      last_message_date: string;
      daily_limit: number;
      total_messages: number;
      total_text: number;
      total_attachments: number;
      today_messages: number;
      today_text: number;
      today_attachments: number;
      server_code: string;
      user_name: string;
      [key: string]: any;
    }>;
  };
}

export async function getAllUsersFull(): Promise<FullUsersResponse> {
  const response = await fetch(`${BASE_URL}/ESAPI/EWA/V3/es/get_all_usr_full`);
  if (!response.ok) {
    throw new Error("Failed to fetch full users list");
  }
  const data = await response.json();
  console.log("Get All Devices Full Response:", data);
  return data;
}

export interface QrCodeResponse {
  status: boolean;
  message: string;
  data: any;
}

export async function getQrCode(user: string): Promise<QrCodeResponse> {
  console.log("Fetching QR Code for user:", user);
  const response = await fetch(`${BASE_URL}/ESAPI/EWA/V3/auth/get_qr`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const responseText = await response.text();
  console.log("QR Code Raw Response:", responseText);

  if (!response.ok) {
    console.error("QR Code Error Response:", responseText);
    throw new Error(
      `Failed to fetch QR code: ${response.status} ${response.statusText} - ${responseText}`,
    );
  }

  try {
    const data = JSON.parse(responseText);
    console.log("QR Code Parsed Data:", data);
    return data;
  } catch (e) {
    console.error("Failed to parse QR code JSON:", e);
    throw new Error("Invalid JSON response from server");
  }
}

export interface RestartSessionResponse {
  status: boolean;
  message: string;
  data: any;
}

export async function restartSession(
  user: string,
): Promise<RestartSessionResponse> {
  console.log("Restarting session for user:", user);
  const response = await fetch(`${BASE_URL}/ESAPI/EWA/V2/auth/re_usr`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user }),
  });

  const responseText = await response.text();
  console.log("Restart Session Raw Response:", responseText);

  if (!response.ok) {
    throw new Error(
      `Failed to restart session: ${response.status} ${response.statusText}`,
    );
  }

  try {
    return JSON.parse(responseText);
  } catch (e) {
    console.error("Failed to parse restart session JSON:", e);
    throw new Error("Invalid JSON response from server");
  }
}

export async function stopSession(user: string): Promise<GenericResponse> {
  console.log("Stopping session for user:", user);
  const response = await fetch(`${BASE_URL}/ESAPI/EWA/V3/auth/stop_usr`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user }),
  });

  const responseText = await response.text();
  console.log("Stop Session Raw Response:", responseText);

  if (!response.ok) {
    throw new Error(
      `Failed to stop session: ${response.status} ${response.statusText}`,
    );
  }

  try {
    return JSON.parse(responseText);
  } catch (e) {
    console.error("Failed to parse stop session JSON:", e);
    throw new Error("Invalid JSON response from server");
  }
}

// --- Logs Management ---

export interface LogEntry {
  SASEQ: number; // Primary Key / Sequence
  SATY: string; // Alert Type (I-INFO, E-ERROR, W-WARNING, C-CRITICAL...)
  SATOP: string; // TOPIC (auth,chat,contact,account,admin,group,es,backup,maintenace,control,other)
  SAMSG: string; // MESSAGE
  CIORG: string | null; // Organization
  USER: string | null; // User
  SARO: string | null; // ROUTE
  SAFN: string | null; // function_name
  SAPR: number; // Priority (1 high)
  SAPA: {
    client_ip?: string;
    server_ip?: string;
    request_body?: any;
    [key: string]: any;
  } | null; // payload JSONB
  SAME: any; // Metadata JSONB
  SATA: string | null; // target
  SACT: string; // channel_type (WHATSAPP, TELEGRAM, EMAIL)
  SATC: number; // try_count
  SAMT: number; // max_try
  SALT: string | null; // last_try_at
  SARC: string | null; // response_code
  SARM: string | null; // response_message
  SAER: string | null; // error
  SAST: number; // STATUS (1-SENT, 2-NEW, 3-FAILED, 4-CANCELLED, 5 ACTIVE)
  DATEI: string; // Created Date
  DEVI: string | null;
  SUID: string | null;
  SUCH: string | null;
  DATEU: string | null;
  DEVU: string | null;
  GUID: string | null;
  RES: any;
  [key: string]: any;
}

export interface LogsResponse {
  status: string;
  data: LogEntry[];
}

export async function getLogs(
  page = 1,
  limit = 20,
  filters?: any,
): Promise<LogsResponse> {
  const response = await fetch(`${BASE_URL}/ESAPI/DASHBOARD/get_sys_alerts`);
  if (!response.ok) {
    throw new Error("Failed to fetch system logs");
  }
  return response.json();
}

export async function backupDatabase(): Promise<{
  status: boolean;
  message: string;
  fileName?: string;
}> {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        status: true,
        message: "Database backup completed successfully",
        fileName: `backup_${new Date().toISOString().replace(/[:T]/g, "-").split(".")[0]}.sql`,
      });
    }, 3000);
  });
}
