-- Centro de entrenamiento: los tipos de tarjeta que genera el catálogo.
--
-- La tabla nació contemplando 'interval' y 'chord_tone' como nombres
-- provisionales; nunca se escribió ninguna fila con ellos. Se sustituyen por
-- los tipos reales de `src/lib/train/cards.ts`, que son los que produce
-- `cardId()` y los únicos que `parseCardId()` acepta.

alter table public.srs_cards drop constraint if exists srs_cards_card_type_check;

alter table public.srs_cards
  add constraint srs_cards_card_type_check check (
    card_type in (
      'fretboard_note',
      'interval_name',
      'interval_build',
      'chord_notes',
      'ear_interval',
      'ear_chord'
    )
  );

-- El progreso se busca siempre por (usuario, tipo, id de tarjeta): sin este
-- índice cada respuesta hace un recorrido completo de las tarjetas del usuario.
create index if not exists srs_cards_user_card_idx
  on public.srs_cards (user_id, card_type, (payload ->> 'id'));
