'use client';

import React, {
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AlertTriangle,
  FileSearch,
  Filter,
  GitBranch,
  Layers3,
  RefreshCw,
  Target,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

type NodeType =
  | 'LAW'
  | 'DOMAIN'
  | 'OBLIGATION'
  | 'RISK'
  | 'CONTROL'
  | 'TEST'
  | 'EVIDENCE'
  | 'UNKNOWN';
type LayoutType = 'breadthfirst' | 'cose' | 'circle';
type KpiMode = 'exposure' | 'inspection' | 'committee' | 'evidence' | 'fragility' | 'dependency';
type SidePanelMode = 'detail' | 'defense' | 'actions' | 'evidence';
type StructuralMode = 'off' | 'highlight' | 'only';
type EdgeStructuralMode = 'all' | 'highlight' | 'only';

type QuestionId =
  | 'max_structural_vulnerability'
  | 'inspection_first_failures'
  | 'control_dependency_concentration'
  | 'critical_breakpoint_controls'
  | 'weak_evidence_defense'
  | 'domain_fragility_concentration'
  | 'obligation_fragility_concentration'
  | 'residual_risk_unmitigated'
  | 'hard_gates_without_support'
  | 'regulator_challenge_now'
  | 'fastest_exposure_reduction'
  | 'committee_first_view';
type DriverCategoryId = 'fragility' | 'dependencies' | 'defense';

type DriverQuestion = {
  id: string;
  order: number;
  text: string;
  presetId: QuestionId;
};

type DriverQuestionCategory = {
  id: DriverCategoryId;
  title: string;
  questions: DriverQuestion[];
};

type GraphViewRow = {
  element_kind: 'node' | 'edge';
  element_key: string;
  element_data: Record<string, any>;
};

type GraphResponse = {
  elements: GraphViewRow[];
  meta: {
    counts: {
      nodes: number;
      edges: number;
      total: number;
    };
    rootNodeId?: string;
  };
};

type CytoscapeCore = import('cytoscape').Core;
type CytoscapeElementDefinition = import('cytoscape').ElementDefinition;

type StructuralFilters = {
  hardGates: StructuralMode;
  dependencyRoots: StructuralMode;
  primaryEdges: EdgeStructuralMode;
  mandatoryEdges: EdgeStructuralMode;
};

type ScopeFilters = {
  obligationId: string;
  riskId: string;
};

type GraphVisibilityRules = {
  nodeTypeVisibility: Record<NodeType, boolean>;
  edgeTypeWhitelist: string[];
  maxNodes: number;
  useSubgraph: boolean;
};

type GraphEmphasisRules = {
  emphasizedNodeTypes: NodeType[];
  highlightedEdgeTypes: string[];
  dimNonRelevant: boolean;
};

type QuestionPreset = {
  id: QuestionId;
  title: string;
  prompt: string;
  intent: string;
  defaultLayout: LayoutType;
  mode: KpiMode;
  sidePanelMode: SidePanelMode;
  nodeTypes: NodeType[];
  edgeTypes: string[];
  highlightedEdgeTypes: string[];
  structuralDefaults: StructuralFilters;
  criticalityMinDefault: number;
  maxNodes: number;
  useSubgraph: boolean;
  relationPriority: string[];
};

type RankedNode = {
  id: string;
  label: string;
  type: NodeType;
  score: number;
};

type RankedControl = {
  id: string;
  label: string;
  share: number;
};

type GraphMetrics = {
  countsByType: Record<NodeType, number>;
  hardGateCount: number;
  dependencyRootCount: number;
  mandatoryEdgeCount: number;
  primaryEdgeCount: number;
  risksWithoutControl: number;
  weakDefenseControls: number;
  concentrationIndex: number;
  exposureIndex: number;
  topVulnerabilities: RankedNode[];
  topFragileDomains: RankedNode[];
  weakEvidenceControls: RankedNode[];
  topConcentratedControls: RankedControl[];
};

const ALL_NODE_TYPES: NodeType[] = ['DOMAIN', 'OBLIGATION', 'RISK', 'CONTROL'];
const ALL_EDGE_TYPES = [
  'DOMAIN_TO_DOMAIN',
  'DOMAIN_TO_OBLIGATION',
  'OBLIGATION_TO_OBLIGATION',
  'OBLIGATION_TO_RISK',
  'OBLIGATION_TO_CONTROL',
  'RISK_TO_CONTROL',
];

const LAYOUT_OPTIONS: Array<{ value: LayoutType; label: string }> = [
  { value: 'breadthfirst', label: 'Jerarquico' },
  { value: 'cose', label: 'Organico' },
  { value: 'circle', label: 'Radial' },
];

const NODE_TYPE_COLORS: Record<NodeType, string> = {
  LAW: '#0ea5e9',
  DOMAIN: '#06b6d4',
  OBLIGATION: '#facc15',
  RISK: '#ef4444',
  CONTROL: '#22c55e',
  TEST: '#14b8a6',
  EVIDENCE: '#60a5fa',
  UNKNOWN: '#94a3b8',
};

const NODE_TYPE_SHAPES: Record<NodeType, string> = {
  LAW: 'hexagon',
  DOMAIN: 'round-rectangle',
  OBLIGATION: 'rectangle',
  RISK: 'triangle',
  CONTROL: 'ellipse',
  TEST: 'triangle',
  EVIDENCE: 'pentagon',
  UNKNOWN: 'ellipse',
};

const EDGE_TYPE_COLORS: Record<string, string> = {
  DOMAIN_TO_DOMAIN: '#ffffff',
  DOMAIN_TO_OBLIGATION: '#ffffff',
  OBLIGATION_TO_OBLIGATION: '#ffffff',
  OBLIGATION_TO_RISK: '#ffffff',
  OBLIGATION_TO_CONTROL: '#ffffff',
  RISK_TO_CONTROL: '#ffffff',
};

const PRESET_BASE = {
  nodeTypes: ['DOMAIN', 'OBLIGATION', 'RISK', 'CONTROL'] as NodeType[],
  edgeTypes: ALL_EDGE_TYPES,
};

const QUESTION_PRESETS: QuestionPreset[] = [
  {
    id: 'max_structural_vulnerability',
    title: 'Vulnerabilidad estructural maxima',
    prompt: '¿Donde esta hoy nuestra mayor vulnerabilidad estructural AML?',
    intent: 'Localizar concentracion de fragilidad y exposicion residual para priorizar accion inmediata.',
    defaultLayout: 'cose',
    mode: 'exposure',
    sidePanelMode: 'actions',
    ...PRESET_BASE,
    highlightedEdgeTypes: ['OBLIGATION_TO_RISK', 'RISK_TO_CONTROL'],
    structuralDefaults: { hardGates: 'highlight', dependencyRoots: 'highlight', primaryEdges: 'highlight', mandatoryEdges: 'highlight' },
    criticalityMinDefault: 2,
    maxNodes: 130,
    useSubgraph: false,
    relationPriority: ['OBLIGATION_TO_RISK', 'RISK_TO_CONTROL'],
  },
  {
    id: 'inspection_first_failures',
    title: 'Fallas expuestas en inspeccion',
    prompt: '¿Que fallas podrian exponernos primero en una inspeccion?',
    intent: 'Aislar cadenas con baja defensa ante cuestionamiento regulatorio.',
    defaultLayout: 'breadthfirst',
    mode: 'inspection',
    sidePanelMode: 'evidence',
    nodeTypes: ['OBLIGATION', 'RISK', 'CONTROL'],
    edgeTypes: ['OBLIGATION_TO_RISK', 'RISK_TO_CONTROL', 'OBLIGATION_TO_CONTROL'],
    highlightedEdgeTypes: ['OBLIGATION_TO_CONTROL', 'RISK_TO_CONTROL'],
    structuralDefaults: { hardGates: 'highlight', dependencyRoots: 'off', primaryEdges: 'highlight', mandatoryEdges: 'only' },
    criticalityMinDefault: 3,
    maxNodes: 95,
    useSubgraph: true,
    relationPriority: ['OBLIGATION_TO_CONTROL', 'RISK_TO_CONTROL'],
  },
  {
    id: 'control_dependency_concentration',
    title: 'Concentracion de dependencia',
    prompt: '¿Que parte del sistema depende demasiado de pocos controles?',
    intent: 'Detectar concentracion de mitigacion y fragilidad por dependencia.',
    defaultLayout: 'circle',
    mode: 'dependency',
    sidePanelMode: 'defense',
    nodeTypes: ['OBLIGATION', 'RISK', 'CONTROL'],
    edgeTypes: ['OBLIGATION_TO_CONTROL', 'RISK_TO_CONTROL', 'OBLIGATION_TO_RISK'],
    highlightedEdgeTypes: ['RISK_TO_CONTROL', 'OBLIGATION_TO_CONTROL'],
    structuralDefaults: { hardGates: 'off', dependencyRoots: 'highlight', primaryEdges: 'highlight', mandatoryEdges: 'all' },
    criticalityMinDefault: 2,
    maxNodes: 90,
    useSubgraph: true,
    relationPriority: ['RISK_TO_CONTROL', 'OBLIGATION_TO_CONTROL'],
  },
  {
    id: 'critical_breakpoint_controls',
    title: 'Puntos de ruptura por control',
    prompt: '¿Cuales controles criticos, si fallan, nos llevan a punto de ruptura?',
    intent: 'Identificar controles cuya caida genera ruptura no compensable.',
    defaultLayout: 'circle',
    mode: 'fragility',
    sidePanelMode: 'actions',
    nodeTypes: ['RISK', 'CONTROL'],
    edgeTypes: ['RISK_TO_CONTROL'],
    highlightedEdgeTypes: ['RISK_TO_CONTROL'],
    structuralDefaults: { hardGates: 'highlight', dependencyRoots: 'highlight', primaryEdges: 'only', mandatoryEdges: 'all' },
    criticalityMinDefault: 3,
    maxNodes: 70,
    useSubgraph: true,
    relationPriority: ['RISK_TO_CONTROL'],
  },
  {
    id: 'weak_evidence_defense',
    title: 'Cumplimiento con defensa debil',
    prompt: '¿Donde tenemos cumplimiento aparente pero defensa probatoria debil?',
    intent: 'Detectar brecha entre control declarado y soporte de evidencia.',
    defaultLayout: 'breadthfirst',
    mode: 'evidence',
    sidePanelMode: 'evidence',
    nodeTypes: ['OBLIGATION', 'RISK', 'CONTROL'],
    edgeTypes: ['OBLIGATION_TO_CONTROL', 'RISK_TO_CONTROL'],
    highlightedEdgeTypes: ['OBLIGATION_TO_CONTROL'],
    structuralDefaults: { hardGates: 'highlight', dependencyRoots: 'off', primaryEdges: 'all', mandatoryEdges: 'highlight' },
    criticalityMinDefault: 2,
    maxNodes: 100,
    useSubgraph: false,
    relationPriority: ['OBLIGATION_TO_CONTROL'],
  },
  {
    id: 'domain_fragility_concentration',
    title: 'Fragilidad por dominio',
    prompt: '¿Cuales dominios concentran demasiada fragilidad?',
    intent: 'Priorizar intervencion por concentracion estructural de dominio.',
    defaultLayout: 'breadthfirst',
    mode: 'committee',
    sidePanelMode: 'defense',
    nodeTypes: ['DOMAIN', 'OBLIGATION', 'RISK'],
    edgeTypes: ['DOMAIN_TO_DOMAIN', 'DOMAIN_TO_OBLIGATION', 'OBLIGATION_TO_RISK'],
    highlightedEdgeTypes: ['DOMAIN_TO_OBLIGATION', 'OBLIGATION_TO_RISK'],
    structuralDefaults: { hardGates: 'highlight', dependencyRoots: 'highlight', primaryEdges: 'all', mandatoryEdges: 'all' },
    criticalityMinDefault: 2,
    maxNodes: 120,
    useSubgraph: false,
    relationPriority: ['DOMAIN_TO_OBLIGATION', 'OBLIGATION_TO_RISK'],
  },
  {
    id: 'obligation_fragility_concentration',
    title: 'Fragilidad por obligacion',
    prompt: '¿Que obligaciones concentran mas riesgo residual no mitigado?',
    intent: 'Ubicar obligaciones con mayor acumulacion de exposicion y poca mitigacion efectiva.',
    defaultLayout: 'cose',
    mode: 'exposure',
    sidePanelMode: 'actions',
    nodeTypes: ['OBLIGATION', 'RISK', 'CONTROL'],
    edgeTypes: ['OBLIGATION_TO_RISK', 'OBLIGATION_TO_CONTROL', 'RISK_TO_CONTROL'],
    highlightedEdgeTypes: ['OBLIGATION_TO_RISK', 'OBLIGATION_TO_CONTROL'],
    structuralDefaults: { hardGates: 'off', dependencyRoots: 'off', primaryEdges: 'highlight', mandatoryEdges: 'highlight' },
    criticalityMinDefault: 3,
    maxNodes: 110,
    useSubgraph: false,
    relationPriority: ['OBLIGATION_TO_RISK', 'OBLIGATION_TO_CONTROL'],
  },
  {
    id: 'residual_risk_unmitigated',
    title: 'Riesgo no mitigado real',
    prompt: '¿Cuales riesgos no estan realmente mitigados aunque parezca cubierto?',
    intent: 'Encontrar riesgo residual alto con mitigacion fragil.',
    defaultLayout: 'cose',
    mode: 'fragility',
    sidePanelMode: 'defense',
    nodeTypes: ['RISK', 'CONTROL'],
    edgeTypes: ['RISK_TO_CONTROL'],
    highlightedEdgeTypes: ['RISK_TO_CONTROL'],
    structuralDefaults: { hardGates: 'highlight', dependencyRoots: 'highlight', primaryEdges: 'highlight', mandatoryEdges: 'all' },
    criticalityMinDefault: 3,
    maxNodes: 75,
    useSubgraph: true,
    relationPriority: ['RISK_TO_CONTROL'],
  },
  {
    id: 'hard_gates_without_support',
    title: 'Hard gates sin soporte',
    prompt: '¿Que hard gates estan hoy sin cobertura estructural suficiente?',
    intent: 'Exponer puntos no compensables con defensa insuficiente.',
    defaultLayout: 'breadthfirst',
    mode: 'fragility',
    sidePanelMode: 'evidence',
    nodeTypes: ['OBLIGATION', 'RISK', 'CONTROL'],
    edgeTypes: ['OBLIGATION_TO_CONTROL', 'RISK_TO_CONTROL', 'OBLIGATION_TO_RISK'],
    highlightedEdgeTypes: ['OBLIGATION_TO_CONTROL', 'RISK_TO_CONTROL'],
    structuralDefaults: { hardGates: 'only', dependencyRoots: 'highlight', primaryEdges: 'all', mandatoryEdges: 'highlight' },
    criticalityMinDefault: 2,
    maxNodes: 70,
    useSubgraph: true,
    relationPriority: ['OBLIGATION_TO_CONTROL', 'RISK_TO_CONTROL'],
  },
  {
    id: 'regulator_challenge_now',
    title: 'Defensa ante cuestionamiento',
    prompt: '¿Que le mostramos al regulador si cuestiona este punto hoy?',
    intent: 'Armar narrativa defendible de trazabilidad estructural.',
    defaultLayout: 'breadthfirst',
    mode: 'inspection',
    sidePanelMode: 'defense',
    ...PRESET_BASE,
    highlightedEdgeTypes: ['OBLIGATION_TO_CONTROL', 'RISK_TO_CONTROL'],
    structuralDefaults: { hardGates: 'highlight', dependencyRoots: 'off', primaryEdges: 'highlight', mandatoryEdges: 'highlight' },
    criticalityMinDefault: 2,
    maxNodes: 90,
    useSubgraph: true,
    relationPriority: ['OBLIGATION_TO_CONTROL', 'RISK_TO_CONTROL', 'DOMAIN_TO_OBLIGATION'],
  },
  {
    id: 'fastest_exposure_reduction',
    title: 'Reduccion rapida de exposicion',
    prompt: '¿Cuales acciones bajarian mas rapido nuestra exposicion estructural?',
    intent: 'Priorizar acciones de alto impacto y ejecucion rapida.',
    defaultLayout: 'cose',
    mode: 'exposure',
    sidePanelMode: 'actions',
    nodeTypes: ['OBLIGATION', 'RISK', 'CONTROL'],
    edgeTypes: ['OBLIGATION_TO_RISK', 'RISK_TO_CONTROL', 'OBLIGATION_TO_CONTROL'],
    highlightedEdgeTypes: ['RISK_TO_CONTROL'],
    structuralDefaults: { hardGates: 'highlight', dependencyRoots: 'highlight', primaryEdges: 'highlight', mandatoryEdges: 'all' },
    criticalityMinDefault: 3,
    maxNodes: 85,
    useSubgraph: true,
    relationPriority: ['RISK_TO_CONTROL'],
  },
  {
    id: 'committee_first_view',
    title: 'Vista inicial para comite',
    prompt: '¿Que vulnerabilidades deberia ver primero el comite?',
    intent: 'Entregar lectura ejecutiva de 15 minutos para decision.',
    defaultLayout: 'breadthfirst',
    mode: 'committee',
    sidePanelMode: 'defense',
    ...PRESET_BASE,
    highlightedEdgeTypes: ['OBLIGATION_TO_RISK', 'RISK_TO_CONTROL'],
    structuralDefaults: { hardGates: 'highlight', dependencyRoots: 'highlight', primaryEdges: 'highlight', mandatoryEdges: 'all' },
    criticalityMinDefault: 3,
    maxNodes: 65,
    useSubgraph: false,
    relationPriority: ['OBLIGATION_TO_RISK', 'RISK_TO_CONTROL'],
  },
];

const QUESTION_PRESET_MAP: Record<QuestionId, QuestionPreset> = QUESTION_PRESETS.reduce((acc, preset) => {
  acc[preset.id] = preset;
  return acc;
}, {} as Record<QuestionId, QuestionPreset>);

const DRIVER_QUESTION_CATEGORIES: DriverQuestionCategory[] = [
  {
    id: 'fragility',
    title: 'Fragilidad estructural',
    questions: [
      { id: 'fragility_q1', order: 1, text: 'Cuales son los pocos controles cuya falla podria comprometer multiples obligaciones regulatorias?', presetId: 'control_dependency_concentration' },
      { id: 'fragility_q2', order: 2, text: 'Donde esta la mayor fragilidad estructural del sistema AML?', presetId: 'max_structural_vulnerability' },
      { id: 'fragility_q3', order: 3, text: 'Que controles son estructuralmente criticos para sostener el sistema de cumplimiento AML?', presetId: 'critical_breakpoint_controls' },
      { id: 'fragility_q4', order: 4, text: 'Cuantos controles son estructuralmente clave para la estabilidad del sistema AML?', presetId: 'control_dependency_concentration' },
      { id: 'fragility_q5', order: 5, text: 'Cuantas obligaciones regulatorias son estructuralmente clave para la estabilidad del sistema AML?', presetId: 'obligation_fragility_concentration' },
      { id: 'fragility_q6', order: 6, text: 'Que parte del sistema podria fallar primero si uno de esos controles criticos deja de operar?', presetId: 'critical_breakpoint_controls' },
      { id: 'fragility_q7', order: 7, text: 'Que controles sostienen el mayor numero de obligaciones regulatorias criticas?', presetId: 'control_dependency_concentration' },
    ],
  },
  {
    id: 'dependencies',
    title: 'Dependencias sistemicas',
    questions: [
      { id: 'dependencies_q8', order: 8, text: 'Que obligaciones regulatorias dependen de un unico control?', presetId: 'control_dependency_concentration' },
      { id: 'dependencies_q9', order: 9, text: 'Que controles son dependency roots dentro del sistema AML?', presetId: 'control_dependency_concentration' },
      { id: 'dependencies_q10', order: 10, text: 'Que nodos concentran mas dependencias regulatorias dentro del sistema AML?', presetId: 'control_dependency_concentration' },
      { id: 'dependencies_q11', order: 11, text: 'Donde depende el sistema AML excesivamente de pocos controles?', presetId: 'control_dependency_concentration' },
      { id: 'dependencies_q12', order: 12, text: 'Donde se concentra la mayor exposicion estructural dentro del sistema AML?', presetId: 'max_structural_vulnerability' },
      { id: 'dependencies_q13', order: 13, text: 'Que dominios regulatorios concentran mas obligaciones criticas?', presetId: 'domain_fragility_concentration' },
      { id: 'dependencies_q14', order: 14, text: 'Donde una falla podria propagarse a multiples obligaciones regulatorias?', presetId: 'critical_breakpoint_controls' },
    ],
  },
  {
    id: 'defense',
    title: 'Defensa regulatoria',
    questions: [
      { id: 'defense_q15', order: 15, text: 'Que controles funcionan como hard gates regulatorios dentro del sistema AML?', presetId: 'hard_gates_without_support' },
      { id: 'defense_q16', order: 16, text: 'Que obligaciones regulatorias dependen directamente de esos hard gates?', presetId: 'hard_gates_without_support' },
      { id: 'defense_q17', order: 17, text: 'Que ocurriria estructuralmente si uno de esos hard gates deja de operar?', presetId: 'hard_gates_without_support' },
      { id: 'defense_q18', order: 18, text: 'Que controles criticos carecen de evidencia suficiente para ser defendidos ante el regulador?', presetId: 'weak_evidence_defense' },
      { id: 'defense_q19', order: 19, text: 'Que obligaciones regulatorias criticas no pueden demostrarse con evidencia verificable hoy?', presetId: 'weak_evidence_defense' },
      { id: 'defense_q20', order: 20, text: 'Si el regulador inspeccionara hoy el sistema AML, que vulnerabilidades estructurales veria primero?', presetId: 'inspection_first_failures' },
      { id: 'defense_q21', order: 21, text: 'Que controles u obligaciones deberian priorizarse primero para reducir la exposicion regulatoria?', presetId: 'fastest_exposure_reduction' },
    ],
  },
];

const DEFAULT_DRIVER_QUESTION_ID = 'fragility_q2';

function toNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function getNodeType(data: Record<string, any>): NodeType {
  const type = String(data.type || 'UNKNOWN').toUpperCase();
  if (['LAW', 'DOMAIN', 'OBLIGATION', 'RISK', 'CONTROL', 'TEST', 'EVIDENCE'].includes(type)) {
    return type as NodeType;
  }
  return 'UNKNOWN';
}

function getElementId(row: GraphViewRow) {
  return String(row.element_data.id || row.element_key);
}

function getElementLabel(data: Record<string, any>) {
  return String(data.label || data.title || data.code || data.id || 'Elemento');
}

function getCriticalityLevel(data: Record<string, any>) {
  const criticality = toNumber(data.criticality, NaN);
  if (Number.isFinite(criticality) && criticality > 0) {
    return Math.max(0, Math.min(5, criticality));
  }
  const riskWeight = toNumber(data.risk_weight, toNumber(data.metadata?.risk_weight, 0));
  return Math.max(0, Math.min(5, Math.round(riskWeight / 20)));
}

function isHardGate(data: Record<string, any>) {
  return Boolean(data.is_hard_gate || data.metadata?.non_compensable);
}

function isDependencyRoot(data: Record<string, any>) {
  return Boolean(data.is_dependency_root || data.metadata?.is_dependency_root);
}

function isPrimaryEdge(data: Record<string, any>) {
  return Boolean(data.is_primary);
}

function isMandatoryEdge(data: Record<string, any>) {
  return Boolean(data.is_mandatory);
}

function scoreNode(row: GraphViewRow, degree = 0) {
  const data = row.element_data;
  const criticality = getCriticalityLevel(data);
  const riskWeight = toNumber(data.risk_weight, toNumber(data.metadata?.risk_weight, criticality * 20));
  const hardBoost = isHardGate(data) ? 28 : 0;
  const rootBoost = isDependencyRoot(data) ? 20 : 0;
  return criticality * 17 + riskWeight * 0.55 + degree * 4 + hardBoost + rootBoost;
}

function collectNeighborhood(seedId: string, edges: GraphViewRow[], depth: number) {
  const adjacency = new Map<string, Set<string>>();
  edges.forEach((edge) => {
    const source = String(edge.element_data.source || '');
    const target = String(edge.element_data.target || '');
    if (!source || !target) return;
    if (!adjacency.has(source)) adjacency.set(source, new Set());
    if (!adjacency.has(target)) adjacency.set(target, new Set());
    adjacency.get(source)?.add(target);
    adjacency.get(target)?.add(source);
  });

  const visited = new Set<string>([seedId]);
  let frontier = new Set<string>([seedId]);

  for (let level = 0; level < depth; level += 1) {
    const next = new Set<string>();
    frontier.forEach((nodeId) => {
      adjacency.get(nodeId)?.forEach((neighborId) => {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          next.add(neighborId);
        }
      });
    });
    if (next.size === 0) break;
    frontier = next;
  }

  return visited;
}

