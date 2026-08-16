import { SHEET_ID } from "@/lib/sheet";

const NUEVO_SITIO = "https://redacopiobogota.com/";

/** Bandera de Colombia: franjas 1/2 amarillo, 1/4 azul, 1/4 rojo sobre 3:2. */
function ColombiaFlag() {
  return (
    <svg
      className="flag"
      viewBox="0 0 3 2"
      role="img"
      aria-label="Bandera de Colombia"
    >
      <rect width="3" height="1" fill="var(--amarillo)" />
      <rect y="1" width="3" height="0.5" fill="var(--azul)" />
      <rect y="1.5" width="3" height="0.5" fill="var(--rojo)" />
    </svg>
  );
}

/**
 * La hoja que alimentaba el tablero fue vaciada: sus administradores movieron
 * la información a su propio sitio. La página queda como un aviso estático que
 * manda a la gente allá — ya no tiene sentido consultar el Sheet.
 */
export default function Page() {
  return (
    <main className="page">
      <header className="masthead">
        <div className="masthead-top">
          <h1 className="title display">
            <span className="title-primero">Puntos de</span>{" "}
            <span className="title-accent">Voluntariado</span>
          </h1>
          <ColombiaFlag />
        </div>
      </header>

      <section className="aviso">
        <div className="aviso-col">
          <p className="aviso-kicker">Esta información se mudó</p>

          <p className="aviso-texto">
            Los administradores de la información trasladaron todos los puntos
            a su propio sitio de acopio y vaciaron la hoja que alimentaba esta
            página. Por eso desde aquí ya no se puede consultar.
          </p>

          <a
            className="aviso-cta"
            href={NUEVO_SITIO}
            target="_blank"
            rel="noopener noreferrer"
          >
            Consulta los puntos en redacopiobogota.com →
          </a>
        </div>

        <p className="aviso-cierre display">
          No dejes de ayudar.
          <br />
          Colombia nos necesita.
        </p>
      </section>

      <footer className="footer">
        Este tablero leía un{" "}
        <a
          href={`https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Google Sheet colaborativo
        </a>{" "}
        que ya no se actualiza.
      </footer>
    </main>
  );
}
