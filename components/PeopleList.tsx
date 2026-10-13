// Personas cercanas con nombre, relación y estado (T030 · FR-014).
//
// Los padres existen desde la creación; el resto (hermanos, amigos, pareja)
// se irá generando conforme avance la vida. Cada fila lleva avatar con la
// inicial, relación traducida y un badge de estado coloreado.

import type { PersonaCercana, PersonState, Relation } from "@/lib/api";
import { UsersIcon } from "@/components/icons";

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
  ESTRANGED: "Distanciados",
};

export function PeopleList({ people }: { people: PersonaCercana[] }) {
  return (
    <section className="panel" aria-labelledby="people-heading">
      <div className="panel__head">
        <span className="panel__icon">
          <UsersIcon />
        </span>
        <div>
          <h3 id="people-heading" className="panel__title">
            Personas cercanas
          </h3>
          <p className="panel__subtitle">Familia y personas que acompañan tu vida</p>
        </div>
      </div>

      {people.length === 0 ? (
        <p className="empty" style={{ padding: "var(--space-4)" }}>
          Aún no conozcas a nadie.
        </p>
      ) : (
        <ul className="people">
          {people.map((person, index) => (
            <li
              key={`${person.relation}-${person.name}-${index}`}
              className="person"
            >
              <span className="person__avatar" aria-hidden="true">
                {person.name.trim().charAt(0).toUpperCase()}
              </span>
              <span className="person__body">
                <span className="person__name">{person.name}</span>
                <span className="person__relation">{RELATION_LABEL[person.relation]}</span>
              </span>
              <span className="person__state" data-state={person.state}>
                {STATE_LABEL[person.state]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