function createVisibilityRules(preset: QuestionPreset): GraphVisibilityRules {
  const nodeTypeVisibility: Record<NodeType, boolean> = {
    LAW: false,
    DOMAIN: false,
    OBLIGATION: false,
    RISK: false,
    CONTROL: false,
    TEST: false,
    EVIDENCE: false,
    UNKNOWN: false,
  };

  preset.nodeTypes.forEach((nodeType) => {
    nodeTypeVisibility[nodeType] = true;
  });

  return {
    nodeTypeVisibility,
    edgeTypeWhitelist: preset.edgeTypes,
    maxNodes: Math.max(180, preset.maxNodes),
    useSubgraph: preset.useSubgraph,
  };
}

function createEmphasisRules(preset: QuestionPreset): GraphEmphasisRules {
  return {
    emphasizedNodeTypes: preset.nodeTypes,
    highlightedEdgeTypes: preset.highlightedEdgeTypes,
    dimNonRelevant: true,
  };
}

function buildCytoscapeStylesheet() {
  return [
    {
      selector: 'node',
      style: {
        shape: 'data(vizShape)',
        'background-color': 'data(vizColor)',
        'background-opacity': 'data(vizFillOpacity)',
        opacity: 'data(vizOpacity)',
        label: 'data(vizLabel)',
        color: '#e2ecff',
        'font-size': 'data(vizFontSize)',
        'font-weight': 600,
        'text-wrap': 'wrap',
        'text-max-width': 'data(vizTextMaxWidth)',
        'text-valign': 'center',
        'text-halign': 'center',
        'text-outline-width': 1,
        'text-outline-color': 'rgba(2, 6, 23, 0.82)',
        width: 'data(vizNodeWidth)',
        height: 'data(vizNodeHeight)',
        'border-width': 'data(vizBorderWidth)',
        'border-color': 'data(vizBorderColor)',
        'overlay-opacity': 0,
      },
    },
    {
      selector: 'edge',
      style: {
        width: 'data(vizWidth)',
        'curve-style': 'bezier',
        'line-style': 'data(vizLineStyle)',
        'line-color': 'data(vizColor)',
        'target-arrow-color': 'data(vizColor)',
        'target-arrow-shape': 'triangle',
        label: 'data(vizLabel)',
        color: '#c7ddff',
        'font-size': 5,
        'font-weight': 700,
        'text-background-opacity': 0.9,
        'text-background-color': 'rgba(6, 12, 26, 0.9)',
        'text-background-padding': 3,
        'text-rotation': 'autorotate',
        opacity: 'data(vizOpacity)',
        'overlay-opacity': 0,
      },
    },
    {
      selector: '.is-focused',
      style: {
        'border-color': '#ffffff',
        'border-width': 5,
        opacity: 1,
      },
    },
    {
      selector: '.is-neighbor',
      style: {
        opacity: 1,
      },
    },
    {
      selector: '.is-faded',
      style: {
        opacity: 0.1,
      },
    },
  ];
}

