// API Client Library
const API_BASE = process.env.API_URL || 'http://localhost:5000/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` })
    };
  }

  async request(endpoint, method = 'GET', body = null) {
    const url = `${API_BASE}${endpoint}`;
    const options = { method, headers: this.getHeaders() };
    if (body) options.body = JSON.stringify(body);

    try {
      const response = await fetch(url, options);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'API Error');
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  login(email, password, role) { return this.request('/auth/login', 'POST', { email, password, role }); }
  logout(email) { return this.request('/auth/logout', 'POST', { email }); }
  getPayments() { return this.request('/payments', 'GET'); }
  recordPayment(student, amount, method, reference) { return this.request('/payments', 'POST', { student, amount, method, reference }); }
  sendReminder(email, student, amount) { return this.request('/notifications/send-reminder', 'POST', { email, student, amount }); }
  getNotifications() { return this.request('/notifications', 'GET'); }
  getReportSummary() { return this.request('/reports/summary', 'GET'); }
  downloadCSV() { const url = `${API_BASE}/reports/export-csv`; const link = document.createElement('a'); link.href = url; link.download = 'payments.csv'; link.click(); }
  getAuditLog() { return this.request('/audit-log', 'GET'); }
  healthCheck() { return this.request('/health', 'GET'); }
}

const api = new ApiClient();
