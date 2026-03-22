"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  GitBranchPlus,
  Network,
  Scale,
  Sparkles,
} from "lucide-react";
import styles from "./page.module.css";

type Objective = "classification" | "fragility" | "dual";
type Method = "matrix" | "graph" | "dual";

type DependenciesLevel = "none" | "some" | "many";
type CascadeLevel = "no" | "partial" | "yes";
type ConcentrationLevel = "no" | "moderate" | "high";
type Binary = "no" | "yes";

type DiagnosticAnswers = {
  dependencies: DependenciesLevel | null;
  cascade: CascadeLevel | null;
  concentration: ConcentrationLevel | null;
  singlePoint: Binary | null;
};

type Recommendation = {
  method: Method;
  title: string;
  reasons: string[];
  matrixNote: string;
  graphNote: string;
  structuralRisk: boolean;
};

const STEP_TITLES = [
  "Objetivo",
  "Diagnostico rapido",
  "Recomendacion",
  "Decision final",
];

const INITIAL_ANSWERS: DiagnosticAnswers = {
  dependencies: null,
  cascade: null,
  concentration: null,
  singlePoint: null,
};

function isDiagnosticsComplete(answers: DiagnosticAnswers) {
  return (
    answers.dependencies !== null &&
    answers.cascade !== null &&
    answers.concentration !== null &&
    answers.singlePoint !== null
  );
}

function computeRecommendation(
  objective: Objective,
  answers: DiagnosticAnswers
): Recommendation {
  const qualifiesMatrixForRiskEvaluation =
    objective === "classification" &&
    (answers.dependencies === "none" || answers.dependencies === "some") &&
    (answers.cascade === "no" || answers.cascade === "partial") &&
    (answers.concentration === "no" || answers.concentration === "moderate") &&
    answers.singlePoint === "no";

  let method: Method = "matrix";
  if (objective === "dual") {
    method = "dual";
  } else if (!qualifiesMatrixForRiskEvaluation) {
    method = "graph";
  }

  const reasons: string[] = [];
  if (objective === "dual") {
    reasons.push("Analisis dual seleccionado explicitamente por el usuario.");
  }
  if (qualifiesMatrixForRiskEvaluation) {
    reasons.push("El perfil cumple condiciones lineales para evaluacion de riesgo con matriz.");
  }
  if (objective === "fragility") {
    reasons.push("El objetivo seleccionado prioriza lectura estructural de fragilidad.");
  }
  if (answers.dependencies === "many") reasons.push("Alta interdependencia entre controles y procesos.");
  if (method === "graph" && answers.dependencies === "some") {
    reasons.push("Dependencias relevantes que afectan el analisis lineal.");
  }
  if (answers.cascade === "yes") reasons.push("Una falla puede propagarse a multiples areas.");
  if (answers.cascade === "partial") reasons.push("Existen efectos de propagacion parcial.");
  if (answers.concentration === "high") reasons.push("Se detecta concentracion alta de exposicion.");
  if (answers.concentration === "moderate") reasons.push("Hay concentraciones moderadas que conviene monitorear.");
  if (answers.singlePoint === "yes") reasons.push("El sistema debe identificar puntos unicos de falla.");

  if (!reasons.length) {
    reasons.push("El perfil no cumple la condicion estricta de matriz; se sugiere grafo.");
  }

  const titleMap: Record<Method, string> = {
    matrix: "Recomendacion del sistema: Matriz de riesgo",
    graph: "Recomendacion del sistema: Grafo de fragilidad",
    dual: "Recomendacion del sistema: Analisis dual (Matriz + Grafo)",
  };

  return {
    method,
    title: titleMap[method],
    reasons,
    matrixNote: "Matriz: util para cumplimiento y reporte regulatorio.",
    graphNote: "Grafo: necesario para exponer fragilidad estructural e interdependencia.",
    structuralRisk: method !== "matrix",
  };
}

function getMethodLabel(method: Method) {
  if (method === "matrix") return "Matriz";
  if (method === "graph") return "Grafo";
  return "Dual";
}

