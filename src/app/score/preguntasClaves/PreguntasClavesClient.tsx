'use client';

import { useMemo, useState } from 'react';
import styles from './preguntas-claves.module.css';
import type { QuestionResolvedItem } from './question-catalog';

type Props = {
  questions: QuestionResolvedItem[];
};

export default function PreguntasClavesClient({ questions }: Props) {
  const firstAvailable = questions.find((question) => question.view)?.id ?? questions[0]?.id ?? '';
  const [selectedId, setSelectedId] = useState(firstAvailable);

  const selectedQuestion = useMemo(
    () => questions.find((question) => question.id === selectedId) ?? questions[0] ?? null,
    [questions, selectedId]
  );

  const questionsWithView = questions.filter((question) => question.view).length;

  return (
    <main className={styles.page}>
      <div className={styles.ambientLayer} aria-hidden />

      <header className={styles.header}>
        <h1 className={styles.title}>Preguntas claves AML</h1>
        <p className={styles.subtitle}>
          Cada pregunta se vincula a una vista documentada en <code>"_Schema".framework_doc_view</code>.
          Si una pregunta no tiene vista asociada, no se muestra respuesta.
        </p>
      </header>

      <section className={styles.layout}>
        <aside className={styles.leftPanel}>
          <div className={styles.panelHeader}>
            <span>Preguntas</span>
            <strong>{questionsWithView}/{questions.length} con vista</strong>
          </div>

          <div className={styles.listbox} role="listbox" aria-label="Listado de preguntas claves">
            {questions.map((question) => {
              const selected = question.id === selectedQuestion?.id;
              const disabled = !question.view;
              return (
                <button
                  key={question.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  disabled={disabled}
                  onClick={() => setSelectedId(question.id)}
                  className={`${styles.listItem} ${selected ? styles.listItemActive : ''} ${disabled ? styles.listItemDisabled : ''}`}
                >
                  <span className={styles.itemTop}>
                    <span className={styles.itemOrder}>P{question.order}</span>
                    <span className={styles.itemCategory}>{question.category}</span>
                  </span>
                  <span className={styles.itemQuestion}>{question.question}</span>
                  <span className={styles.itemStatus}>
                    {disabled ? 'Sin vista documentada' : 'Vista documentada'}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <article className={styles.rightPanel}>
          {!selectedQuestion ? (
            <div className={styles.emptyState}>No hay preguntas disponibles.</div>
          ) : !selectedQuestion.view ? (
            <div className={styles.emptyState}>
              Esta pregunta no tiene una vista documentada en <code>framework_doc_view</code>; no se genera respuesta.
            </div>
          ) : (
            <div className={styles.answerWrap}>
              <div className={styles.answerMeta}>
                <span className={styles.metaBadge}>{selectedQuestion.category}</span>
                <span className={styles.metaBadgeSecondary}>Pregunta {selectedQuestion.order}</span>
              </div>

              <h2 className={styles.answerQuestion}>{selectedQuestion.question}</h2>

              <p className={styles.answerText}>{selectedQuestion.response}</p>

              <section className={styles.viewCard}>
                <h3>Vista principal para responder</h3>
                <p className={styles.viewName}>
                  {selectedQuestion.view.schema}.{selectedQuestion.view.name}
                </p>
                <p className={styles.viewDescription}>{selectedQuestion.view.description}</p>
              </section>
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
