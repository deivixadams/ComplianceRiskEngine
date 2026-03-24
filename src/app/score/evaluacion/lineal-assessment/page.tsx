import Link from "next/link";
import { AlertTriangle, CheckCircle2, Scale } from "lucide-react";
import styles from "./page.module.css";

export default function LinealAssessmentWarningPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <header className={styles.header}>
          <div className={styles.badge}>Warning previo a ejecucion</div>
          <h1 className={styles.title}>
            <Scale size={24} />
            Lineal Assessment
          </h1>
          <p className={styles.subtitle}>
            Esta evaluacion usa un enfoque lineal (impacto/probabilidad) orientado a cumplimiento,
            comparabilidad y trazabilidad para auditoria/regulador.
          </p>
        </header>

        <section className={styles.section}>
          <h2>Cuando es viable usar esta seleccion</h2>
          <ul>
            <li>El objetivo principal es evaluacion de riesgo lineal y reporte de cumplimiento.</li>
            <li>Las dependencias entre controles son nulas o limitadas.</li>
            <li>La propagacion de fallas es nula o parcial.</li>
            <li>La concentracion es nula o moderada.</li>
            <li>No se observan puntos unicos de falla criticos.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>Cuando considerar Structural Assessment</h2>
          <ul>
            <li>Existen dependencias fuertes entre dominios, riesgos y controles.</li>
            <li>Una falla puede escalar en cascada a multiples areas.</li>
            <li>Hay concentraciones altas o fragilidad estructural.</li>
          </ul>
          <p className={styles.hint}>
            <AlertTriangle size={16} />
            Si estas condiciones aparecen, el enfoque lineal puede subestimar riesgo sistemico.
          </p>
        </section>

        <footer className={styles.footer}>
          <Link href="/score/dashboard" className={styles.ghostButton}>
            Cancelar
          </Link>
          <Link href="/score/evaluacion/inicio" className={styles.secondaryButton}>
            Revisar asistente
          </Link>
          <Link href="/validacion/auditorias" className={styles.primaryButton}>
            <CheckCircle2 size={16} />
            Continuar
          </Link>
        </footer>
      </div>
    </div>
  );
}

