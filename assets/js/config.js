// Configuración global de la aplicación
const CONFIG = {
    API_BASE_URL: 'http://127.0.0.1:8000',
    ENDPOINTS: {
        LOGIN: '/internal/auth/login',
        REGISTER: '/internal/auth/registrar'
    },
    STORAGE_KEYS: {
        ACCESS_TOKEN: 'accessToken',
        TOKEN_TYPE: 'tokenType',
        USER_DATA: 'userData'
    },
    TIMEOUTS: {
        ALERT_AUTO_HIDE: 5000,
        REDIRECT_DELAY: 2000
    },
    VALIDATION: {
        PASSWORD_MIN_LENGTH: 6,
        NAME_MIN_LENGTH: 2,
        EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    }
};

// Hacer CONFIG disponible globalmente
window.CONFIG = CONFIG;