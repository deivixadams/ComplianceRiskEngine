import { Prisma } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import prisma from '@/lib/prisma';
import type { AuthContext } from '@/lib/auth-server';

type ControlEvaluation = {
  riskId: string;
  controlId: string;
  status: 'cumple' | 'parcial' | 'no_cumple' | '';
  notes: string;
  howToEvaluate?: string;
  evidence?: string[];
};

type ExtensionItem = { title: string; notes: string; evidence?: string[] };

type DraftPayload = {
  id: string;
  acta?: any;
  scopeConfig?: any;
  objectives?: any;
  questionnaire?: ControlEvaluation[];
  manualExtensions?: ExtensionItem[];
  windowStart?: string | null;
  windowEnd?: string | null;
};

type RiskControlRow = {
  risk_id: string;
  risk_name: string;
  risk_description: string | null;
  risk_type_name: string | null;
  risk_layer_name: string | null;
  control_id: string;
  control_name: string;
  control_description: string | null;
  coverage_notes: string | null;
};

const toArray = <T>(value: T | T[] | undefined | null) => (Array.isArray(value) ? value : value ? [value] : []);

const joinClean = (parts: Array<string | null | undefined>, divider = ' / ') =>
  parts.map((part) => (part || '').trim()).filter(Boolean).join(divider);

const formatDate = (value?: string | null) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' });
};

const summarize = (acta: any, counts: { hallazgos: number; parciales: number; noCumple: number; positivos: number }) => {
  const objetivo = (acta?.objetivo || '').trim();
  const alcance = (acta?.alcance || '').trim();
  const summaryParts: string[] = [];
  if (objetivo) summaryParts.push(`Objetivo: ${objetivo}`);
  if (alcance) summaryParts.push(`Alcance: ${alcance}`);
  summaryParts.push(
    `Hallazgos: ${counts.hallazgos} (No cumple: ${counts.noCumple}, Parcial: ${counts.parciales}).`
  );
  summaryParts.push(`Aspectos positivos: ${counts.positivos}.`);
  return summaryParts.join(' ');
};

const conclude = (counts: { hallazgos: number; positivos: number }) => {
  if (counts.hallazgos === 0) {
    return 'La evaluación no identificó hallazgos críticos. Se recomienda mantener los controles actuales y su monitoreo continuo.';
  }
  return `Se recomienda atender los ${counts.hallazgos} hallazgos identificados, priorizando aquellos de mayor impacto, y reforzar los controles con desempeño positivo (${counts.positivos}).`;
};