function getOverrideWarning(recommended: Method, selected: Method) {
  if (recommended === selected) return "";
  if ((recommended === "graph" || recommended === "dual") && selected === "matrix") {
    return "Este sistema presenta interdependencias relevantes. El uso exclusivo de matriz puede ocultar riesgos estructurales.";
  }
  if (recommended === "matrix" && selected !== "matrix") {
    return "Tu eleccion agrega complejidad al analisis. Verifica que el nivel de detalle adicional sea necesario para el objetivo.";
  }
  return "La seleccion contradice la recomendacion automatica. Confirma que deseas continuar bajo tu criterio.";
}

function getOutputNote(selected: Method, recommendation: Recommendation) {
  if (selected === "matrix" && recommendation.structuralRisk) {
    return "Nota: este resultado no considera interdependencias entre elementos. Podrian existir riesgos no capturados.";
  }
  if (selected === "graph") {
    return "Nota: este resultado refleja estructura e interdependencia, no solo impacto individual.";
  }
  if (selected === "dual") {
    return "Nota: este resultado combina trazabilidad regulatoria (matriz) con lectura estructural de fragilidad (grafo).";
  }
  return "Nota: el resultado prioriza interpretacion lineal de impacto y probabilidad.";
}

function safeLoad<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSave(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures to avoid blocking user flow.
  }
}

