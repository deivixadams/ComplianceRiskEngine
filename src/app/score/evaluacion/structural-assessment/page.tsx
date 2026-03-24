import Link from "next/link";
import { AlertTriangle, CheckCircle2, Network } from "lucide-react";
import styles from "../lineal-assessment/page.module.css";

export default function StructuralAssessmentWarningPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <header className={styles.header}>
          <div className={styles.badge}>Warning previo a ejecucion</div>
          <h1 className={styles.title}>
            <Network size={24} />
            Structural Assessment
          </h1>
          <p className={styles.subtitle}>
            Esta evaluacion usa un enfoque de fragilidad estructural para analizar interdependencias,
            concentraciones y posibles fallas en cascada entre dominios, riesgos y controles.
          </p>
        </header>

        <section className={styles.section}>
          <h2>Cuando es viable usar esta seleccion</h2>
          <ul>
            <li>Existen dependencias entre controles, procesos o dominios.</li>
            <li>Una falla puede impactar multiples areas en cadena.</li>
            <li>Hay concentracion de exposicion (clientes, proveedores o sistemas).</li>
            <li>Se sospechan puntos unicos de falla con impacto sistemico.</li>
            <li>Necesitas priorizar resiliencia estructural, no solo cumplimiento lineal.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>Cuando considerar Linear Risk Assessment</h2>
          <ul>
            <li>La prioridad es trazabilidad regulatoria y comparabilidad lineal.</li>
            <li>Las dependencias son bajas y la propagacion de fallas es limitada.</li>
            <li>No hay señales fuertes de fragilidad estructural.</li>
          </ul>
          <p className={styles.hint}>
            <AlertTriangle size={16} />
            Si el sistema es altamente interdependiente, un enfoque solo lineal puede subestimar riesgo real.
          </p>
        </section>

        <footer className={styles.footer}>
          <Link href="/score/dashboard" className={styles.ghostButton}>
            Cancelar
          </Link>
          <Link href="/score/evaluacion/inicio" className={styles.secondaryButton}>
            Revisar asistente
          </Link>
          <Link href="/score/score?step=1" className={styles.primaryButton}>
            <CheckCircle2 size={16} />
            Continuar
          </Link>
        </footer>
      </div>
    </div>
  );
}