export async function buildReportData(auth: AuthContext, draftId: string) {
  const draft = await prisma.corpus.assessment_draft.findFirst({
    where: { id: draftId, tenant_id: auth.tenantId }
  });
  if (!draft) return null;

  const payload: DraftPayload = {
    id: draft.id,
    acta: draft.acta ?? {},
    scopeConfig: draft.scope_config ?? {},
    objectives: draft.objectives ?? {},
    questionnaire: Array.isArray(draft.questionnaire) ? (draft.questionnaire as ControlEvaluation[]) : [],
    manualExtensions: Array.isArray(draft.manual_extensions) ? (draft.manual_extensions as ExtensionItem[]) : [],
    windowStart: draft.window_start ? new Date(draft.window_start).toISOString() : null,
    windowEnd: draft.window_end ? new Date(draft.window_end).toISOString() : null
  };

  const evaluations = payload.questionnaire ?? [];
  const riskIds = Array.from(new Set(evaluations.map((ev) => ev.riskId).filter(Boolean)));
  const controlIds = Array.from(new Set(evaluations.map((ev) => ev.controlId).filter(Boolean)));

  const rows = riskIds.length && controlIds.length
    ? await prisma.$queryRaw(Prisma.sql`
        SELECT
          r.id AS risk_id,
          r.name AS risk_name,
          r.description AS risk_description,
          rt.name AS risk_type_name,
          rl.name AS risk_layer_name,
          c.id AS control_id,
          c.name AS control_name,
          c.description AS control_description,
          mrc.coverage_notes AS coverage_notes
        FROM graph.map_risk_control mrc
        JOIN graph.control c ON c.id = mrc.control_id
        JOIN graph.risk r ON r.id = mrc.risk_id
        LEFT JOIN catalogos.corpus_catalog_risk_type rt ON rt.id = r.risk_type_id
        LEFT JOIN catalogos.corpus_catalog_risk_layer rl ON rl.id = r.risk_layer_id
        WHERE mrc.risk_id = ANY(${riskIds}::uuid[])
          AND mrc.control_id = ANY(${controlIds}::uuid[])
        ORDER BY r.name ASC, c.name ASC
      `)
    : [];

  const riskMap = new Map<string, RiskControlRow>();
  const controlMap = new Map<string, RiskControlRow>();
  const pairCoverage = new Map<string, string | null>();

  (rows || []).forEach((row) => {
    if (!riskMap.has(row.risk_id)) riskMap.set(row.risk_id, row);
    if (!controlMap.has(row.control_id)) controlMap.set(row.control_id, row);
    pairCoverage.set(`${row.risk_id}::${row.control_id}`, row.coverage_notes ?? null);
  });

  const hallazgos: any[] = [];
  const aspectosPositivos: any[] = [];
  const notasAuditor: any[] = [];

  let noCumple = 0;
  let parciales = 0;
  let positivos = 0;

  evaluations.forEach((ev) => {
    if (!ev.status) return;
    const pairKey = `${ev.riskId}::${ev.controlId}`;
    const coverageNotes = pairCoverage.get(pairKey) || '';
    const controlRow = controlMap.get(ev.controlId);
    const riskRow = riskMap.get(ev.riskId);
    const controlName = controlRow?.control_name || 'Control sin nombre';
    const riskLevel = joinClean([riskRow?.risk_layer_name, riskRow?.risk_type_name], ' / ');
    const evidencias = (ev.evidence || []).join(', ');
    const notas = (ev.notes || '').trim();
    const criterio = (ev.howToEvaluate || coverageNotes || '').trim();

    if (ev.status === 'cumple') {
      positivos += 1;
      aspectosPositivos.push({
        titulo: controlName,
        notas,
        evidencias
      });
    } else {
      if (ev.status === 'no_cumple') noCumple += 1;
      if (ev.status === 'parcial') parciales += 1;
      hallazgos.push({
        numero: hallazgos.length + 1,
        titulo: controlName,
        criterio,
        condicion: notas,
        causa: '',
        efecto_riesgo: '',
        nivel_riesgo: riskLevel,
        recomendacion: '',
        respuesta_auditado: '',
        evidencias,
        observaciones: notas
      });
    }
  });

  (payload.manualExtensions || []).forEach((item) => {
    notasAuditor.push({
      titulo: item.title || 'Nota del auditor',
      notas: item.notes || '',
      evidencias: toArray(item.evidence).join(', ')
    });
  });

  const counts = {
    hallazgos: hallazgos.length,
    parciales,
    noCumple,
    positivos
  };

  const acta = payload.acta || {};
  const objetivos = typeof payload.objectives === 'string'
    ? payload.objectives
    : payload.objectives?.narrative || acta.objetivo || '';
  const periodoInicio = formatDate(acta.periodo_inicio || payload.windowStart);
  const periodoFin = formatDate(acta.periodo_fin || payload.windowEnd);

  return {
    empresa: acta.entidad_nombre || '',
    periodo_inicio: periodoInicio,
    periodo_fin: periodoFin,
    fecha_emision: formatDate(new Date().toISOString()),
    resumen_ejecutivo: summarize(acta, counts),
    objetivos,
    alcance: acta.alcance || '',
    metodologia: acta.metodologia || '',
    hallazgos,
    aspectos_positivos: aspectosPositivos,
    notas_auditor: notasAuditor,
    conclusion_final: conclude({ hallazgos: counts.hallazgos, positivos: counts.positivos }),
    auditor_nombre: acta.lider_equipo || '',
    auditor_cargo: 'Lider de Proyecto',
    aprobador_nombre: '',
    aprobador_cargo: '',
    auditor_firma: '',
    aprobador_firma: '',
    fecha_firmas: formatDate(new Date().toISOString())
  };
}

