// Script específico para la página de registro

/**
 * Clase para manejar el formulario de registro
 */
class RegisterForm {
    constructor() {
        this.form = document.getElementById('registerForm');
        this.nombreInput = document.getElementById('nombre');
        this.correoInput = document.getElementById('correo');
        this.claveInput = document.getElementById('clave');
        this.confirmarClaveInput = document.getElementById('confirmarClave');
        
        // Inicializar componentes
        this.alertManager = new AlertManager('alertContainer');
        this.loadingManager = new LoadingManager('registerBtn', 'registerBtnText', 'registerSpinner');
        this.passwordToggle = new PasswordToggle('clave', 'togglePassword');
        this.confirmPasswordToggle = new PasswordToggle('confirmarClave', 'toggleConfirmPassword');
        
        // Reglas de validación
        this.validationRules = {
            nombre: {
                required: true,
                minLength: 2,
                label: 'Nombre completo'
            },
            correo: {
                required: true,
                email: true,
                label: 'Correo electrónico'
            },
            clave: {
                required: true,
                minLength: 6,
                label: 'Contraseña'
            },
            confirmarClave: {
                required: true,
                minLength: 6,
                label: 'Confirmar contraseña'
            }
        };

        this.init();
    }

    init() {
        if (!this.form) {
            console.error('Formulario de registro no encontrado');
            return;
        }

        // Escuchar el evento submit del formulario
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Validación en tiempo real para confirmar contraseña
        this.confirmarClaveInput.addEventListener('blur', () => this.validatePasswordMatch());
        this.claveInput.addEventListener('input', () => this.clearPasswordMismatchError());
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

        await this.performRegister(formData);
    }

    /**
     * Obtiene los datos del formulario
     */
    getFormData() {
        return {
            nombre: this.nombreInput.value.trim(),
            correo: this.correoInput.value.trim(),
            clave: this.claveInput.value.trim(),
            confirmarClave: this.confirmarClaveInput.value.trim()
        };
    }

    /**
     * Valida el formulario
     */
    validateForm(formData) {
        const validation = FormValidator.validateForm(formData, this.validationRules);
        
        // Validación adicional: contraseñas coinciden
        if (formData.clave !== formData.confirmarClave) {
            validation.errors.push('Las contraseñas no coinciden');
            validation.isValid = false;
        }

        return validation;
    }

    /**
     * Valida que las contraseñas coincidan en tiempo real
     */
    validatePasswordMatch() {
        const clave = this.claveInput.value;
        const confirmarClave = this.confirmarClaveInput.value;
        
        if (confirmarClave && clave !== confirmarClave) {
            this.confirmarClaveInput.classList.add('is-invalid');
            this.showPasswordMismatchFeedback();
        } else {
            this.confirmarClaveInput.classList.remove('is-invalid');
            this.hidePasswordMismatchFeedback();
        }
    }

    /**
     * Limpia el error de contraseñas no coinciden cuando se modifica la contraseña
     */
    clearPasswordMismatchError() {
        this.confirmarClaveInput.classList.remove('is-invalid');
        this.hidePasswordMismatchFeedback();
    }

    /**
     * Muestra feedback de contraseñas no coinciden
     */
    showPasswordMismatchFeedback() {
        let feedback = document.querySelector('#confirmarClave + .invalid-feedback');
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            this.confirmarClaveInput.parentNode.appendChild(feedback);
        }
        feedback.textContent = 'Las contraseñas no coinciden';
    }

    /**
     * Oculta feedback de contraseñas no coinciden
     */
    hidePasswordMismatchFeedback() {
        const feedback = document.querySelector('#confirmarClave + .invalid-feedback');
        if (feedback) {
            feedback.remove();
        }
    }

    /**
     * Realiza el registro
     */
    async performRegister(formData) {
        this.loadingManager.setLoading(true);

        try {
            const response = await authApi.register(
                formData.nombre,
                formData.correo,
                formData.clave
            );
            
            if (response.data) {
                this.handleRegisterSuccess(response.data);
            } else {
                throw new Error('Respuesta inválida del servidor');
            }

        } catch (error) {
            this.handleRegisterError(error);
        } finally {
            this.loadingManager.setLoading(false);
        }
    }

    /**
     * Maneja el registro exitoso
     */
    handleRegisterSuccess(data) {
        // Mostrar mensaje de éxito
        this.alertManager.show(
            '¡Cuenta creada exitosamente! Redirigiendo al login...', 
            'success'
        );
        
        // Limpiar formulario
        this.form.reset();
        
        // Callback personalizado si existe
        if (typeof window.onRegisterSuccess === 'function') {
            window.onRegisterSuccess(data);
        }
        
        // Redirigir al login después de un delay
        setTimeout(() => {
            this.redirectToLogin();
        }, CONFIG.TIMEOUTS.REDIRECT_DELAY);
    }

    /**
     * Maneja errores de registro
     */
    handleRegisterError(error) {
        let errorMessage = 'Error al crear la cuenta. Por favor, intenta nuevamente.';
        
        const errorText = Utils.formatError(error);
        
        if (errorText.includes('El correo ya se encuentra registrado')) {
            errorMessage = 'Este correo electrónico ya está registrado. Usa otro correo o inicia sesión.';
        } else if (errorText.includes('fetch')) {
            errorMessage = 'Error de conexión. Verifica que el servidor esté funcionando.';
        } else if (errorText.includes('NetworkError') || errorText.includes('Failed to fetch')) {
            errorMessage = 'Error de red. Verifica tu conexión a internet.';
        } else if (errorText.includes('validation')) {
            errorMessage = 'Los datos ingresados no son válidos. Verifica la información.';
        }
        
        this.alertManager.show(errorMessage);
        
        // Callback personalizado si existe
        if (typeof window.onRegisterError === 'function') {
            window.onRegisterError(error);
        }
    }

    /**
     * Redirige al login después del registro exitoso
     */
    redirectToLogin() {
        // Callback personalizado si existe
        if (typeof window.onRedirectAfterRegister === 'function') {
            window.onRedirectAfterRegister();
        } else {
            // Comportamiento por defecto: redirigir al login
            window.location.href = 'index.html';
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    window.registerForm = new RegisterForm();
});