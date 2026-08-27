-- Vuelca el esquema aplicado como JSON, para compararlo con lo que pide el
-- código (ver scripts/verify-schema.mts). Se ejecuta DESPUÉS de aplicar todas
-- las migraciones, así que describe la base de datos de verdad y no lo que
-- alguien creyó escribir.
\t on
\a
select json_object_agg(tabla, columnas)
from (
  select table_name as tabla, json_agg(column_name order by ordinal_position) as columnas
  from information_schema.columns
  where table_schema = 'public'
  group by table_name
) t;
