// Script específico para la página de login

/**
 * Clase para manejar el formulario de login
 */
class LoginForm {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.correoInput = document.getElementById('correo');
        this.claveInput = document.getElementById('clave');
        
        // Inicializar componentes
        this.alertManager = new AlertManager('alertContainer');
        this.loadingManager = new LoadingManager('loginBtn', 'loginBtnText', 'loginSpinner');
        this.passwordToggle = new PasswordToggle('clave', 'togglePassword');
        
        // Reglas de validación
        this.validationRules = {
            correo: {
                required: true,
                email: true,
                label: 'Correo electrónico'
            },
            clave: {
                required: true,
                minLength: 1,
                label: 'Contraseña'
            }
        };

        this.init();
    }

    init() {
        if (!this.form) {
            console.error('Formulario de login no encontrado');
            return;
        }

        // Escuchar el evento submit del formulario
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Verificar si ya está autenticado
        this.checkAuthStatus();
    }

    /**
     * Maneja el envío del formulario
     */
    async handleSubmit(event) {
        event.preventDefault();
        
        this.alertManager.clear();
        
        const formData = this.getFormData();
        const validation = this.validateForm(formData);
        
        if (!validation.isValid) {
            this.alertManager.show(validation.errors.join('<br>'));
            return;
        }

        await this.performLogin(formData.correo, formData.clave);
    }

    /**
     * Obtiene los datos del formulario
     */
    getFormData() {
        return {
            correo: this.correoInput.value.trim(),
            clave: this.claveInput.value.trim()
        };
    }

    /**
     * Valida el formulario
     */
    validateForm(formData) {
        return FormValidator.validateForm(formData, this.validationRules);
    }

    /**
     * Realiza el login
     */
    async performLogin(correo, clave) {
        this.loadingManager.setLoading(true);

        try {
            const response = await authApi.login(correo, clave);
            
            if (response.data && response.data.accessToken) {
                this.handleLoginSuccess(response.data);
            } else {
                throw new Error('Respuesta inválida del servidor');
            }

        } catch (error) {
            this.handleLoginError(error);
        } finally {
            this.loadingManager.setLoading(false);
        }
    }

    /**
     * Maneja el login exitoso
     */
    handleLoginSuccess(data) {
        // Guardar token
        AuthManager.saveToken(data.accessToken, data.tokenType);
        
        // Mostrar mensaje de éxito
        this.alertManager.show('¡Login exitoso! Redirigiendo...', 'success');
        
        // Limpiar formulario
        this.form.reset();
        
        // Callback personalizado si existe
        if (typeof window.onLoginSuccess === 'function') {
            window.onLoginSuccess(data);
        }
        
        // Redirigir después de un delay
        setTimeout(() => {
            this.redirectAfterLogin();
        }, CONFIG.TIMEOUTS.REDIRECT_DELAY);
    }

    /**
     * Maneja errores de login
     */
    handleLoginError(error) {
        let errorMessage = 'Error al iniciar sesión. Por favor, intenta nuevamente.';
        
        const errorText = Utils.formatError(error);
        
        if (errorText.includes('No existe un usuario')) {
            errorMessage = 'No existe un usuario con ese correo electrónico.';
        } else if (errorText.includes('Credenciales inválidas')) {
            errorMessage = 'Credenciales inválidas. Verifica tu correo y contraseña.';
        } else if (errorText.includes('fetch')) {
            errorMessage = 'Error de conexión. Verifica que el servidor esté funcionando.';
        } else if (errorText.includes('NetworkError') || errorText.includes('Failed to fetch')) {
            errorMessage = 'Error de red. Verifica tu conexión a internet.';
        }
        
        this.alertManager.show(errorMessage);
        
        // Callback personalizado si existe
        if (typeof window.onLoginError === 'function') {
            window.onLoginError(error);
        }
    }

    /**
     * Verifica el estado de autenticación al cargar la página
     */
    checkAuthStatus() {
        if (AuthManager.isAuthenticated()) {
            console.log('Usuario ya autenticado');
            
            // Callback personalizado si existe
            if (typeof window.onAlreadyAuthenticated === 'function') {
                window.onAlreadyAuthenticated();
            } else {
                // Comportamiento por defecto: mostrar mensaje
                this.alertManager.show('Ya tienes una sesión activa.', 'info');
            }
        }
    }

    /**
     * Redirige después del login exitoso
     */
    redirectAfterLogin() {
        // Callback personalizado si existe
        if (typeof window.onRedirectAfterLogin === 'function') {
            window.onRedirectAfterLogin();
        } else {
            // Comportamiento por defecto
            console.log('Login exitoso! Token guardado:', AuthManager.getToken());
            alert('Login exitoso! Token guardado en localStorage');
            
            // Descomenta para redirigir a dashboard
            // window.location.href = '/dashboard.html';
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    window.loginForm = new LoginForm();
});

