-- En instalaciones existentes, ejecutar una vez después de 20261008_cliente_role.sql.
ALTER TABLE USUARIO
  ADD COLUMN id_cliente INT NULL,
  ADD CONSTRAINT uq_usuario_cliente UNIQUE (id_cliente),
  ADD CONSTRAINT fk_usuario_cliente FOREIGN KEY (id_cliente) REFERENCES CLIENTE(id_cliente);
