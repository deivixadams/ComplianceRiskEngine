'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import WizardShell from './_components/WizardShell';
import ActaStep from './_components/ActaStep';
import ScopeStep from './_components/ScopeStep';
import TeamStep from './_components/TeamStep';
import QuestionnaireStep from './_components/QuestionnaireStep';
import ExtensionsStep from './_components/ExtensionsStep';
import RiskAnalysisStep from './_components/RiskAnalysisStep';

const TOTAL_STEPS = 6;

type Option = { id: string; name: string; code?: string; frameworkId?: string; jurisdictionId?: string; version?: string };
type UserOption = { id: string; label: string; email?: string };

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

type DraftRecord = {
  id: string;
  step: number;
  jurisdictionId?: string | null;
  frameworkId?: string | null;
  frameworkVersionId?: string | null;
  companyId?: string | null;
  acta?: ActaData | null;
  scopeConfig?: any;
  objectives?: any;
  team?: any;
  questionnaire?: any;
  manualExtensions?: any;
  windowStart?: string | null;
  windowEnd?: string | null;
};

type ContextState = {
  jurisdictionId: string;
  frameworkId: string;
  frameworkVersionId: string;
  companyId: string;
};

type DerivedCounts = {
  obligationCount: number;
  riskCount: number;
  controlCount: number;
  testCount: number;
};

type ScopeState = {
  selectedReinoId: string;
  domainIds: string[];
  obligationIds: string[];
  riskIds: string[];
  derivedCounts: DerivedCounts;
};

type TeamMember = { name: string; role: string; userId?: string; sourceType?: 'leader' | 'auditor' | 'manual' };

type ControlEvaluation = {
  riskId: string;
  controlId: string;
  status: 'cumple' | 'parcial' | 'no_cumple' | '';
  notes: string;
  howToEvaluate?: string;
  evidence?: string[];
};

type ExtensionItem = { title: string; notes: string; evidence?: string[] };

const defaultCounts: DerivedCounts = { obligationCount: 0, riskCount: 0, controlCount: 0, testCount: 0 };

function buildDefaultActa(): ActaData {
  const today = new Date();
  const yyyy = today.getFullYear();
  return {
    entidad_nombre: '',
    periodo_inicio: `${yyyy}-01-01`,
    periodo_fin: `${yyyy}-12-31`,
    objetivo: '',
    alcance: '',
    marco_normativo: '',
    metodologia: '',
    lider_equipo: '',
    lider_equipo_id: '',
    auditores: '',
    auditores_ids: [],
    cronograma: [
      { hito: 'Inicio Auditoria', fecha: `${yyyy}-02-15` },
      { hito: 'Trabajo de Campo', fecha: `${yyyy}-03-01` },
      { hito: 'Informe Preliminar', fecha: `${yyyy}-04-15` },
      { hito: 'Cierre Formal', fecha: `${yyyy}-05-10` }
    ]
  };
}

