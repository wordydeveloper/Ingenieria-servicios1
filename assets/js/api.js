// Cliente API reutilizable

/**
 * Cliente HTTP para comunicarse con la API
 */
class ApiClient {
    constructor(baseURL = CONFIG.API_BASE_URL) {
        this.baseURL = baseURL;
    }

    /**
     * Método genérico para hacer requests HTTP
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Agregar token si está disponible y no se especifica lo contrario
        if (options.includeAuth !== false) {
            const authHeader = AuthManager.getAuthHeader();
            if (authHeader) {
                config.headers['Authorization'] = authHeader;
            }
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    /**
     * Método GET
     */
    async get(endpoint, options = {}) {
        return this.request(endpoint, {
            method: 'GET',
            ...options
        });
    }

    /**
     * Método POST
     */
    async post(endpoint, data = null, options = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : null,
            ...options
        });
    }

    /**
     * Método PUT
     */
    async put(endpoint, data = null, options = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : null,
            ...options
        });
    }

    /**
     * Método DELETE
     */
    async delete(endpoint, options = {}) {
        return this.request(endpoint, {
            method: 'DELETE',
            ...options
        });
    }
}

/**
 * Cliente específico para endpoints de autenticación
 */
class AuthApiClient extends ApiClient {
    /**
     * Login de usuario
     */
    async login(correo, clave) {
        return this.post(CONFIG.ENDPOINTS.LOGIN, {
            correo,
            clave
        }, { includeAuth: false });
    }

    /**
     * Registro de usuario
     */
    async register(nombre, correo, clave) {
        return this.post(CONFIG.ENDPOINTS.REGISTER, {
            nombre,
            correo,
            clave
        }, { includeAuth: false });
    }

    /**
     * Verificar token (ejemplo de endpoint protegido)
     */
    async verifyToken() {
        // Este endpoint no existe en tu API actual, pero es un ejemplo
        // de cómo harías un request autenticado
        return this.get('/internal/auth/verify');
    }

    /**
     * Obtener perfil de usuario (ejemplo)
     */
    async getProfile() {
        // Ejemplo de endpoint protegido que requiere autenticación
        return this.get('/internal/auth/profile');
    }

    /**
     * Logout (ejemplo)
     */
    async logout() {
        // Ejemplo de endpoint de logout
        return this.post('/internal/auth/logout');
    }
}

/**
 * Instancia global del cliente API
 */
const apiClient = new ApiClient();
const authApi = new AuthApiClient();

// Hacer disponibles globalmente
window.ApiClient = ApiClient;
window.AuthApiClient = AuthApiClient;
window.apiClient = apiClient;
window.authApi = authApi;