export default function GraphSimulationClient() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<CytoscapeCore | null>(null);

  const [selectedQuestion, setSelectedQuestion] = useState<QuestionId>('max_structural_vulnerability');
  const [selectedDriverQuestionId, setSelectedDriverQuestionId] = useState<string>(DEFAULT_DRIVER_QUESTION_ID);
  const activePreset = QUESTION_PRESET_MAP[selectedQuestion];

  const [graph, setGraph] = useState<GraphResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<GraphViewRow | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>(activePreset.defaultLayout);
  const [scopeFilters, setScopeFilters] = useState<ScopeFilters>({ obligationId: '', riskId: '' });
  const [structuralFilters, setStructuralFilters] = useState<StructuralFilters>(activePreset.structuralDefaults);
  const [criticalityMin, setCriticalityMin] = useState(0);
  const [graphVisibilityRules, setGraphVisibilityRules] = useState<GraphVisibilityRules>(() => createVisibilityRules(activePreset));
  const [graphEmphasisRules, setGraphEmphasisRules] = useState<GraphEmphasisRules>(() => createEmphasisRules(activePreset));
  const [highlightedEdgeTypes, setHighlightedEdgeTypes] = useState<string[]>(activePreset.highlightedEdgeTypes);
  const [guardrailMessage, setGuardrailMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const preset = QUESTION_PRESET_MAP[selectedQuestion];
    setSelectedLayout(preset.defaultLayout);
    setStructuralFilters(preset.structuralDefaults);
    setCriticalityMin(preset.criticalityMinDefault);
    setGraphVisibilityRules(createVisibilityRules(preset));
    setGraphEmphasisRules(createEmphasisRules(preset));
    setHighlightedEdgeTypes(preset.highlightedEdgeTypes);
    setScopeFilters({ obligationId: '', riskId: '' });
    setSelectedElement(null);
    setGuardrailMessage(null);
  }, [selectedQuestion]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();

    const requestedNodeTypes = new Set<string>(['OBLIGATION', 'RISK']);
    Object.entries(graphVisibilityRules.nodeTypeVisibility).forEach(([nodeType, visible]) => {
      if (visible && nodeType !== 'UNKNOWN') {
        requestedNodeTypes.add(nodeType);
      }
    });
    requestedNodeTypes.forEach((nodeType) => params.append('node_type', nodeType));

    graphVisibilityRules.edgeTypeWhitelist.forEach((edgeType) => params.append('edge_type', edgeType));

    if (structuralFilters.hardGates === 'only') params.set('hard_gate', 'true');
    if (structuralFilters.dependencyRoots === 'only') params.set('dependency_root', 'true');
    if (structuralFilters.primaryEdges === 'only') params.set('primary', 'true');
    if (structuralFilters.mandatoryEdges === 'only') params.set('mandatory', 'true');

    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const response = await fetch(`/api/graph?${params.toString()}`, {
          signal: controller.signal,
          cache: 'no-store',
        });
        const payload = (await response.json()) as GraphResponse | { error?: string };
        if (!response.ok) {
          throw new Error((payload as { error?: string }).error || 'No se pudo cargar el grafo');
        }

        startTransition(() => {
          setGraph(payload as GraphResponse);
        });
      } catch (fetchError: any) {
        if (fetchError?.name === 'AbortError') return;
        setError(fetchError?.message || 'No se pudo cargar el grafo');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => controller.abort();
  }, [criticalityMin, graphVisibilityRules, reloadKey, structuralFilters]);

  const availableObligationOptions = useMemo(() => {
    const nodes = (graph?.elements || []).filter((element) => element.element_kind === 'node');
    return nodes
      .filter((element) => getNodeType(element.element_data) === 'OBLIGATION')
      .map((element) => ({ id: getElementId(element), label: getElementLabel(element.element_data) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [graph]);

  const availableRiskOptions = useMemo(() => {
    const nodes = (graph?.elements || []).filter((element) => element.element_kind === 'node');
    return nodes
      .filter((element) => getNodeType(element.element_data) === 'RISK')
      .map((element) => ({ id: getElementId(element), label: getElementLabel(element.element_data) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [graph]);

  const processed = useMemo(() => {
    const elements = graph?.elements || [];
    let nodes = elements.filter((element) => element.element_kind === 'node');
    let edges = elements.filter((element) => element.element_kind === 'edge');

    nodes = nodes.filter((node) => graphVisibilityRules.nodeTypeVisibility[getNodeType(node.element_data)]);
    let nodeIds = new Set(nodes.map((node) => getElementId(node)));

    edges = edges.filter((edge) => {
      const source = String(edge.element_data.source || '');
      const target = String(edge.element_data.target || '');
      return nodeIds.has(source) && nodeIds.has(target);
    });

    const scopeSeed = new Set<string>();
    if (scopeFilters.obligationId) {
      const obligationEntityId = scopeFilters.obligationId.split(':')[1] || scopeFilters.obligationId;
      nodes.forEach((node) => {
        const nodeId = getElementId(node);
        if (nodeId === scopeFilters.obligationId || String(node.element_data.obligation_id || '') === obligationEntityId) {
          scopeSeed.add(nodeId);
        }
      });
    }

    if (scopeFilters.riskId) {
      const riskEntityId = scopeFilters.riskId.split(':')[1] || scopeFilters.riskId;
      nodes.forEach((node) => {
        const nodeId = getElementId(node);
        if (nodeId === scopeFilters.riskId || String(node.element_data.risk_id || '') === riskEntityId) {
          scopeSeed.add(nodeId);
        }
      });
    }

    if (scopeSeed.size > 0) {
      const expanded = new Set(scopeSeed);
      edges.forEach((edge) => {
        const source = String(edge.element_data.source || '');
        const target = String(edge.element_data.target || '');
        if (scopeSeed.has(source) || scopeSeed.has(target)) {
          expanded.add(source);
          expanded.add(target);
        }
      });
      nodes = nodes.filter((node) => expanded.has(getElementId(node)));
      nodeIds = new Set(nodes.map((node) => getElementId(node)));
      edges = edges.filter((edge) => {
        const source = String(edge.element_data.source || '');
        const target = String(edge.element_data.target || '');
        return nodeIds.has(source) && nodeIds.has(target);
      });
    }

    if (criticalityMin > 0) {
      const nodesBeforeCriticality = nodes;
      const edgesBeforeCriticality = edges;

      const seedIds = new Set(
        nodes
          .filter((node) => {
            const level = getCriticalityLevel(node.element_data);
            return level >= criticalityMin || isHardGate(node.element_data);
          })
          .map((node) => getElementId(node))
      );

      // Preserve one-hop context to avoid isolated nodes when applying criticidad.
      if (seedIds.size > 0) {
        const keepIds = new Set(seedIds);
        edges.forEach((edge) => {
          const source = String(edge.element_data.source || '');
          const target = String(edge.element_data.target || '');
          if (keepIds.has(source) || keepIds.has(target)) {
            keepIds.add(source);
            keepIds.add(target);
          }
        });

        nodes = nodes.filter((node) => keepIds.has(getElementId(node)));
        nodeIds = new Set(nodes.map((node) => getElementId(node)));
        edges = edges.filter((edge) => {
          const source = String(edge.element_data.source || '');
          const target = String(edge.element_data.target || '');
          return nodeIds.has(source) && nodeIds.has(target);
        });
      }

      // Prevent overly aggressive criticidad presets from collapsing the graph into isolated boxes.
      if (nodes.length < 8 || edges.length < 6) {
        nodes = nodesBeforeCriticality;
        edges = edgesBeforeCriticality;
        nodeIds = new Set(nodes.map((node) => getElementId(node)));
      }
    }

    const degreeById = new Map<string, number>();
    edges.forEach((edge) => {
      const source = String(edge.element_data.source || '');
      const target = String(edge.element_data.target || '');
      degreeById.set(source, (degreeById.get(source) || 0) + 1);
      degreeById.set(target, (degreeById.get(target) || 0) + 1);
    });

    const salienceById = new Map<string, number>();
    nodes.forEach((node) => {
      const nodeId = getElementId(node);
      salienceById.set(nodeId, scoreNode(node, degreeById.get(nodeId) || 0));
    });

    let focusNodeId: string | undefined;
    if (graphVisibilityRules.useSubgraph && nodes.length > 0) {
      const selectedId = selectedElement?.element_kind === 'node' ? getElementId(selectedElement) : null;
      if (selectedId && salienceById.has(selectedId)) {
        focusNodeId = selectedId;
      } else {
        focusNodeId = [...salienceById.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      }

      if (focusNodeId) {
        const keep = collectNeighborhood(focusNodeId, edges, 2);
        nodes = nodes.filter((node) => keep.has(getElementId(node)));
        nodeIds = new Set(nodes.map((node) => getElementId(node)));
        edges = edges.filter((edge) => {
          const source = String(edge.element_data.source || '');
          const target = String(edge.element_data.target || '');
          return nodeIds.has(source) && nodeIds.has(target);
        });
      }
    }

    if (nodes.length > graphVisibilityRules.maxNodes) {
      const sorted = [...nodes].sort((a, b) => {
        const scoreA = salienceById.get(getElementId(a)) || 0;
        const scoreB = salienceById.get(getElementId(b)) || 0;
        return scoreB - scoreA;
      });
      const keepIds = new Set(sorted.slice(0, graphVisibilityRules.maxNodes).map((node) => getElementId(node)));
      nodes = nodes.filter((node) => keepIds.has(getElementId(node)));
      nodeIds = new Set(nodes.map((node) => getElementId(node)));
      edges = edges.filter((edge) => {
        const source = String(edge.element_data.source || '');
        const target = String(edge.element_data.target || '');
        return nodeIds.has(source) && nodeIds.has(target);
      });
    }

    const finalDegree = new Map<string, number>();
    edges.forEach((edge) => {
      const source = String(edge.element_data.source || '');
      const target = String(edge.element_data.target || '');
      finalDegree.set(source, (finalDegree.get(source) || 0) + 1);
      finalDegree.set(target, (finalDegree.get(target) || 0) + 1);
    });

    const finalSalience = new Map<string, number>();
    nodes.forEach((node) => {
      const nodeId = getElementId(node);
      finalSalience.set(nodeId, scoreNode(node, finalDegree.get(nodeId) || 0));
    });

    const sortedScores = [...finalSalience.values()].sort((a, b) => b - a);
    const labelThreshold = sortedScores[Math.max(0, Math.floor(sortedScores.length * 0.35))] || 0;

    const highlightedTypeSet = new Set([
      ...highlightedEdgeTypes,
      ...graphEmphasisRules.highlightedEdgeTypes,
    ]);

    const cyNodes = nodes.map((node) => {
      const data = node.element_data;
      const nodeType = getNodeType(data);
      const nodeId = getElementId(node);
      const salience = finalSalience.get(nodeId) || 0;
      const criticality = getCriticalityLevel(data);
      const hardGate = isHardGate(data);
      const dependencyRoot = isDependencyRoot(data);
      const degree = finalDegree.get(nodeId) || 0;
      const emphasizedByType = graphEmphasisRules.emphasizedNodeTypes.includes(nodeType);
      const structuralBoost =
        (structuralFilters.hardGates === 'highlight' && hardGate) ||
        (structuralFilters.dependencyRoots === 'highlight' && dependencyRoot);
      const shouldLabel = hardGate || dependencyRoot || salience >= labelThreshold || criticality >= Math.max(3, criticalityMin) || nodeId === focusNodeId;

      let opacity = 0.2;
      if (salience >= labelThreshold || structuralBoost) opacity = 1;
      else if (emphasizedByType) opacity = 0.78;
      else if (!graphEmphasisRules.dimNonRelevant) opacity = 0.7;

      const badges: string[] = [];
      if (hardGate) badges.push('HG');
      if (dependencyRoot) badges.push('DR');
      const baseSize = Math.max(32, Math.min(94, 30 + criticality * 7 + (hardGate ? 8 : 0) + (dependencyRoot ? 6 : 0)));
      const isObligation = nodeType === 'OBLIGATION';
      const nodeWidth = isObligation ? Math.max(58, baseSize * 1.45) : baseSize;
      const nodeHeight = isObligation ? Math.max(34, baseSize * 0.82) : baseSize;
      const textMaxWidth = Math.max(44, Math.round(nodeWidth - 14));

      return {
        data: {
          ...data,
          vizColor: NODE_TYPE_COLORS[nodeType],
          vizShape: NODE_TYPE_SHAPES[nodeType],
          vizNodeWidth: nodeWidth,
          vizNodeHeight: nodeHeight,
          vizFillOpacity: Math.max(0.48, opacity),
          vizOpacity: Math.min(1, opacity + (structuralBoost ? 0.15 : 0)),
          vizFontSize: 5,
          vizTextMaxWidth: textMaxWidth,
          vizBorderWidth: hardGate ? 5 : dependencyRoot ? 4 : Math.max(2, Math.min(4, 2 + degree * 0.15)),
          vizBorderColor: hardGate ? '#ef4444' : dependencyRoot ? '#f59e0b' : '#dbeafe',
          vizLabel: shouldLabel ? `${getElementLabel(data)}${badges.length ? ` [${badges.join('|')}]` : ''}` : '',
        },
      } as CytoscapeElementDefinition;
    });

    const cyEdges = edges.map((edge) => {
      const data = edge.element_data;
      const edgeType = String(data.edge_type || 'EDGE');
      const weight = Math.max(1, toNumber(data.weight, toNumber(data.strength, 1)));
      const primary = isPrimaryEdge(data);
      const mandatory = isMandatoryEdge(data);
      const highlightedByType = highlightedTypeSet.has(edgeType);
      const highlightedByStructural =
        (structuralFilters.primaryEdges === 'highlight' && primary) ||
        (structuralFilters.mandatoryEdges === 'highlight' && mandatory);
      const shouldLabel = mandatory || primary || highlightedByType;

      const baseWidth = Math.max(2.2, Math.min(7.5, weight * 1.35));
      const width = mandatory ? Math.max(4.4, baseWidth + 1.4) : primary ? Math.max(3.4, baseWidth + 0.8) : baseWidth;

      let opacity = 0.58;
      if (highlightedByType || highlightedByStructural || mandatory || primary) opacity = 0.98;
      else if (!graphEmphasisRules.dimNonRelevant) opacity = 0.78;

      return {
        data: {
          ...data,
          vizColor: EDGE_TYPE_COLORS[edgeType] || '#ffffff',
          vizWidth: width,
          vizOpacity: opacity,
          vizLineStyle: mandatory || primary || highlightedByType ? 'solid' : 'dashed',
          vizLabel: shouldLabel ? String(data.label || edgeType).replaceAll('_', ' ') : '',
        },
      } as CytoscapeElementDefinition;
    });

    return {
      nodes,
      edges,
      cyElements: [...cyNodes, ...cyEdges],
      salienceById: finalSalience,
      focusNodeId,
    };
  }, [criticalityMin, graph, graphEmphasisRules, graphVisibilityRules, highlightedEdgeTypes, scopeFilters, selectedElement, structuralFilters]);

  const elementLookup = useMemo(() => {
    const lookup = new Map<string, GraphViewRow>();
    processed.nodes.forEach((node) => lookup.set(getElementId(node), node));
    processed.edges.forEach((edge) => lookup.set(getElementId(edge), edge));
    return lookup;
  }, [processed]);

  useEffect(() => {
    if (!selectedElement) return;
    if (!elementLookup.has(getElementId(selectedElement))) {
      setSelectedElement(null);
    }
  }, [elementLookup, selectedElement]);

  useEffect(() => {
    let mounted = true;

    const renderGraph = async () => {
      if (!containerRef.current) return;

      const cytoscapeImport = (await import('cytoscape')) as any;
      const cytoscapeFactory = (cytoscapeImport.default ?? cytoscapeImport) as (options: any) => CytoscapeCore;
      if (!mounted || !containerRef.current) return;

      cyRef.current?.destroy();

      const cy = cytoscapeFactory({
        container: containerRef.current,
        elements: processed.cyElements,
        layout: {
          name: selectedLayout,
          animate: false,
          fit: true,
          padding: 64,
          directed: true,
          spacingFactor: selectedLayout === 'circle' ? 1.18 : 1.55,
        },
        minZoom: 0.18,
        maxZoom: 3,
        style: buildCytoscapeStylesheet(),
      });

      cy.on('tap', 'node, edge', (event) => {
        const current = event.target;
        const elementId = String(current.data('id') || '');
        const matched = elementLookup.get(elementId) || null;
        setSelectedElement(matched);

        cy.elements().removeClass('is-focused is-neighbor is-faded');
        cy.elements().addClass('is-faded');
        current.removeClass('is-faded').addClass('is-focused');

        if (current.isNode()) {
          const neighborhood = current.closedNeighborhood();
          neighborhood.removeClass('is-faded').addClass('is-neighbor');
          current.removeClass('is-neighbor').addClass('is-focused');
        } else {
          current.connectedNodes().removeClass('is-faded').addClass('is-neighbor');
        }
      });

      cy.on('tap', (event) => {
        if (event.target !== cy) return;
        setSelectedElement(null);
        cy.elements().removeClass('is-focused is-neighbor is-faded');
      });

      cyRef.current = cy;
    };

    renderGraph();

    return () => {
      mounted = false;
      cyRef.current?.destroy();
      cyRef.current = null;
    };
  }, [elementLookup, processed.cyElements, selectedLayout]);

  const metrics = useMemo<GraphMetrics>(() => {
    const countsByType: Record<NodeType, number> = {
      LAW: 0,
      DOMAIN: 0,
      OBLIGATION: 0,
      RISK: 0,
      CONTROL: 0,
      TEST: 0,
      EVIDENCE: 0,
      UNKNOWN: 0,
    };

    processed.nodes.forEach((node) => {
      const type = getNodeType(node.element_data);
      countsByType[type] = (countsByType[type] || 0) + 1;
    });

    const hardGateCount = processed.nodes.filter((node) => isHardGate(node.element_data)).length;
    const dependencyRootCount = processed.nodes.filter((node) => isDependencyRoot(node.element_data)).length;
    const primaryEdgeCount = processed.edges.filter((edge) => isPrimaryEdge(edge.element_data)).length;
    const mandatoryEdgeCount = processed.edges.filter((edge) => isMandatoryEdge(edge.element_data)).length;

    const riskToControlEdges = processed.edges.filter(
      (edge) => String(edge.element_data.edge_type || '') === 'RISK_TO_CONTROL'
    );

    const risksWithControl = new Set(riskToControlEdges.map((edge) => String(edge.element_data.source || '')));
    const risksWithoutControl = processed.nodes.filter((node) => {
      const type = getNodeType(node.element_data);
      return type === 'RISK' && !risksWithControl.has(getElementId(node));
    }).length;

    const weakEvidenceControls = processed.nodes.filter((node) => {
      const data = node.element_data;
      if (getNodeType(data) !== 'CONTROL') return false;
      if (!data.evidence_required) return false;
      const strength = toNumber(data.evidence_strength, 0);
      return strength <= 0;
    });

    const incomingByControl = new Map<string, number>();
    riskToControlEdges.forEach((edge) => {
      const target = String(edge.element_data.target || '');
      incomingByControl.set(target, (incomingByControl.get(target) || 0) + 1);
    });

    const maxIncoming = Math.max(0, ...incomingByControl.values());
    const concentrationIndex = riskToControlEdges.length
      ? Math.round((maxIncoming / riskToControlEdges.length) * 100)
      : 0;

    const rankedNodes: RankedNode[] = processed.nodes
      .map((node) => ({
        id: getElementId(node),
        label: getElementLabel(node.element_data),
        type: getNodeType(node.element_data),
        score: Math.round(processed.salienceById.get(getElementId(node)) || 0),
      }))
      .sort((a, b) => b.score - a.score);

    const topVulnerabilities = rankedNodes.slice(0, 5);
    const topFragileDomains = rankedNodes.filter((item) => item.type === 'DOMAIN').slice(0, 5);

    const topConcentratedControls: RankedControl[] = [...incomingByControl.entries()]
      .map(([controlId, count]) => {
        const node = processed.nodes.find((candidate) => getElementId(candidate) === controlId);
        const label = node ? getElementLabel(node.element_data) : controlId;
        const share = riskToControlEdges.length ? Math.round((count / riskToControlEdges.length) * 100) : 0;
        return { id: controlId, label, share };
      })
      .sort((a, b) => b.share - a.share)
      .slice(0, 5);

    const topQuartile = rankedNodes.slice(0, Math.max(1, Math.round(rankedNodes.length * 0.25)));
    const avgTopScore = topQuartile.length > 0
      ? topQuartile.reduce((sum, item) => sum + item.score, 0) / topQuartile.length
      : 0;

    const exposureIndex = Math.max(0, Math.min(100, Math.round((avgTopScore / 180) * 100)));

    return {
      countsByType,
      hardGateCount,
      dependencyRootCount,
      mandatoryEdgeCount,
      primaryEdgeCount,
      risksWithoutControl,
      weakDefenseControls: weakEvidenceControls.length,
      concentrationIndex,
      exposureIndex,
      topVulnerabilities,
      topFragileDomains,
      weakEvidenceControls: weakEvidenceControls
        .map((node) => ({
          id: getElementId(node),
          label: getElementLabel(node.element_data),
          type: getNodeType(node.element_data),
          score: Math.round(processed.salienceById.get(getElementId(node)) || 0),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 8),
      topConcentratedControls,
    };
  }, [processed]);

  const selectedControlMetadata = useMemo(() => {
    const pickValue = (data: Record<string, any>, key: string, fallback = '-') => {
      const metadata = data.metadata && typeof data.metadata === 'object' ? data.metadata : {};
      const value = data[key] ?? data[key.toLowerCase()] ?? metadata[key] ?? metadata[key.toLowerCase()];
      if (value === null || value === undefined || value === '') return fallback;
      return typeof value === 'string' ? value : JSON.stringify(value);
    };

    if (!selectedElement || selectedElement.element_kind !== 'node') return null;
    const data = selectedElement.element_data;
    if (getNodeType(data) !== 'CONTROL') return null;

    return {
      Name: pickValue(data, 'Name', getElementLabel(data)),
      failure_mode: pickValue(data, 'failure_mode'),
      test_strategy: pickValue(data, 'test_strategy'),
      dependency_logic: pickValue(data, 'dependency_logic'),
    };
  }, [selectedElement]);

  const selectedDriverQuestion = useMemo(() => {
    for (const category of DRIVER_QUESTION_CATEGORIES) {
      const found = category.questions.find((question) => question.id === selectedDriverQuestionId);
      if (found) return found;
    }
    return null;
  }, [selectedDriverQuestionId]);
  const overFiltered = !loading && !error && processed.nodes.length > 0 && processed.nodes.length < 12;

  const toggleNodeTypeVisibility = (nodeType: NodeType) => {
    setGraphVisibilityRules((current) => {
      const next = {
        ...current,
        nodeTypeVisibility: {
          ...current.nodeTypeVisibility,
          [nodeType]: !current.nodeTypeVisibility[nodeType],
        },
      };

      const enabledCount = Object.values(next.nodeTypeVisibility).filter(Boolean).length;
      if (enabledCount === 0) {
        setGuardrailMessage('Debe quedar al menos una capa de nodo visible.');
        return current;
      }
      setGuardrailMessage(null);
      return next;
    });
  };

  const resetToPreset = () => {
    const preset = QUESTION_PRESET_MAP[selectedQuestion];
    setSelectedLayout(preset.defaultLayout);
    setStructuralFilters(preset.structuralDefaults);
    setCriticalityMin(preset.criticalityMinDefault);
    setGraphVisibilityRules(createVisibilityRules(preset));
    setGraphEmphasisRules(createEmphasisRules(preset));
    setHighlightedEdgeTypes(preset.highlightedEdgeTypes);
    setScopeFilters({ obligationId: '', riskId: '' });
    setSelectedElement(null);
    setGuardrailMessage(null);
    setReloadKey((current) => current + 1);
  };

  const selectDriverQuestion = (question: DriverQuestion) => {
    setSelectedDriverQuestionId(question.id);
    setSelectedQuestion(question.presetId);
  };

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}>AML structural fragility cockpit</div>
            <h1 className={styles.title}>Simulacion de decision ejecutiva AML</h1>
            <p className={styles.subtitle}>
              Las pruebas de estrés deben permitir a la organización analizar el impacto de distintos escenarios
              sobre los riesgos a los que está expuesta.
            </p>
            <div className={styles.heroBadges}>
              <span className={styles.badge}><Layers3 size={14} /> {processed.nodes.length} nodos visibles</span>
              <span className={styles.badge}><GitBranch size={14} /> {processed.edges.length} aristas visibles</span>
            </div>
          </div>

          <div className={styles.heroActions}>
            <button type="button" className={styles.dangerButton} onClick={() => router.push('/score/dashboard')}>
              <XCircle size={14} />
              Cerrar graph
            </button>
            <button type="button" className={styles.ghostButton} onClick={resetToPreset}>
              <RefreshCw size={14} />
              Reset preset
            </button>
          </div>
        </header>

        <div className={styles.workspace}>
          <aside className={styles.leftRail}>
            <section className={styles.filtersCard}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.cardEyebrow}>Filtros estructurales</div>
                  <div className={styles.cardTitle}>Alcance, visibilidad, layout y leyenda</div>
                </div>
                <Filter size={16} className={styles.cardIcon} />
              </div>

              <div className={styles.filterControlsRow}>
                <div className={styles.controlBlock}>
                  <div className={styles.controlLabel}>Alcance</div>
                  <select
                    className={styles.selectInput}
                    value={scopeFilters.obligationId}
                    onChange={(event) => setScopeFilters((current) => ({ ...current, obligationId: event.target.value }))}
                  >
                    <option value="">Todas las obligaciones</option>
                    {availableObligationOptions.map((option) => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                  <select
                    className={styles.selectInput}
                    value={scopeFilters.riskId}
                    onChange={(event) => setScopeFilters((current) => ({ ...current, riskId: event.target.value }))}
                  >
                    <option value="">Todos los riesgos</option>
                    {availableRiskOptions.map((option) => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.controlBlock}>
                  <div className={styles.controlLabel}>Visibilidad por capa</div>
                  <div className={styles.nodeVisibility}>
                    {ALL_NODE_TYPES.map((nodeType) => (
                      <label key={nodeType}>
                        <input
                          type="checkbox"
                          checked={graphVisibilityRules.nodeTypeVisibility[nodeType]}
                          onChange={() => toggleNodeTypeVisibility(nodeType)}
                        />
                        <span>{nodeType}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className={styles.controlBlock}>
                  <div className={styles.controlLabel}>Layout recomendado</div>
                  <div className={styles.layoutOptions}>
                    {LAYOUT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`${styles.layoutButton} ${selectedLayout === option.value ? styles.layoutActive : ''}`}
                        onClick={() => setSelectedLayout(option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.controlBlock}>
                  <div className={styles.controlLabel}>Leyenda visual</div>
                  <div className={styles.legendList}>
                    <div className={styles.legendItem}>
                      <span className={`${styles.legendSymbol} ${styles.legendObligation}`}>▭</span>
                      <span className={styles.legendText}>OBLIGATION = Amarillo Rectangulo</span>
                    </div>
                    <div className={styles.legendItem}>
                      <span className={`${styles.legendSymbol} ${styles.legendRisk}`}>▲</span>
                      <span className={styles.legendText}>RISK = Rojo Triangulo</span>
                    </div>
                    <div className={styles.legendItem}>
                      <span className={`${styles.legendSymbol} ${styles.legendControl}`}>●</span>
                      <span className={styles.legendText}>CONTROL = Verde Circulo</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className={styles.sidePanel}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.cardEyebrow}>Panel analitico</div>
                  <div className={styles.cardTitle}>Control seleccionado y detalle de pregunta</div>
                </div>
                <FileSearch size={16} className={styles.cardIcon} />
              </div>
              <div className={styles.metadataList}>
                <article className={styles.metadataCard}>
                  <div className={styles.cardEyebrow}>Control seleccionado</div>
                  {!selectedControlMetadata && (
                    <div className={styles.emptyState}>Selecciona un nodo CONTROL en el grafo para ver su metadata.</div>
                  )}
                  {selectedControlMetadata && (
                    <>
                      <div className={styles.metadataRow}>
                        <span>Name</span>
                        <strong>{selectedControlMetadata.Name}</strong>
                      </div>
                      <div className={styles.metadataRow}>
                        <span>failure_mode</span>
                        <strong>{selectedControlMetadata.failure_mode}</strong>
                      </div>
                      <div className={styles.metadataRow}>
                        <span>test_strategy</span>
                        <strong>{selectedControlMetadata.test_strategy}</strong>
                      </div>
                      <div className={styles.metadataRow}>
                        <span>dependency_logic</span>
                        <strong>{selectedControlMetadata.dependency_logic}</strong>
                      </div>
                    </>
                  )}
                </article>

                <article className={styles.metadataCard}>
                  <div className={styles.cardEyebrow}>Detalle de pregunta activa</div>
                  <div className={styles.metadataRow}>
                    <span>Pregunta</span>
                    <strong>{selectedDriverQuestion?.text ?? activePreset.prompt}</strong>
                  </div>
                  <div className={styles.metadataRow}>
                    <span>Foco analitico</span>
                    <strong>{activePreset.intent}</strong>
                  </div>
                  <div className={styles.metadataRow}>
                    <span>Layout aplicado</span>
                    <strong>{LAYOUT_OPTIONS.find((option) => option.value === selectedLayout)?.label ?? selectedLayout}</strong>
                  </div>
                  <div className={styles.metadataRow}>
                    <span>Relaciones prioritarias</span>
                    <strong>{activePreset.relationPriority.join(', ')}</strong>
                  </div>
                </article>
              </div>
            </section>
          </aside>

          <div className={styles.mainColumn}>
            <section className={styles.filtersCard}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.cardEyebrow}>Filtro principal</div>
                  <div className={styles.cardTitle}>Preguntas-driver AML</div>
                </div>
                <Filter size={16} className={styles.cardIcon} />
              </div>

              <div className={styles.driverCategoryGrid}>
                {DRIVER_QUESTION_CATEGORIES.map((category) => (
                  <article key={category.id} className={styles.driverCategoryCard}>
                    <div className={styles.driverCategoryTitle}>{category.title}</div>
                    <div className={styles.driverQuestionList}>
                      {category.questions.map((question) => {
                        const isActive = selectedDriverQuestionId === question.id;
                        return (
                          <button
                            key={question.id}
                            type="button"
                            className={`${styles.driverQuestionButton} ${isActive ? styles.driverQuestionActive : ''}`}
                            onClick={() => selectDriverQuestion(question)}
                          >
                            <span className={styles.driverQuestionOrder}>{question.order}.</span>
                            <span className={styles.driverQuestionText}>{question.text}</span>
                          </button>
                        );
                      })}
                    </div>
                  </article>
                ))}
              </div>

              {guardrailMessage && <div className={styles.guardrail}><AlertTriangle size={14} /> {guardrailMessage}</div>}
            </section>

            <section className={styles.graphCard}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.cardEyebrow}>Canvas de decision</div>
                  <div className={styles.cardTitle}>{activePreset.title}</div>
                  <p className={styles.cardSubtitle}>{activePreset.intent}</p>
                </div>
                <div className={styles.countPills}>
                  <span className={styles.pill}><Target size={12} /> {processed.nodes.length} nodos</span>
                  <span className={styles.pill}><GitBranch size={12} /> {processed.edges.length} aristas</span>
                  <span className={styles.pill}><TrendingUp size={12} /> exp {metrics.exposureIndex}/100</span>
                </div>
              </div>

              {overFiltered && (
                <div className={styles.warningBanner}>
                  <AlertTriangle size={15} /> El filtro actual deja pocos nodos; considera bajar criticidad o resetear preset.
                </div>
              )}

              {loading && <div className={styles.emptyState}>Cargando vista estructural...</div>}
              {error && <div className={styles.emptyState}>{error}</div>}
              {!loading && !error && processed.cyElements.length === 0 && (
                <div className={styles.emptyState}>No hay elementos para la pregunta seleccionada con la configuracion actual.</div>
              )}
              <div ref={containerRef} className={styles.graphCanvas} />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

