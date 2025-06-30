// Utilidades reutilizables

/**
 * Clase para manejar alertas
 */
class AlertManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    show(message, type = 'danger', autoHide = true) {
        const alertHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                <i class="bi bi-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        this.container.innerHTML = alertHTML;
        
        if (autoHide) {
            setTimeout(() => {
                this.clear();
            }, CONFIG.TIMEOUTS.ALERT_AUTO_HIDE);
        }
    }

    clear() {
        const alert = this.container.querySelector('.alert');
        if (alert) {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }
    }
}

/**
 * Validador de formularios
 */
class FormValidator {
    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    static validateRequired(value) {
        return value && value.trim().length > 0;
    }

    static validateMinLength(value, minLength) {
        return value && value.length >= minLength;
    }

    static validateForm(formData, rules) {
        const errors = [];

        for (const [field, value] of Object.entries(formData)) {
            const fieldRules = rules[field];
            if (!fieldRules) continue;

            // Validar requerido
            if (fieldRules.required && !this.validateRequired(value)) {
                errors.push(`${fieldRules.label || field} es requerido`);
                continue;
            }

            // Validar email
            if (fieldRules.email && value && !this.validateEmail(value)) {
                errors.push(`${fieldRules.label || field} debe ser un email válido`);
            }

            // Validar longitud mínima
            if (fieldRules.minLength && value && !this.validateMinLength(value, fieldRules.minLength)) {
                errors.push(`${fieldRules.label || field} debe tener al menos ${fieldRules.minLength} caracteres`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

/**
 * Manejador de estados de loading
 */
class LoadingManager {
    constructor(buttonId, textId, spinnerId) {
        this.button = document.getElementById(buttonId);
        this.textElement = document.getElementById(textId);
        this.spinnerElement = document.getElementById(spinnerId);
    }

    setLoading(loading) {
        if (!this.button || !this.textElement || !this.spinnerElement) return;

        this.button.disabled = loading;
        if (loading) {
            this.textElement.classList.add('d-none');
            this.spinnerElement.classList.remove('d-none');
        } else {
            this.textElement.classList.remove('d-none');
            this.spinnerElement.classList.add('d-none');
        }
    }
}

/**
 * Manejador de autenticación
 */
class AuthManager {
    static saveToken(accessToken, tokenType = 'bearer') {
        localStorage.setItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN_TYPE, tokenType);
    }

    static getToken() {
        return localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    }

    static getTokenType() {
        return localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN_TYPE) || 'bearer';
    }

    static removeToken() {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN_TYPE);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
    }

    static isAuthenticated() {
        return !!this.getToken();
    }

    static getAuthHeader() {
        const token = this.getToken();
        const tokenType = this.getTokenType();
        return token ? `${tokenType} ${token}` : null;
    }
}

/**
 * Toggle para mostrar/ocultar contraseña
 */
class PasswordToggle {
    constructor(inputId, toggleId) {
        this.input = document.getElementById(inputId);
        this.toggle = document.getElementById(toggleId);
        this.init();
    }

    init() {
        if (!this.input || !this.toggle) return;

        this.toggle.addEventListener('click', () => {
            const type = this.input.getAttribute('type') === 'password' ? 'text' : 'password';
            this.input.setAttribute('type', type);
            
            const icon = this.toggle.querySelector('i');
            icon.classList.toggle('bi-eye');
            icon.classList.toggle('bi-eye-slash');
        });
    }
}

/**
 * Utilidades diversas
 */
class Utils {
    static formatError(error) {
        if (typeof error === 'string') return error;
        if (error.message) return error.message;
        if (error.detail) return error.detail;
        return 'Ha ocurrido un error inesperado';
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Función global de logout
function logout() {
    AuthManager.removeToken();
    console.log('Sesión cerrada');
    
    // Opcional: redirigir al login
    // window.location.href = '/login.html';
    
    return true;
}

// Hacer las clases disponibles globalmente
window.AlertManager = AlertManager;
window.FormValidator = FormValidator;
window.LoadingManager = LoadingManager;
window.AuthManager = AuthManager;
window.PasswordToggle = PasswordToggle;
window.Utils = Utils;
window.logout = logout;