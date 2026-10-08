// Formulario de nacimiento (T028) — AS-2 de la US1.
//
// En español, con los datos que exige FR-001: nombre, sexo, país, ciudad
// filtrada por el país elegido (cascada), año de nacimiento (1900…año
// actual) y granularidad (FR-002) como toggle AÑO/MES. **Bloquea el envío**
// y señala el campo inválido mientras el formulario no sea válido (edge
// cases: año fuera de rango, ciudad que no pertenece al país o país sin
// ciudades disponibles).
//
// El nombre NO viaja al backend (el contrato de creación es cerrado,
// `additionalProperties: false`): se guarda en el navegador con
// `lib/characterName.ts` y sólo se pinta en la cabecera del HUD.

import { useMemo, useState } from "react";

import {
  CalendarIcon,
  ClockIcon,
  GlobeIcon,
  HeartIcon,
  MapPinIcon,
  MarsIcon,
  SparklesIcon,
  TriangleAlertIcon,
  UserIcon,
  UsersIcon,
  VenusIcon,
} from "@/components/icons";
import type { BirthCountry, CreateLifeInput, Gender, Granularity } from "@/lib/api";

/** Formulario completo: lo que pide la interfaz, no lo que viaja al servidor. */
export interface BirthFormData extends CreateLifeInput {
  name: string;
}

const MIN_BIRTH_YEAR = 1900;
const CURRENT_YEAR = new Date().getFullYear();

type Field = "name" | "gender" | "country" | "city" | "birth_year";
type FieldErrors = Partial<Record<Field, string>>;

