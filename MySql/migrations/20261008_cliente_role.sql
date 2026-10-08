-- Ejecutar una vez sobre instalaciones existentes. No modifica usuarios ni roles actuales.
INSERT INTO ROL (nombre, descripcion)
SELECT 'Cliente', 'Consulta del catálogo y administración de su propia cuenta'
WHERE NOT EXISTS (SELECT 1 FROM ROL WHERE LOWER(nombre) = 'cliente');
