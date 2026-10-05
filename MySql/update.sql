-- ================================================================
-- ACTUALIZACIÓN DE HASH BCrypt PARA PASSWORD123!
-- Ejecuta este bloque en tu MySQL Workbench
-- ================================================================

USE erp_libreria;

-- Asignar el hash oficial a todos los usuarios de prueba
UPDATE USUARIO 
SET password_hash = '$2a$10$7EqJtq98hPqEX7fNZaFWoO5v5qV7QxN7Y2x3M3gVfF6X8J8p6L8uK';

-- Verificar que se aplicó correctamente
SELECT id_usuario, nombre, correo FROM USUARIO;