// Personas cercanas con nombre, relación y estado (T030 · FR-014).
//
// Los padres existen desde la creación; el resto (hermanos, amigos, pareja)
// se irá generando conforme avance la vida.

import type { PersonaCercana, PersonState, Relation } from "@/lib/api";

const RELATION_LABEL: Record<Relation, string> = {
  FATHER: "Padre",
  MOTHER: "Madre",
  SIBLING: "Hermano/a",
  FRIEND: "Amigo/a",
  PARTNER: "Pareja",
};

const STATE_LABEL: Record<PersonState, string> = {
  ALIVE: "Vivo/a",
  DEAD: "Fallecido/a",
  TOGETHER: "Juntos",
  SEPARATED: "Separados",
};

export function PeopleList({ people }: { people: PersonaCercana[] }) {
  return (
    <section>
      <h2>Personas cercanas</h2>
      {people.length === 0 ? (
        <p>Aún no conozcas a nadie.</p>
      ) : (
        <ul style={{ listStyle: "none" }}>
          {people.map((person, index) => (
            <li
              key={`${person.relation}-${person.name}-${index}`}
              style={{ display: "flex", justifyContent: "space-between", padding: "0.35rem 0" }}
            >
              <span>
                <strong>{person.name}</strong> · {RELATION_LABEL[person.relation]}
              </span>
              <span>{STATE_LABEL[person.state]}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
