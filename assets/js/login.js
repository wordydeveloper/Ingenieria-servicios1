class LoginForm {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.correoInput = document.getElementById('correo');
        this.claveInput = document.getElementById('clave');
        
        this.alertManager = new AlertManager('alertContainer');
        this.loadingManager = new LoadingManager('loginBtn', 'loginBtnText', 'loginSpinner');
        this.passwordToggle = new PasswordToggle('clave', 'togglePassword');
        
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

        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.checkAuthStatus();
    }

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

    getFormData() {
        return {
            correo: this.correoInput.value.trim(),
            clave: this.claveInput.value.trim()
        };
    }

    validateForm(formData) {
        return FormValidator.validateForm(formData, this.validationRules);
    }

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
handleLoginSuccess(data) {
    const tokenType = data.tokenType || "Bearer";
    const accessToken = data.accessToken;

    // Guarda el token en AuthManager (si ya lo necesitas ahí)
    AuthManager.saveToken(accessToken, tokenType);

    // Guarda también en localStorage con la clave que usas luego
    localStorage.setItem("access_token", accessToken);

    this.alertManager.show('¡Login exitoso! Redirigiendo...', 'success');
    this.form.reset();

    if (typeof window.onLoginSuccess === 'function') {
        window.onLoginSuccess(data);
    }

    setTimeout(() => {
        this.redirectAfterLogin();
    }, CONFIG.TIMEOUTS.REDIRECT_DELAY);
}


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

        if (typeof window.onLoginError === 'function') {
            window.onLoginError(error);
        }
    }
checkAuthStatus() {
    const token = localStorage.getItem("access_token");
    
    if (token) {
        console.log('Usuario ya autenticado');
        if (typeof window.onAlreadyAuthenticated === 'function') {
            window.onAlreadyAuthenticated();
        } else {
            this.alertManager.show('Ya tienes una sesión activa.', 'info');
        }
    }
}


    redirectAfterLogin() {
        window.location.href = "eventos.html";
    }
}

document.addEventListener('DOMContentLoaded', function () {
    window.loginForm = new LoginForm();
});
