# Alterações v63 — Performance

- Reduzido o tamanho do estado enviado via Socket.IO.
- Retratos deixam de ser guardados como base64 gigante no estado e passam a ser arquivos em `public/uploads/portraits/`.
- Migração automática de retratos antigos em `data:image/...`.
- Salvamento de estado agora usa debounce assíncrono para reduzir travamentos em Android/Termux.
- Atualizado cache-busting para `?v=63`.
- Atualizada versão do servidor para `v63-performance`.