export default function AuditoriaWizardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [draftId, setDraftId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [acta, setActa] = useState<ActaData>(buildDefaultActa());
  const [context, setContext] = useState<ContextState>({
    jurisdictionId: '',
    frameworkId: '',
    frameworkVersionId: '',
    companyId: ''
  });
  const [options, setOptions] = useState<{ jurisdictions: Option[]; frameworks: Option[]; versions: Option[]; companies: Option[] }>(
    { jurisdictions: [], frameworks: [], versions: [], companies: [] }
  );
  const [reinoCatalog, setReinoCatalog] = useState<{ id: string; name: string; code?: string }[]>([]);
  const [companyUsers, setCompanyUsers] = useState<UserOption[]>([]);
  const [scopeState, setScopeState] = useState<ScopeState>({
    selectedReinoId: '',
    domainIds: [],
    obligationIds: [],
    riskIds: [],
    derivedCounts: defaultCounts
  });
  const [windowStart, setWindowStart] = useState('');
  const [windowEnd, setWindowEnd] = useState('');
  const [objectivesText, setObjectivesText] = useState('');
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [questionnaire, setQuestionnaire] = useState<ControlEvaluation[]>([]);
  const [extensions, setExtensions] = useState<ExtensionItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [aiLoadingFields, setAiLoadingFields] = useState<Record<string, boolean>>({});

  const [autoEntidad, setAutoEntidad] = useState('');
  const [autoMarco, setAutoMarco] = useState('');

  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const initializedRef = useRef(false);
  const seededTeamRef = useRef(false);

  const buildTeamFromActa = useCallback((): TeamMember[] => {
    const idToLabel = new Map(companyUsers.map((user) => [user.id, user.label]));
    const next: TeamMember[] = [];

    const leaderName = acta.lider_equipo_id
      ? (idToLabel.get(acta.lider_equipo_id) || acta.lider_equipo || '')
      : (acta.lider_equipo || '');
    if (leaderName.trim()) {
      next.push({
        name: leaderName,
        role: 'Lider de Proyecto',
        userId: acta.lider_equipo_id || undefined,
        sourceType: 'leader'
      });
    }

    const auditorIds = acta.auditores_ids ?? [];
    let auditorNames = auditorIds.length > 0
      ? auditorIds
          .map((id) => idToLabel.get(id))
          .filter((name): name is string => Boolean(name))
      : [];
    if (auditorNames.length === 0 && acta.auditores) {
      auditorNames = acta.auditores
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean);
    }

    auditorNames.forEach((name, idx) => {
      const auditorId = auditorIds[idx];
      if (!name) return;
      next.push({
        name,
        role: 'Auditor',
        userId: auditorId || undefined,
        sourceType: 'auditor'
      });
    });

    return next;
  }, [acta.lider_equipo, acta.lider_equipo_id, acta.auditores, acta.auditores_ids, companyUsers]);

  const loadContextOptions = useCallback(async () => {
    const res = await fetch('/api/superintendence/context');
    if (!res.ok) return;
    const data = await res.json();
    setOptions({
      jurisdictions: data.jurisdictions ?? [],
      frameworks: data.frameworks ?? [],
      versions: data.frameworkVersions ?? [],
      companies: data.companies ?? []
    });
  }, []);

  const loadReinoCatalog = useCallback(async () => {
    const res = await fetch('/api/audit/catalog/domains');
    if (!res.ok) return;
    const data = await res.json();
    setReinoCatalog(data || []);
  }, []);

  const fetchDomainsByReinoId = useCallback(async (reinoId: string): Promise<string[]> => {
    if (!reinoId) return [];
    const res = await fetch(`/api/audit/catalog/reino-domains?reino_id=${encodeURIComponent(reinoId)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }, []);

  const applyReinoSelection = useCallback(async (reinoId: string) => {
    if (!reinoId) {
      setScopeState((prev) => ({
        ...prev,
        selectedReinoId: '',
        domainIds: [],
        obligationIds: [],
        riskIds: [],
        derivedCounts: defaultCounts
      }));
      return;
    }

    setScopeState((prev) => ({
      ...prev,
      selectedReinoId: reinoId,
      domainIds: [],
      obligationIds: [],
      riskIds: [],
      derivedCounts: defaultCounts
    }));

    const domainIds = await fetchDomainsByReinoId(reinoId);
    setScopeState((prev) => {
      if (prev.selectedReinoId !== reinoId) return prev;
      return {
        ...prev,
        domainIds
      };
    });
  }, [fetchDomainsByReinoId]);

  const hydrateDraft = useCallback((draft: DraftRecord) => {
    setDraftId(draft.id);
    const safeStep = Math.min(Math.max(draft.step || 1, 1), TOTAL_STEPS);
    setStep(safeStep);
    setContext({
      jurisdictionId: draft.jurisdictionId ?? '',
      frameworkId: draft.frameworkId ?? '',
      frameworkVersionId: draft.frameworkVersionId ?? '',
      companyId: draft.companyId ?? ''
    });
    if (draft.acta) {
      setActa({ ...buildDefaultActa(), ...draft.acta });
    }
    if (draft.scopeConfig) {
      const selectedReinoId = draft.scopeConfig.selected_reino_id ?? '';
      const selectedDomainId = draft.scopeConfig.selected_domain_id ?? null;
      const hydratedDomainIds = Array.isArray(draft.scopeConfig.domain_ids) ? draft.scopeConfig.domain_ids : [];
      const domainIds = hydratedDomainIds.length > 0
        ? hydratedDomainIds
        : (selectedDomainId ? [selectedDomainId] : []);
      setScopeState({
        selectedReinoId,
        domainIds,
        obligationIds: draft.scopeConfig.obligation_ids ?? [],
        riskIds: draft.scopeConfig.risk_ids ?? [],
        derivedCounts: draft.scopeConfig.derived_counts ?? defaultCounts
      });
    }
    if (draft.windowStart) {
      setWindowStart(String(draft.windowStart).slice(0, 10));
    }
    if (draft.windowEnd) {
      setWindowEnd(String(draft.windowEnd).slice(0, 10));
    }
    if (draft.objectives) {
      if (typeof draft.objectives === 'string') {
        setObjectivesText(draft.objectives);
      } else if (draft.objectives?.narrative) {
        setObjectivesText(draft.objectives.narrative);
      }
    }
    if (Array.isArray(draft.team)) {
      setTeam(draft.team);
    }
    if (Array.isArray(draft.questionnaire)) {
      setQuestionnaire(draft.questionnaire);
    }
    if (Array.isArray(draft.manualExtensions)) {
      setExtensions(draft.manualExtensions);
    }
  }, []);

  const createDraft = useCallback(async () => {
    await fetch('/api/auth/csrf');
    const res = await fetch('/api/audit/drafts', { method: 'POST' });
    if (!res.ok) return null;
    const data = await res.json();
    return data as DraftRecord;
  }, []);

  const loadDraft = useCallback(async (id: string) => {
    const res = await fetch(`/api/audit/drafts/${id}`);
    if (!res.ok) return null;
    return (await res.json()) as DraftRecord;
  }, []);

  const saveDraft = useCallback(async (payload?: Partial<DraftRecord>) => {
    if (!draftId) return;
    await fetch('/api/auth/csrf');
    await fetch(`/api/audit/drafts/${draftId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        acta,
        jurisdictionId: context.jurisdictionId || null,
        frameworkId: context.frameworkId || null,
        frameworkVersionId: context.frameworkVersionId || null,
        companyId: context.companyId || null,
        scopeConfig: {
          selected_reino_id: scopeState.selectedReinoId || null,
          domain_ids: scopeState.domainIds,
          selected_domain_id: scopeState.domainIds[0] || null,
          obligation_ids: scopeState.obligationIds,
          risk_ids: scopeState.riskIds,
          derived_counts: scopeState.derivedCounts
        },
        windowStart: windowStart || null,
        windowEnd: windowEnd || null,
        objectives: { narrative: objectivesText },
        team,
        questionnaire,
        manualExtensions: extensions,
        step,
        ...payload
      })
    });
  }, [draftId, acta, context, scopeState, windowStart, windowEnd, objectivesText, team, questionnaire, extensions, step]);

  useEffect(() => {
    const boot = async () => {
      setLoading(true);
      await Promise.all([loadContextOptions(), loadReinoCatalog()]);
      const existingDraft = searchParams.get('draft');
      const draft = existingDraft ? await loadDraft(existingDraft) : await createDraft();
      if (draft) {
        hydrateDraft(draft);
      }
      setLoading(false);
      initializedRef.current = true;
    };
    boot();
  }, [createDraft, loadContextOptions, loadDraft, hydrateDraft, loadReinoCatalog, searchParams]);

  useEffect(() => {
    if (!initializedRef.current) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveDraft();
    }, 600);
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [acta, context, scopeState, windowStart, windowEnd, objectivesText, team, questionnaire, extensions, step, saveDraft]);

  useEffect(() => {
    if (scopeState.selectedReinoId) return;
    if (reinoCatalog.length === 0) return;
    void applyReinoSelection(reinoCatalog[0].id);
  }, [reinoCatalog, scopeState.selectedReinoId, applyReinoSelection]);

  useEffect(() => {
    if (!scopeState.selectedReinoId) return;
    if (scopeState.domainIds.length > 0) return;
    void applyReinoSelection(scopeState.selectedReinoId);
  }, [scopeState.selectedReinoId, scopeState.domainIds.length, applyReinoSelection]);

  useEffect(() => {
    if (step !== 3) return;
    if (seededTeamRef.current) return;
    if (team.length > 0) {
      seededTeamRef.current = true;
      return;
    }
    const seeded = buildTeamFromActa();
    if (seeded.length > 0) {
      setTeam(seeded);
      seededTeamRef.current = true;
    }
  }, [step, team.length, buildTeamFromActa]);

  useEffect(() => {
    if (!context.companyId) return;
    const selected = options.companies.find((c) => c.id === context.companyId);
    if (selected && (!acta.entidad_nombre || acta.entidad_nombre === autoEntidad)) {
      setAutoEntidad(selected.name);
      setActa((prev) => ({ ...prev, entidad_nombre: selected.name }));
    }
  }, [context.companyId, options.companies, acta.entidad_nombre, autoEntidad]);

  useEffect(() => {
    if (!context.companyId) {
      setCompanyUsers([]);
      return;
    }
    const loadUsers = async () => {
      try {
        const res = await fetch(`/api/audit/team-users?company_id=${context.companyId}`);
        if (!res.ok) {
          setCompanyUsers([]);
          return;
        }
        const data = await res.json();
        const options = Array.isArray(data)
          ? data.map((u: any) => ({
              id: u.id,
              label: [u.name, u.lastName].filter(Boolean).join(' ') || u.email || 'Sin nombre',
              email: u.email
            }))
          : [];
        setCompanyUsers(options);

        setActa((prev) => {
          let next = { ...prev };
          if (next.lider_equipo_id && !options.some((o) => o.id === next.lider_equipo_id)) {
            next.lider_equipo_id = '';
            next.lider_equipo = '';
          }
          if (Array.isArray(next.auditores_ids) && next.auditores_ids.length > 0) {
            const filteredIds = next.auditores_ids.filter((id) => options.some((o) => o.id === id));
            if (filteredIds.length !== next.auditores_ids.length) {
              const names = options.filter((o) => filteredIds.includes(o.id)).map((o) => o.label).join(', ');
              next.auditores_ids = filteredIds;
              next.auditores = names;
            }
          }
          return next;
        });
      } catch (error) {
        console.error('Error loading team users:', error);
        setCompanyUsers([]);
      }
    };
    loadUsers();
  }, [context.companyId]);

  useEffect(() => {
    if (context.jurisdictionId && context.frameworkId && context.frameworkVersionId) return;
    if (options.jurisdictions.length === 0 || options.versions.length === 0) return;

    const rd = options.jurisdictions.find(
      (j) => j.code === 'DO' || j.name.toLowerCase().includes('dominicana')
    );
    const version = options.versions[0];
    const frameworkId = version?.frameworkId || options.frameworks[0]?.id || '';

    setContext((prev) => ({
      ...prev,
      jurisdictionId: prev.jurisdictionId || rd?.id || options.jurisdictions[0]?.id || '',
      frameworkId: prev.frameworkId || frameworkId,
      frameworkVersionId: prev.frameworkVersionId || version?.id || '',
    }));
  }, [options.jurisdictions, options.versions, options.frameworks, context.jurisdictionId, context.frameworkId, context.frameworkVersionId]);

  useEffect(() => {
    if (!context.frameworkId || !context.frameworkVersionId) return;
    const framework = options.frameworks.find((f) => f.id === context.frameworkId);
    const version = options.versions.find((v) => v.id === context.frameworkVersionId);
    if (!framework || !version) return;
    const label = `${framework.name} v${version.version ?? ''}`.trim();
    if (!acta.marco_normativo || acta.marco_normativo === autoMarco) {
      setAutoMarco(label);
      setActa((prev) => ({ ...prev, marco_normativo: label }));
    }
  }, [context.frameworkId, context.frameworkVersionId, options.frameworks, options.versions, acta.marco_normativo, autoMarco]);

  const handleAI = async (field: string, promptCode: string) => {
    setAiLoadingFields((prev) => ({ ...prev, [field]: true }));
    try {
      const res = await fetch('/api/ai/refine-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: (acta as any)[field] || '', field, promptCode })
      });
      const data = await res.json();
      if (data.refinedText) {
        setActa((prev) => ({ ...prev, [field]: data.refinedText }));
      }
    } finally {
      setAiLoadingFields((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleGenerateActa = async () => {
    const res = await fetch('/api/acta-inicio/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(acta)
    });

    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Acta_Inicio_${context.companyId || 'auditoria'}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleNext = () => {
    const nextStep = Math.min(step + 1, TOTAL_STEPS);
    setStep(nextStep);
    saveDraft({ step: nextStep });
  };

  const handleBack = () => {
    const prevStep = Math.max(step - 1, 1);
    setStep(prevStep);
    saveDraft({ step: prevStep });
  };

  const handleSave = () => {
    saveDraft();
  };

  const handleFinish = async () => {
    if (!draftId) return;
    await saveDraft();
    await fetch('/api/auth/csrf');
    const res = await fetch(`/api/audit/drafts/${draftId}/report`, { method: 'POST' });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Informe_Auditoria_${draftId}.docx`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    router.push('/validacion/auditorias');
  };

  const stepTitle = useMemo(() => {
    if (step === 1) return 'Configuracion: Acta de Inicio';
    if (step === 2) return 'Analisis de riesgo';
    if (step === 3) return 'Equipo';
    if (step === 4) return 'Seleccion de auditoria';
    if (step === 5) return 'Evaluacion de riesgos';
    if (step === 6) return '';
    return 'Wizard';
  }, [step]);

  const headerItems = useMemo(() => {
    const jurisdiction = options.jurisdictions.find((j) => j.id === context.jurisdictionId)?.name || 'Sin definir';
    const framework = options.frameworks.find((f) => f.id === context.frameworkId)?.name || 'Sin definir';
    const version = options.versions.find((v) => v.id === context.frameworkVersionId)?.version || 'Sin definir';
    return [
      { label: 'Jurisdiccion', value: jurisdiction },
      { label: 'Marco', value: framework },
      { label: 'Version', value: version }
    ];
  }, [options.jurisdictions, options.frameworks, options.versions, context.jurisdictionId, context.frameworkId, context.frameworkVersionId]);

  if (loading) {
    return <div className="p-6 text-sm text-slate-500">Cargando wizard...</div>;
  }

  return (
    <WizardShell title={stepTitle} subtitle="Auditoria" step={step} totalSteps={TOTAL_STEPS} headerItems={headerItems} onClose={handleClose}>
      {step === 1 && (
        <ActaStep
          acta={acta}
          context={{
            companyId: context.companyId,
            selectedReinoId: scopeState.selectedReinoId || ''
          }}
          companies={options.companies}
          reinos={reinoCatalog}
          onChangeActa={setActa}
          onChangeContext={(next) => {
            if (Object.prototype.hasOwnProperty.call(next, 'companyId')) {
              setContext((prev) => ({ ...prev, companyId: next.companyId ?? '' }));
            }
            if (Object.prototype.hasOwnProperty.call(next, 'selectedReinoId')) {
              const nextReino = (next as any).selectedReinoId || '';
              void applyReinoSelection(nextReino);
            }
          }}
          onAI={handleAI}
          aiLoadingFields={aiLoadingFields}
          onSave={handleSave}
          onGenerateActa={handleGenerateActa}
          onNext={handleNext}
        />
      )}

      {step === 2 && (
        <RiskAnalysisStep
          draftId={draftId}
          onBack={handleBack}
          onNext={handleNext}
          onSave={handleSave}
        />
      )}

      {step === 3 && (
        <TeamStep
          team={team}
          teamUsers={companyUsers}
          onChange={setTeam}
          onBack={handleBack}
          onNext={handleNext}
          onSave={handleSave}
        />
      )}

      {step === 4 && (
        <ScopeStep
          domainIds={scopeState.domainIds}
          selectedDomainName={
            scopeState.selectedReinoId
              ? `${reinoCatalog.find((d) => d.id === scopeState.selectedReinoId)?.name || 'Reino'} (${scopeState.domainIds.length} dominios)`
              : null
          }
          obligationIds={scopeState.obligationIds}
          riskIds={scopeState.riskIds}
          derivedCounts={scopeState.derivedCounts}
          onChange={(next) => setScopeState((prev) => ({ ...prev, ...next, selectedReinoId: prev.selectedReinoId }))}
          onBack={handleBack}
          onNext={handleNext}
          onSave={handleSave}
        />
      )}

      {step === 5 && (
        <QuestionnaireStep
          riskIds={scopeState.riskIds}
          evaluations={questionnaire}
          onChange={setQuestionnaire}
          onBack={handleBack}
          onNext={handleNext}
          onSave={handleSave}
        />
      )}

      {step === 6 && (
        <ExtensionsStep
          extensions={extensions}
          onChange={setExtensions}
          onBack={handleBack}
          onFinish={handleFinish}
          onSave={handleSave}
        />
      )}
    </WizardShell>
  );
}