function validate(
  name: string,
  gender: Gender | "",
  country: string,
  city: string,
  birthYear: string,
  cities: string[],
): FieldErrors {
  const errors: FieldErrors = {};

  if (!name.trim()) errors.name = "Escribe un nombre para tu personaje.";

  if (!gender) errors.gender = "Elige el sexo del personaje.";

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
  onSubmit: (input: BirthFormData) => Promise<void>;
  error?: string | null;
  busy?: boolean;
}) {
  const [name, setName] = useState("");
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

  const errors = validate(name, gender, country, city, birthYear, cities);
  const isValid = Object.keys(errors).length === 0;
  const show = (field: Field) => (submitted ? errors[field] : undefined);
  const invalid = (field: Field) => (submitted && errors[field] ? " input--invalid" : "");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (!isValid || busy) return;
    await onSubmit({
      name: name.trim(),
      gender: gender as Gender,
      country,
      city,
      birth_year: Number(birthYear),
      granularity,
    });
  }

  return (
    <section className="panel">
      <div className="birth-hero">
        <span className="birth-hero__badge">
          <SparklesIcon width={16} height={16} />
          Nueva vida
        </span>
        <h2 className="birth-hero__title">Crea tu personaje</h2>
        <p className="birth-hero__text">
          Elige quién serás, dónde y cuándo naces, y con qué detalle avanzará
          tu tiempo. Después sólo tendrás que avanzar y decidir.
        </p>
      </div>

      <form noValidate onSubmit={handleSubmit} className="stack">
        {/* --- nombre y sexo ------------------------------------------- */}
        <div className="form-grid form-grid--two">
          <div className="field">
            <label className="field__label" htmlFor="birth-name">
              <UserIcon width={16} height={16} />
              Nombre
            </label>
            <input
              id="birth-name"
              className={`input${invalid("name")}`}
              type="text"
              maxLength={32}
              autoComplete="off"
              placeholder="p. ej. Ariadna"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            {show("name") ? (
              <p className="field__error" role="alert">
                <TriangleAlertIcon width={14} height={14} />
                {errors.name}
              </p>
            ) : null}
          </div>

          <div className="field">
            <span className="field__label" id="birth-gender-label">
              <UsersIcon width={16} height={16} />
              Sexo
            </span>
            <div className="segmented" role="radiogroup" aria-labelledby="birth-gender-label">
              {([
                { value: "MALE" as const, label: "Hombre", icon: <MarsIcon width={18} height={18} /> },
                { value: "FEMALE" as const, label: "Mujer", icon: <VenusIcon width={18} height={18} /> },
              ]).map((option) => (
                <label key={option.value} className="segmented__option">
                  <input
                    type="radio"
                    name="gender"
                    value={option.value}
                    checked={gender === option.value}
                    onChange={() => setGender(option.value)}
                  />
                  {option.icon}
                  {option.label}
                </label>
              ))}
            </div>
            {show("gender") ? (
              <p className="field__error" role="alert">
                <TriangleAlertIcon width={14} height={14} />
                {errors.gender}
              </p>
            ) : null}
          </div>
        </div>

        {/* --- país → ciudad (cascada) ---------------------------------- */}
        <div className="form-grid form-grid--two">
          <div className="field">
            <label className="field__label" htmlFor="birth-country">
              <GlobeIcon width={16} height={16} />
              País
            </label>
            <select
              id="birth-country"
              className={`select${invalid("country")}`}
              value={country}
              disabled={countries.length === 0}
              onChange={(event) => {
                setCountry(event.target.value);
                setCity("");
              }}
            >
              <option value="">
                {countries.length === 0 ? "Catálogo no disponible" : "Selecciona un país"}
              </option>
              {countries.map((entry) => (
                <option key={entry.code} value={entry.code}>
                  {entry.name}
                </option>
              ))}
            </select>
            {show("country") ? (
              <p className="field__error" role="alert">
                <TriangleAlertIcon width={14} height={14} />
                {errors.country}
              </p>
            ) : null}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="birth-city">
              <MapPinIcon width={16} height={16} />
              Ciudad
            </label>
            <select
              id="birth-city"
              className={`select${invalid("city")}`}
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
              <p className="field__error" role="alert">
                <TriangleAlertIcon width={14} height={14} />
                {errors.city}
              </p>
            ) : null}
          </div>
        </div>

        {/* --- año y granularidad --------------------------------------- */}
        <div className="form-grid form-grid--two">
          <div className="field">
            <label className="field__label" htmlFor="birth-year">
              <CalendarIcon width={16} height={16} />
              Año de nacimiento
            </label>
            <input
              id="birth-year"
              className={`input${invalid("birth_year")}`}
              type="number"
              inputMode="numeric"
              min={MIN_BIRTH_YEAR}
              max={CURRENT_YEAR}
              placeholder={`${MIN_BIRTH_YEAR} … ${CURRENT_YEAR}`}
              value={birthYear}
              onChange={(event) => setBirthYear(event.target.value)}
            />
            {show("birth_year") ? (
              <p className="field__error" role="alert">
                <TriangleAlertIcon width={14} height={14} />
                {errors.birth_year}
              </p>
            ) : (
              <p className="field__hint">
                Entre {MIN_BIRTH_YEAR} y {CURRENT_YEAR}.
              </p>
            )}
          </div>

          <div className="field">
            <span className="field__label" id="birth-granularity-label">
              <ClockIcon width={16} height={16} />
              Granularidad
            </span>
            <div
              className="segmented"
              role="radiogroup"
              aria-labelledby="birth-granularity-label"
            >
              <label className="segmented__option">
                <input
                  type="radio"
                  name="granularity"
                  value="YEAR"
                  checked={granularity === "YEAR"}
                  onChange={() => setGranularity("YEAR")}
                />
                <CalendarIcon width={18} height={18} />
                AÑO
              </label>
              <label className="segmented__option">
                <input
                  type="radio"
                  name="granularity"
                  value="MONTH"
                  checked={granularity === "MONTH"}
                  onChange={() => setGranularity("MONTH")}
                />
                <ClockIcon width={18} height={18} />
                MES
              </label>
            </div>
            <p className="field__hint">
              {granularity === "YEAR"
                ? "Avanzas de un año en año: una vida rápida."
                : "Avanzas mes a mes: más sucesos y más decisiones."}
            </p>
          </div>
        </div>

        {error ? (
          <p className="alert alert--error" role="alert">
            <TriangleAlertIcon width={16} height={16} className="alert__icon" />
            {error}
          </p>
        ) : null}

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn--accent btn--lg btn--block"
            disabled={!isValid || busy}
          >
            <HeartIcon width={20} height={20} className="btn__icon" />
            {busy ? "Creando…" : "Empezar la vida"}
          </button>
          {submitted && !isValid ? (
            <p className="alert alert--error" role="alert">
              <TriangleAlertIcon width={16} height={16} className="alert__icon" />
              Revisa los campos marcados antes de empezar.
            </p>
          ) : null}
        </div>
      </form>
    </section>
  );
}
