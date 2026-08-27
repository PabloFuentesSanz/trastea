-- Entrenamientos de escalas: dos tipos de tarjeta nuevos.
--
--   scale_degree — una nota marcada dentro de una escala: qué grado es.
--   scale_box    — una caja con un hueco: qué nota falta y dónde.
--
-- El CHECK se reescribe entero (Postgres no sabe añadir un valor a un check
-- existente) y tiene que coincidir con `CARD_TYPES` de src/lib/train/cards.ts,
-- cosa que comprueba card-types.test.ts.

alter table public.srs_cards drop constraint if exists srs_cards_card_type_check;

alter table public.srs_cards
  add constraint srs_cards_card_type_check check (
    card_type in (
      'fretboard_note',
      'interval_name',
      'interval_build',
      'chord_notes',
      'ear_interval',
      'ear_chord',
      'scale_degree',
      'scale_box'
    )
  );
