/**
 * `server-only` aborta en cuanto lo carga algo que no sea el servidor, y en
 * los tests todo es "cliente". Se sustituye por este módulo vacío para poder
 * probar los componentes de servidor (el pipeline de MDX, por ejemplo).
 */
export {};