async function resolveStatusId(preferredCodes: string[]) {
  const preferred = await prisma.corpus_catalog_status.findFirst({
    where: { code: { in: preferredCodes, mode: 'insensitive' }, is_active: true },
    orderBy: { sort_order: 'asc' }
  });
  if (preferred) return preferred.id;

  const fallback = await prisma.corpus_catalog_status.findFirst({
    where: { is_active: true },
    orderBy: { sort_order: 'asc' }
  });
  return fallback?.id ?? 1;
}

export async function materializeDraft(auth: AuthContext, draftId: string) {
  const draft = await prisma.corpus.assessment_draft.findFirst({
    where: { id: draftId, tenant_id: auth.tenantId }
  });
  if (!draft) return null;

  const companyId = draft.company_id;
  const frameworkVersionId = draft.framework_version_id;
  if (!companyId || !frameworkVersionId) {
    throw new Error('Draft missing company/framework');
  }

  const marker = `CRE_DRAFT_ID:${draftId}`;
  const acta = draft.acta ?? {};
  const periodStartRaw = acta.periodo_inicio || draft.window_start || new Date().toISOString().slice(0, 10);
  const periodEndRaw = acta.periodo_fin || draft.window_end || new Date().toISOString().slice(0, 10);
  const periodStart = new Date(periodStartRaw);
  const periodEnd = new Date(periodEndRaw);
  const year = Number.isNaN(periodStart.getTime()) ? new Date().getFullYear() : periodStart.getFullYear();

  const assessmentName = acta.entidad_nombre
    ? `Auditoría AML - ${acta.entidad_nombre}`
    : `Auditoría AML ${year}`;

  let assessment = await prisma.corpusAssessment.findFirst({
    where: {
      company_id: companyId,
      framework_version_id: frameworkVersionId,
      scope_notes: { contains: marker }
    }
  });

  const statusId = await resolveStatusId(['completed', 'final', 'completado', 'cerrado', 'done']);

  if (!assessment) {
    assessment = await prisma.corpusAssessment.create({
      data: {
        company_id: companyId,
        framework_version_id: frameworkVersionId,
        name: assessmentName,
        scope_notes: marker,
        status_id: statusId,
        created_by: auth.userId
      }
    });
  }

  const existingEvaluation = await prisma.corpusEvaluation.findFirst({
    where: {
      assessment_id: assessment.id,
      notes: { contains: marker }
    }
  });

  if (!existingEvaluation) {
    await prisma.corpusEvaluation.create({
      data: {
        assessment_id: assessment.id,
        period_start: Number.isNaN(periodStart.getTime()) ? new Date() : periodStart,
        period_end: Number.isNaN(periodEnd.getTime()) ? new Date() : periodEnd,
        status_id: statusId,
        notes: marker,
        created_by: auth.userId
      }
    });
  }

  await prisma.corpus.assessment_draft.update({
    where: { id: draftId },
    data: {
      status: 'materialized',
      updated_at: new Date()
    }
  });

  return assessment.id;
}

export async function renderReportDocx(data: Record<string, any>) {
  const templatePath = path.resolve('C:\\_CRE\\PLANTILLA_INFORME_AML.docx');
  const content = await fs.readFile(templatePath, 'binary');
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{{', end: '}}' }
  });

  doc.render(data);

  return doc.getZip().generate({ type: 'nodebuffer' });
}

