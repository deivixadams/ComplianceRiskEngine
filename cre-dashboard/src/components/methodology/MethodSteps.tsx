"use client";

import { ChevronRight } from "lucide-react";
import styles from './MethodSteps.module.css';

interface Step {
    id: number;
    title: string;
    description: string;
}

const defaultSteps: Step[] = [
    { id: 1, title: "Selección de marco y versión", description: "Definición del Framework (ISO, AML, SOC2) y su versión normativa específica." },
    { id: 2, title: "Evaluación de controles", description: "Calificación de diseño, formalización, operación y fortaleza de evidencia." },
    { id: 3, title: "Ejecución de pruebas", description: "Evidencia de cumplimiento mediante ejecuciones manuales o scripts automáticos." },
    { id: 4, title: "Detección de hallazgos", description: "Identificación de eventos materiales que afectan la exposición estructural." },
    { id: 5, title: "Ejecución determinista", description: "Cálculo inmutable del ModelRun basado en parámetros vigentes y evidencias." },
    { id: 6, title: "Generación de reportes", description: "Consolidación en Board Pack, Work Pack e Inspection Pack para auditoría." },
];

export default function MethodSteps() {
    return (
        <div className={styles.stepsContainer}>
            <div className={styles.stepList}>
                {defaultSteps.map((step, index) => (
                    <div key={step.id} className={styles.stepItem}>
                        {index !== defaultSteps.length - 1 && (
                            <div className={styles.timelineConnector} />
                        )}

                        <div className={styles.stepNumberBox}>
                            <span className={styles.stepNumber}>0{step.id}</span>
                        </div>

                        <div className={styles.stepContent}>
                            <h4 className={styles.stepTitle}>{step.title}</h4>
                            <p className={styles.stepDescription}>{step.description}</p>
                        </div>

                        <ChevronRight className={styles.chevron} size={16} />
                    </div>
                ))}
            </div>

            <div className={styles.limitationsBox}>
                <div className={styles.limitationsDecoration}>
                    <div className={styles.decorationCircle} />
                </div>

                <h5 className={styles.limitationsHeader}>
                    <span className={styles.pulseDot} />
                    Limitaciones Estructurales
                </h5>
                <div className={styles.limitationsList}>
                    {[
                        "No certifica cumplimiento; mide exposición neta real.",
                        "Dependencia íntegra de la completitud de evidencia.",
                        "Parametrización base reservada al Comité de la Entidad."
                    ].map((text, i) => (
                        <div key={i} className={styles.limitationItem}>
                            <span className={styles.limitationBullet}>•</span>
                            {text}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
