-- Script para corregir inconsistencias en la base de datos

-- 1. Verificar y corregir la tabla estudiante si falta algún campo
ALTER TABLE estudiante 
ADD COLUMN IF NOT EXISTS telefono varchar(20) NULL,
ADD COLUMN IF NOT EXISTS cedula varchar(20) NULL;

-- 2. Actualizar constraint de estados de estudiante para incluir todos los estados
ALTER TABLE estudiante 
DROP CONSTRAINT IF EXISTS estudiante_estado_ck;

ALTER TABLE estudiante 
ADD CONSTRAINT estudiante_estado_ck 
CHECK(estado in ('REGISTRADO', 'PENDIENTE_DOCUMENTO', 'PENDIENTE_RESPUESTA', 'ACEPTADO', 'RECHAZADO', 'ACTIVO', 'GRADUADO'));

-- 3. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_estudiante_estado ON estudiante(estado);
CREATE INDEX IF NOT EXISTS idx_estudiante_correo ON estudiante(correo);
CREATE INDEX IF NOT EXISTS idx_materia_codigo ON materia(codigo);
CREATE INDEX IF NOT EXISTS idx_programa_academico_estado ON programa_academico(estado);

-- 4. Insertar datos de prueba para roles si no existen
INSERT INTO rol (nombre, estado) 
VALUES 
    ('Administrador', 'AC'),
    ('Usuario', 'AC'),
    ('Cliente', 'AC')
ON CONFLICT DO NOTHING;

-- 5. Insertar un usuario administrador de prueba si no existe
INSERT INTO usuario (nombre, correo, clave, estado, rol_id)
SELECT 'Administrador Sistema', 'admin@itla.edu.do', '$2b$10$hash_aqui', 'AC', r.rol_id
FROM rol r 
WHERE r.nombre = 'Administrador'
AND NOT EXISTS (SELECT 1 FROM usuario WHERE correo = 'admin@itla.edu.do');

-- 6. Verificar estructura de tablas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('estudiante', 'materia', 'programa_academico')
ORDER BY table_name, ordinal_position;
