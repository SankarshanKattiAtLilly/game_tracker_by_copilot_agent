const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'An error occurred' }));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  // Auth endpoints
  async login(username, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async logout() {
    this.setToken(null);
  }

  // Matches endpoints
  async getMatches() {
    return this.request('/matches');
  }

  async getMatch(id) {
    return this.request(`/matches/${id}`);
  }

  // Betting endpoints
  async placeBet(matchId, team) {
    return this.request(`/matches/${matchId}/bet`, {
      method: 'POST',
      body: JSON.stringify({ team }),
    });
  }

  async removeBet(matchId) {
    return this.request(`/matches/${matchId}/bet`, {
      method: 'DELETE',
    });
  }

  async getBets() {
    return this.request('/bets');
  }

  // Contest endpoints
  async getContests() {
    return this.request('/contests');
  }

  async getContest(contestId) {
    return this.request(`/contests/${contestId}`);
  }

  async getContestMatches(contestId) {
    return this.request(`/contests/${contestId}/matches`);
  }

  async getContestStats(contestId) {
    return this.request(`/contests/${contestId}/stats`);
  }

  // User endpoints
  async getUserStats() {
    return this.request('/users/me/stats');
  }

  // Admin endpoints
  async getAllUsersStats() {
    return this.request('/admin/stats/all');
  }
}

export const apiClient = new ApiClient();
