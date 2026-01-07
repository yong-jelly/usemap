interface User {
  login_id: string;
  level: string;
  about: string;
}

export class AuthStore {
  user = $state<User | null>(JSON.parse(localStorage.getItem('auth_user') || 'null'));
  token = $state<string | null>(localStorage.getItem('auth_token'));

  
    setAuth(user: User, token: string) {
      this.user = user;
      this.token = token;
      console.log('setAuth:', user, token);
      localStorage.setItem('auth_user', JSON.stringify(user));
      localStorage.setItem('auth_token', token);
    }
  
    logout() {
      this.user = null;
      this.token = null;
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_token');
    }
  
    isAuthenticated() {
      return !!this.token;
    }

    getToken() {
      return this.token;
    }

    getUser() {
      return this.user;
    }
  }
  
  export const authStore = new AuthStore();
  