export default function DecisionWizardClient() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [objective, setObjective] = useState<Objective | null>(null);
  const [answers, setAnswers] = useState<DiagnosticAnswers>(INITIAL_ANSWERS);
  const [selectedMethod, setSelectedMethod] = useState<Method | null>(null);
  const [overrideConfirmed, setOverrideConfirmed] = useState(false);

  const diagnosticsReady = isDiagnosticsComplete(answers);
  const recommendation = useMemo(() => {
    if (!objective || !diagnosticsReady) return null;
    return computeRecommendation(objective, answers);
  }, [objective, answers, diagnosticsReady]);

  const isMismatch =
    Boolean(recommendation && selectedMethod) &&
    recommendation!.method !== selectedMethod;

  const overrideMessage =
    recommendation && selectedMethod
      ? getOverrideWarning(recommendation.method, selectedMethod)
      : "";

  const stepTitle = STEP_TITLES[step - 1] || "Wizard";

  const updateAnswer = <K extends keyof DiagnosticAnswers>(key: K, value: NonNullable<DiagnosticAnswers[K]>) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const appendAuditEvent = (payload: Record<string, unknown>) => {
    const history = safeLoad<Array<Record<string, unknown>>>("kiriox:decision-wizard:audit", []);
    const next = [{ created_at: new Date().toISOString(), ...payload }, ...history].slice(0, 50);
    safeSave("kiriox:decision-wizard:audit", next);
  };

  const registerDecision = (target: Method) => {
    if (!recommendation || !objective) return;
    const decision = {
      created_at: new Date().toISOString(),
      objective,
      answers,
      recommended_method: recommendation.method,
      selected_method: target,
      override: recommendation.method !== target,
    };

    const history = safeLoad<Array<Record<string, unknown>>>("kiriox:decision-wizard:history", []);
    safeSave("kiriox:decision-wizard:latest", decision);
    safeSave("kiriox:decision-wizard:history", [decision, ...history].slice(0, 30));
  };

  const goNext = () => {
    if (step === 1 && !objective) return;
    if (step === 2 && !diagnosticsReady) return;
    if (step === 3 && recommendation && !selectedMethod) {
      setSelectedMethod(recommendation.method);
    }
    setStep((prev) => Math.min(4, prev + 1));
  };

  const goBack = () => setStep((prev) => Math.max(1, prev - 1));

  const confirmOverride = () => {
    if (!recommendation || !selectedMethod) return;
    setOverrideConfirmed(true);
    appendAuditEvent({
      event: "override_confirmed",
      recommended_method: recommendation.method,
      selected_method: selectedMethod,
      objective,
      answers,
    });
  };

  const startAnalysis = () => {
    if (!recommendation || !selectedMethod) return;
    if (isMismatch && !overrideConfirmed) return;

    registerDecision(selectedMethod);

    const routes: Record<Method, string> = {
      matrix: "/validacion/auditorias",
      graph: "/score/score?step=1",
      dual: "/score/preguntasClaves?enfoque=dual",
    };

    router.push(routes[selectedMethod]);
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.eyebrow}>evaluacion asistida</div>
          <h1 className={styles.title}>Inicio de evaluacion</h1>
          <p className={styles.subtitle}>
            El sistema no decide por ti. Te guia con diagnostico, recomendacion explicita y advertencias antes de ejecutar.
          </p>
          <div className={styles.progressRow}>
            <div className={styles.progressBar}>
              <span style={{ width: `${(step / 4) * 100}%` }} />
            </div>
            <div className={styles.progressMeta}>
              Paso {step} de 4: {stepTitle}
            </div>
          </div>
        </header>

        {step === 1 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Que quieres medir?</h2>
            <div className={styles.optionGrid}>
              <button
                type="button"
                className={`${styles.optionCard} ${objective === "classification" ? styles.optionCardActive : ""}`}
                onClick={() => setObjective("classification")}
              >
                <div className={styles.optionTitle}>Linear Risk Assessment</div>
                <div className={styles.optionText}>
                  Elige esta opcion cuando tu prioridad es cumplimiento tradicional, comparabilidad entre unidades
                  y trazabilidad regulatoria. Funciona mejor si el problema puede describirse por impacto y probabilidad
                  sin depender mucho de relaciones entre controles. Es ideal para reportes ejecutivos y regulatorios
                  donde necesitas justificar decisiones con un marco lineal, estable y facil de auditar.
                </div>
              </button>

              <button
                type="button"
                className={`${styles.optionCard} ${objective === "fragility" ? styles.optionCardActive : ""}`}
                onClick={() => setObjective("fragility")}
              >
                <div className={styles.optionTitle}>Structural Fragility Analysis</div>
                <div className={styles.optionText}>
                  Elige esta opcion cuando sospechas interdependencias, concentraciones o efectos en cascada
                  que una matriz lineal puede subestimar. Es la via correcta si una falla aislada puede
                  propagarse a varias areas, si existen puntos unicos de falla o si necesitas detectar
                  vulnerabilidad estructural antes de que aparezca en indicadores tradicionales.
                </div>
              </button>

              <button
                type="button"
                className={`${styles.optionCard} ${objective === "dual" ? styles.optionCardActive : ""}`}
                onClick={() => setObjective("dual")}
              >
                <div className={styles.optionBadge}>Recomendado</div>
                <div className={styles.optionTitle}>Ambos</div>
                <div className={styles.optionText}>Combinar trazabilidad regulatoria con lectura estructural.</div>
              </button>
            </div>

            <div className={styles.hintBox}>
              <AlertTriangle size={16} />
              <span>Antes de elegir metodologia, define el objetivo y la consecuencia de una mala seleccion.</span>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Diagnostico rapido</h2>
            <p className={styles.sectionText}>Responde cuatro preguntas cortas. Esto guia la recomendacion del sistema.</p>

            <div className={styles.questionList}>
              <div className={styles.questionCard}>
                <div className={styles.questionTitle}>1. Existen dependencias entre controles o procesos?</div>
                <div className={styles.choiceRow}>
                  {(["none", "some", "many"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`${styles.choiceButton} ${answers.dependencies === value ? styles.choiceButtonActive : ""}`}
                      onClick={() => updateAnswer("dependencies", value)}
                    >
                      {value === "none" ? "Ninguna" : value === "some" ? "Algunas" : "Muchas"}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.questionCard}>
                <div className={styles.questionTitle}>2. Una falla puede afectar multiples areas?</div>
                <div className={styles.choiceRow}>
                  {(["no", "partial", "yes"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`${styles.choiceButton} ${answers.cascade === value ? styles.choiceButtonActive : ""}`}
                      onClick={() => updateAnswer("cascade", value)}
                    >
                      {value === "no" ? "No" : value === "partial" ? "Parcialmente" : "Si"}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.questionCard}>
                <div className={styles.questionTitle}>3. Hay concentracion de exposicion (clientes/proveedores/sistemas)?</div>
                <div className={styles.choiceRow}>
                  {(["no", "moderate", "high"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`${styles.choiceButton} ${answers.concentration === value ? styles.choiceButtonActive : ""}`}
                      onClick={() => updateAnswer("concentration", value)}
                    >
                      {value === "no" ? "No" : value === "moderate" ? "Moderada" : "Alta"}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.questionCard}>
                <div className={styles.questionTitle}>4. Necesitas detectar puntos unicos de falla?</div>
                <div className={styles.choiceRow}>
                  {(["no", "yes"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`${styles.choiceButton} ${answers.singlePoint === value ? styles.choiceButtonActive : ""}`}
                      onClick={() => updateAnswer("singlePoint", value)}
                    >
                      {value === "no" ? "No" : "Si"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {step === 3 && recommendation && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Recomendacion del sistema</h2>
            <div className={styles.recommendCard}>
              <div className={styles.recommendHeader}>
                <Sparkles size={18} />
                <strong>{recommendation.title}</strong>
              </div>
              <ul className={styles.reasonList}>
                {recommendation.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
              <div className={styles.recommendGrid}>
                <div className={styles.recommendItem}>
                  <Scale size={16} />
                  <span>{recommendation.matrixNote}</span>
                </div>
                <div className={styles.recommendItem}>
                  <Network size={16} />
                  <span>{recommendation.graphNote}</span>
                </div>
              </div>
            </div>

            <div className={styles.hintBox}>
              <CheckCircle2 size={16} />
              <span>El sistema recomienda; la eleccion final sigue siendo tuya.</span>
            </div>
          </section>
        )}

        {step === 4 && recommendation && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Eleccion final informada</h2>
            <p className={styles.sectionText}>
              Selecciona el enfoque final. Si contradice la recomendacion, el override debe ser explicito y consciente.
            </p>

            <div className={styles.methodGrid}>
              {(["matrix", "graph", "dual"] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  className={`${styles.optionCard} ${selectedMethod === method ? styles.optionCardActive : ""}`}
                  onClick={() => {
                    setSelectedMethod(method);
                    setOverrideConfirmed(false);
                  }}
                >
                  <div className={styles.optionTitle}>{getMethodLabel(method)}</div>
                  <div className={styles.optionText}>
                    {method === "matrix" && "Impacto/probabilidad con salida de cumplimiento."}
                    {method === "graph" && "Interdependencia, cascadas y fragilidad estructural."}
                    {method === "dual" && "Cobertura regulatoria + lectura estructural profunda."}
                  </div>
                </button>
              ))}
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.summaryRow}>
                <span>Recomendacion automatica</span>
                <strong>{getMethodLabel(recommendation.method)}</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Seleccion del usuario</span>
                <strong>{selectedMethod ? getMethodLabel(selectedMethod) : "Sin seleccionar"}</strong>
              </div>
            </div>

            {selectedMethod && isMismatch && (
              <div className={styles.warningCard}>
                <div className={styles.warningTitle}>
                  <AlertTriangle size={16} />
                  Advertencia de desalineacion
                </div>
                <p>{overrideMessage}</p>
                <div className={styles.warningActions}>
                  <button type="button" className={styles.ghostButton} onClick={() => setStep(2)}>
                    Volver y ajustar
                  </button>
                  <button type="button" className={styles.primaryButton} onClick={confirmOverride}>
                    Continuar y registrar decision
                  </button>
                </div>
              </div>
            )}

            {selectedMethod && (
              <div className={styles.outputNote}>
                <GitBranchPlus size={16} />
                <span>{getOutputNote(selectedMethod, recommendation)}</span>
              </div>
            )}
          </section>
        )}

        <footer className={styles.footer}>
          <button type="button" className={styles.ghostButton} onClick={goBack} disabled={step === 1}>
            <ChevronLeft size={16} />
            Anterior
          </button>

          {step < 4 ? (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={goNext}
              disabled={(step === 1 && !objective) || (step === 2 && !diagnosticsReady)}
            >
              Siguiente
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={startAnalysis}
              disabled={!selectedMethod || (isMismatch && !overrideConfirmed)}
            >
              Iniciar analisis
              <ArrowRight size={16} />
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
