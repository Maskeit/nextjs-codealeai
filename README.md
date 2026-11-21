# Como se usa la app
- /config:
Muestra una tarjeta por proveedor, con nombre, protocolo, Base URL, clave y una sección "Avanzado" con header de auth, esquema, max tokens y headers extra.
Cada tarjeta lista sus modelos con precio de entrada y salida por millón de tokens, y permite activar o desactivar el proveedor, borrar la clave y eliminarlo. Hay una tarjeta vacía al final para crear uno nuevo.
La clave nunca vuelve al navegador: solo se ve ····1234. Dejar el campo vacío conserva la clave actual.
Los componentes están en components/config/, el acceso a datos en lib/providers.ts y las acciones en app/config/actions.ts.