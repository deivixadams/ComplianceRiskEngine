import React from 'react';
import {
  Calendar,
  Clock,
  Download,
  Info,
  Layers3,
  Sparkles,
  Users,
  Wand2
} from 'lucide-react';
import styles from './ActaStep.module.css';

type Option = { id: string; name: string; code?: string };

type ActaData = {
  entidad_nombre: string;
  periodo_inicio: string;
  periodo_fin: string;
  objetivo: string;
  alcance: string;
  marco_normativo: string;
  metodologia: string;
  lider_equipo: string;
  lider_equipo_id?: string;
  auditores: string;
  auditores_ids?: string[];
  cronograma: { hito: string; fecha: string }[];
};

type ContextState = {
  companyId: string;
  selectedReinoId: string;
};

type ActaStepProps = {
  acta: ActaData;
  context: ContextState;
  companies: Option[];
  reinos: Option[];
  onChangeActa: (next: ActaData) => void;
  onChangeContext: (next: Partial<ContextState>) => void;
  onAI: (field: string, promptCode: string) => void;
  aiLoadingFields: Record<string, boolean>;
  onSave: () => void;
  onGenerateActa: () => void;
  onNext: () => void;
};

export default function ActaStep({
  acta,
  context,
  companies,
  reinos,
  onChangeActa,
  onChangeContext,
  onAI,
  aiLoadingFields,
  onSave,
  onGenerateActa,
  onNext
}: ActaStepProps) {
  const getCronoDate = (hito: string) => acta.cronograma.find((item) => item.hito === hito)?.fecha || '';
  const updateCronoDate = (hito: string, fecha: string) => {
    const updated = acta.cronograma.map((item) => (
      item.hito === hito ? { ...item, fecha } : item
    ));
    onChangeActa({ ...acta, cronograma: updated });
  };
  return (
    <div className={styles.root}>
      <div className={styles.body}>
        <div className={styles.card}>
          <div className={styles.formStack}>
            <FormField label="Empresa" icon={Info}>
              <select
                value={context.companyId}
                onChange={(e) => onChangeContext({ companyId: e.target.value })}
                className={styles.select}
              >
                <option value="">Seleccione...</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Reino" icon={Layers3}>
              <select
                value={context.selectedReinoId}
                onChange={(e) => onChangeContext({ selectedReinoId: e.target.value })}
                className={styles.select}
              >
                <option value="">Seleccione...</option>
                {reinos.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}{d.code ? ` (${d.code})` : ''}</option>
                ))}
              </select>
            </FormField>
          </div>

          <div className={styles.divider} />

          <div className={styles.gridTwo}>
            <FormField label="Entidad a Auditar" icon={Info}>
              <input
                type="text"
                value={acta.entidad_nombre}
                onChange={(e) => onChangeActa({ ...acta, entidad_nombre: e.target.value })}
                className={styles.input}
              />
            </FormField>
            <FormField label="Periodo de Auditoria (Anual)" icon={Calendar}>
              <div className={styles.dateRow}>
                <input
                  type="date"
                  value={acta.periodo_inicio}
                  onChange={(e) => onChangeActa({ ...acta, periodo_inicio: e.target.value })}
                  className={styles.input}
                />
                <div className={styles.dateDivider} />
                <input
                  type="date"
                  value={acta.periodo_fin}
                  onChange={(e) => onChangeActa({ ...acta, periodo_fin: e.target.value })}
                  className={styles.input}
                />
              </div>
            </FormField>
          </div>

          <FormField label="Marco Normativo" icon={Info}>
            <input
              type="text"
              value={acta.marco_normativo}
              onChange={(e) => onChangeActa({ ...acta, marco_normativo: e.target.value })}
              className={styles.input}
            />
          </FormField>

          <div className={styles.divider} />

          <div className={styles.gridThree}>
            <TextSection
              title="Objetivo General"
              description="Define la meta principal de la revision (AML/CFT)."
              value={acta.objetivo}
              onChange={(val: string) => onChangeActa({ ...acta, objetivo: val })}
              onAI={() => onAI('objetivo', 'AUDIT_OBJETIVO_GEN')}
              isLoading={!!aiLoadingFields.objetivo}
              placeholder="Describa el objetivo principal..."
              icon={Users}
            />

            <TextSection
              title="Alcance de la Auditoria"
              description="Detalla los procesos, areas y periodos especificos."
              value={acta.alcance}
              onChange={(val: string) => onChangeActa({ ...acta, alcance: val })}
              onAI={() => onAI('alcance', 'AUDIT_ALCANCE')}
              isLoading={!!aiLoadingFields.alcance}
              placeholder="Especifique el alcance tecnico..."
              icon={Info}
            />

            <TextSection
              title="Metodologia de Trabajo"
              description="Tecnicas de muestreo y ejecucion basadas en riesgos."
              value={acta.metodologia}
              onChange={(val: string) => onChangeActa({ ...acta, metodologia: val })}
              onAI={() => onAI('metodologia', 'AUDIT_METODOLOGIA')}
              isLoading={!!aiLoadingFields.metodologia}
              placeholder="Explique la metodologia aplicada..."
              icon={Wand2}
            />
          </div>

          <div className={styles.divider} />

          <div className={styles.gridTwoWide}>
            <div>
              <h3 className={styles.sectionTitle}>
                <Clock className={styles.sectionIcon} />
                Cronograma Estimado
              </h3>
              <div className={styles.fieldStack}>
                <FormField label="Informe Preliminar">
                  <input
                    type="date"
                    value={getCronoDate('Informe Preliminar')}
                    onChange={(e) => updateCronoDate('Informe Preliminar', e.target.value)}
                    className={styles.input}
                  />
                </FormField>
                <FormField label="Cierre Formal">
                  <input
                    type="date"
                    value={getCronoDate('Cierre Formal')}
                    onChange={(e) => updateCronoDate('Cierre Formal', e.target.value)}
                    className={styles.input}
                  />
                </FormField>
              </div>
            </div>
            <div>
              <h3 className={styles.sectionTitle}>
                <Clock className={styles.sectionIcon} />
                Hitos Iniciales
              </h3>
              <div className={styles.fieldStack}>
                <FormField label="Inicio Auditoria">
                  <input
                    type="date"
                    value={getCronoDate('Inicio Auditoria')}
                    onChange={(e) => updateCronoDate('Inicio Auditoria', e.target.value)}
                    className={styles.input}
                  />
                </FormField>
                <FormField label="Trabajo de Campo">
                  <input
                    type="date"
                    value={getCronoDate('Trabajo de Campo')}
                    onChange={(e) => updateCronoDate('Trabajo de Campo', e.target.value)}
                    className={styles.input}
                  />
                </FormField>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerActions}>
            <button className={styles.ghostButton} onClick={onSave}>
              Guardar Borrador
            </button>
            <button
              onClick={onGenerateActa}
              className={styles.primaryButton}
            >
              <Download className={styles.buttonIcon} />
              Generar Acta
            </button>
            <button
              onClick={onNext}
              className={styles.secondaryButton}
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, icon: Icon, children }: { label: string; icon?: any; children: React.ReactNode }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>
        {Icon && <Icon className={styles.fieldIcon} />}
        {label}
      </label>
      {children}
    </div>
  );
}

function TextSection({ title, description, value, onChange, onAI, isLoading, placeholder, icon: Icon }: any) {
  return (
    <div className={styles.textSection}>
      <div className={styles.textHeader}>
        <div>
          <h3 className={styles.textTitle}>
            <Icon className={styles.textIcon} />
            {title}
          </h3>
          <p className={styles.textDescription}>{description}</p>
        </div>
        <button
          onClick={onAI}
          disabled={isLoading}
          className={styles.aiButton}
        >
          {isLoading ? (
            <div className={styles.spinner} />
          ) : (
            <Sparkles className={styles.aiIcon} />
          )}
          IA
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={styles.textarea}
      />
    </div>
  );
}
