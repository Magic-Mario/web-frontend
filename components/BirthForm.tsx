"use client";

// Formulario de nacimiento (T028) — AS-2 de la US1.
//
// En español, con los datos que exige FR-001: género, país, ciudad filtrada
// por el país elegido, año de nacimiento (1900…año actual) y granularidad
// (FR-002). **Bloquea el envío** y señala el campo inválido mientras el
// formulario no sea válido (edge cases: año fuera de rango, ciudad que no
// pertenece al país o país sin ciudades disponibles).

import { useMemo, useState } from "react";

import type { BirthCountry, CreateLifeInput, Gender, Granularity } from "@/lib/api";

const MIN_BIRTH_YEAR = 1900;
const CURRENT_YEAR = new Date().getFullYear();

type Field = "gender" | "country" | "city" | "birth_year";
type FieldErrors = Partial<Record<Field, string>>;

const label: React.CSSProperties = { display: "block", marginBottom: 4 };
const input: React.CSSProperties = { width: "100%", padding: "0.45rem" };
const errorStyle: React.CSSProperties = { color: "#b91c1c", fontSize: "0.85rem" };

function validate(
  gender: Gender | "",
  country: string,
  city: string,
  birthYear: string,
  cities: string[],
): FieldErrors {
  const errors: FieldErrors = {};

  if (!gender) errors.gender = "Elige el género del personaje.";
  if (!country) {
    errors.country = "Elige el país de nacimiento.";
    errors.city = "Elige primero un país.";
    return errors;
  }

  if (cities.length === 0) {
    errors.city = "País seleccionado sin ciudades disponibles.";
  } else if (!city) {
    errors.city = "Elige la ciudad de nacimiento.";
  }

  if (!birthYear) {
    errors.birth_year = "Indica el año de nacimiento.";
  } else if (!/^\d{4}$/.test(birthYear)) {
    errors.birth_year = "El año debe tener cuatro cifras.";
  } else {
    const year = Number(birthYear);
    if (year < MIN_BIRTH_YEAR || year > CURRENT_YEAR) {
      errors.birth_year = `El año debe estar entre ${MIN_BIRTH_YEAR} y ${CURRENT_YEAR}.`;
    }
  }

  return errors;
}

export function BirthForm({
  countries,
  onSubmit,
  error,
  busy = false,
}: {
  countries: BirthCountry[];
  onSubmit: (input: CreateLifeInput) => Promise<void>;
  error?: string | null;
  busy?: boolean;
}) {
  const [gender, setGender] = useState<Gender | "">("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [granularity, setGranularity] = useState<Granularity>("YEAR");
  const [submitted, setSubmitted] = useState(false);

  const cities = useMemo(
    () => countries.find((entry) => entry.code === country)?.cities ?? [],
    [countries, country],
  );

  const errors = validate(gender, country, city, birthYear, cities);
  const isValid = Object.keys(errors).length === 0;
  const show = (field: Field) => (submitted ? errors[field] : undefined);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (!isValid || busy) return;
    await onSubmit({
      gender: gender as Gender,
      country,
      city,
      birth_year: Number(birthYear),
      granularity,
    });
  }

  return (
    <section>
      <h2>Crea tu personaje</h2>
      <form noValidate onSubmit={handleSubmit}>
        <fieldset style={{ border: 0, padding: 0, margin: "0 0 1rem" }}>
          <legend style={label}>Género</legend>
          {(["MALE", "FEMALE"] as const).map((value) => (
            <label key={value} style={{ marginRight: "1rem" }}>
              <input
                type="radio"
                name="gender"
                value={value}
                checked={gender === value}
                onChange={() => setGender(value)}
              />{" "}
              {value === "MALE" ? "Hombre" : "Mujer"}
            </label>
          ))}
          {show("gender") ? (
            <p role="alert" style={errorStyle}>
              {errors.gender}
            </p>
          ) : null}
        </fieldset>

        <p style={label}>
          País
          <select
            aria-label="País"
            style={input}
            value={country}
            onChange={(event) => {
              setCountry(event.target.value);
              setCity("");
            }}
          >
            <option value="">Selecciona un país</option>
            {countries.map((entry) => (
              <option key={entry.code} value={entry.code}>
                {entry.name}
              </option>
            ))}
          </select>
          {show("country") ? (
            <span role="alert" style={errorStyle}>
              {errors.country}
            </span>
          ) : null}
        </p>

        <p style={label}>
          Ciudad
          <select
            aria-label="Ciudad"
            style={input}
            value={city}
            disabled={!country || cities.length === 0}
            onChange={(event) => setCity(event.target.value)}
          >
            <option value="">
              {cities.length === 0 ? "Sin ciudades disponibles" : "Selecciona una ciudad"}
            </option>
            {cities.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
          {show("city") ? (
            <span role="alert" style={errorStyle}>
              {errors.city}
            </span>
          ) : null}
        </p>

        <p style={label}>
          Año de nacimiento ({MIN_BIRTH_YEAR}…{CURRENT_YEAR})
          <input
            aria-label="Año de nacimiento"
            style={input}
            type="number"
            inputMode="numeric"
            min={MIN_BIRTH_YEAR}
            max={CURRENT_YEAR}
            value={birthYear}
            onChange={(event) => setBirthYear(event.target.value)}
          />
          {show("birth_year") ? (
            <span role="alert" style={errorStyle}>
              {errors.birth_year}
            </span>
          ) : null}
        </p>

        <fieldset style={{ border: 0, padding: 0, margin: "0 0 1rem" }}>
          <legend style={label}>Granularidad</legend>
          {(["YEAR", "MONTH"] as const).map((value) => (
            <label key={value} style={{ marginRight: "1rem" }}>
              <input
                type="radio"
                name="granularity"
                value={value}
                checked={granularity === value}
                onChange={() => setGranularity(value)}
              />{" "}
              {value === "YEAR" ? "Año" : "Mes"}
            </label>
          ))}
        </fieldset>

        <button type="submit" disabled={!isValid || busy}>
          {busy ? "Creando…" : "Empezar la vida"}
        </button>
        {submitted && !isValid ? (
          <p role="alert" style={errorStyle}>
            Revisa los campos marcados antes de empezar.
          </p>
        ) : null}
      </form>
      {error ? (
        <p role="alert" style={errorStyle}>
          {error}
        </p>
      ) : null}
    </section>
  );
}
