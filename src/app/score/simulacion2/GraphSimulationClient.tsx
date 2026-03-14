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
  Maximize2,
  Minimize2,
  Network,
  RefreshCw,
  Sparkles,
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
  domainId: string;
  obligationId: string;
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

const MODE_OPTIONS: Array<{ value: KpiMode; label: string; helper: string }> = [
  { value: 'exposure', label: 'Modo Exposicion', helper: 'Concentracion de vulnerabilidades.' },
  { value: 'inspection', label: 'Modo Inspeccion', helper: 'Defensa ante cuestionamiento regulatorio.' },
  { value: 'committee', label: 'Modo Comite', helper: 'Lectura ejecutiva para decision.' },
  { value: 'evidence', label: 'Modo Evidencia', helper: 'Cobertura probatoria vs exposicion real.' },
  { value: 'fragility', label: 'Modo Fragilidad', helper: 'Hard gates y puntos de ruptura.' },
  { value: 'dependency', label: 'Modo Dependencia', helper: 'Riesgo de cascada por concentracion.' },
];

const NODE_TYPE_COLORS: Record<NodeType, string> = {
  LAW: '#0ea5e9',
  DOMAIN: '#06b6d4',
  OBLIGATION: '#f59e0b',
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
  RISK: 'diamond',
  CONTROL: 'ellipse',
  TEST: 'triangle',
  EVIDENCE: 'pentagon',
  UNKNOWN: 'ellipse',
};

const EDGE_TYPE_COLORS: Record<string, string> = {
  DOMAIN_TO_DOMAIN: '#0ea5e9',
  DOMAIN_TO_OBLIGATION: '#06b6d4',
  OBLIGATION_TO_OBLIGATION: '#a78bfa',
  OBLIGATION_TO_RISK: '#f97316',
  OBLIGATION_TO_CONTROL: '#38bdf8',
  RISK_TO_CONTROL: '#f43f5e',
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
    useSubgraph: false,
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
        'font-weight': 700,
        'text-wrap': 'wrap',
        'text-max-width': 150,
        'text-valign': 'center',
        'text-halign': 'center',
        'text-outline-width': 1,
        'text-outline-color': 'rgba(2, 6, 23, 0.74)',
        width: 'data(vizSize)',
        height: 'data(vizSize)',
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
        'font-size': 8,
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
  const activePreset = QUESTION_PRESET_MAP[selectedQuestion];

  const [graph, setGraph] = useState<GraphResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<GraphViewRow | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>(activePreset.defaultLayout);
  const [kpiMode, setKpiMode] = useState<KpiMode>(activePreset.mode);
  const [scopeFilters, setScopeFilters] = useState<ScopeFilters>({ domainId: '', obligationId: '' });
  const [structuralFilters, setStructuralFilters] = useState<StructuralFilters>(activePreset.structuralDefaults);
  const [criticalityMin, setCriticalityMin] = useState(0);
  const [graphVisibilityRules, setGraphVisibilityRules] = useState<GraphVisibilityRules>(() => createVisibilityRules(activePreset));
  const [graphEmphasisRules, setGraphEmphasisRules] = useState<GraphEmphasisRules>(() => createEmphasisRules(activePreset));
  const [highlightedEdgeTypes, setHighlightedEdgeTypes] = useState<string[]>(activePreset.highlightedEdgeTypes);
  const [guardrailMessage, setGuardrailMessage] = useState<string | null>(null);
  const [isSubgraphMode, setIsSubgraphMode] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const preset = QUESTION_PRESET_MAP[selectedQuestion];
    setSelectedLayout(preset.defaultLayout);
    setKpiMode(preset.mode);
    setStructuralFilters(preset.structuralDefaults);
    setCriticalityMin(0);
    setGraphVisibilityRules(createVisibilityRules(preset));
    setGraphEmphasisRules(createEmphasisRules(preset));
    setHighlightedEdgeTypes(preset.highlightedEdgeTypes);
    setScopeFilters({ domainId: '', obligationId: '' });
    setSelectedElement(null);
    setGuardrailMessage(null);
    setIsSubgraphMode(false);
  }, [selectedQuestion]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();

    Object.entries(graphVisibilityRules.nodeTypeVisibility).forEach(([nodeType, visible]) => {
      if (visible && nodeType !== 'UNKNOWN') {
        params.append('node_type', nodeType);
      }
    });

    graphVisibilityRules.edgeTypeWhitelist.forEach((edgeType) => params.append('edge_type', edgeType));

    if (structuralFilters.hardGates === 'only') params.set('hard_gate', 'true');
    if (structuralFilters.dependencyRoots === 'only') params.set('dependency_root', 'true');
    if (structuralFilters.primaryEdges === 'only') params.set('primary', 'true');
    if (structuralFilters.mandatoryEdges === 'only') params.set('mandatory', 'true');
    if (criticalityMin > 0) params.set('criticality_min', String(criticalityMin));

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
          setIsSubgraphMode(false);
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

  const availableDomainOptions = useMemo(() => {
    const nodes = (graph?.elements || []).filter((element) => element.element_kind === 'node');
    return nodes
      .filter((element) => getNodeType(element.element_data) === 'DOMAIN')
      .map((element) => ({ id: getElementId(element), label: getElementLabel(element.element_data) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [graph]);

  const availableObligationOptions = useMemo(() => {
    const nodes = (graph?.elements || []).filter((element) => element.element_kind === 'node');
    return nodes
      .filter((element) => getNodeType(element.element_data) === 'OBLIGATION')
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
    if (scopeFilters.domainId) {
      const domainEntityId = scopeFilters.domainId.split(':')[1] || scopeFilters.domainId;
      nodes.forEach((node) => {
        const nodeId = getElementId(node);
        if (nodeId === scopeFilters.domainId || String(node.element_data.domain_id || '') === domainEntityId) {
          scopeSeed.add(nodeId);
        }
      });
    }

    if (scopeFilters.obligationId) {
      const obligationEntityId = scopeFilters.obligationId.split(':')[1] || scopeFilters.obligationId;
      nodes.forEach((node) => {
        const nodeId = getElementId(node);
        if (nodeId === scopeFilters.obligationId || String(node.element_data.obligation_id || '') === obligationEntityId) {
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

      return {
        data: {
          ...data,
          vizColor: NODE_TYPE_COLORS[nodeType],
          vizShape: NODE_TYPE_SHAPES[nodeType],
          vizSize: Math.max(32, Math.min(94, 30 + criticality * 7 + (hardGate ? 8 : 0) + (dependencyRoot ? 6 : 0))),
          vizFillOpacity: Math.max(0.48, opacity),
          vizOpacity: Math.min(1, opacity + (structuralBoost ? 0.15 : 0)),
          vizFontSize: shouldLabel ? 10 : 8,
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

      const baseWidth = Math.max(1.6, Math.min(7, weight * 1.25));
      const width = mandatory ? Math.max(4.4, baseWidth + 1.4) : primary ? Math.max(3.4, baseWidth + 0.8) : baseWidth;

      let opacity = 0.22;
      if (highlightedByType || highlightedByStructural || mandatory || primary) opacity = 0.95;
      else if (!graphEmphasisRules.dimNonRelevant) opacity = 0.6;

      return {
        data: {
          ...data,
          vizColor: mandatory ? '#f59e0b' : primary ? '#38bdf8' : EDGE_TYPE_COLORS[edgeType] || '#64748b',
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

  const kpiCards = useMemo(() => {
    if (kpiMode === 'inspection') {
      return [
        { label: 'Riesgos sin control directo', value: metrics.risksWithoutControl, hint: 'Posibles observaciones inmediatas.' },
        { label: 'Controles con defensa debil', value: metrics.weakDefenseControls, hint: 'Evidencia insuficiente para soportar eficacia.' },
        { label: 'Edges mandatorios visibles', value: metrics.mandatoryEdgeCount, hint: 'Cadena regulatoria obligatoria en foco.' },
        { label: 'Exposicion estructural', value: `${metrics.exposureIndex}/100`, hint: 'Indicador agregado para comite.' },
      ];
    }

    if (kpiMode === 'committee') {
      return [
        { label: 'Top vulnerabilidades', value: metrics.topVulnerabilities.length, hint: 'Nodos criticos para decision inmediata.' },
        { label: 'Concentracion de dependencia', value: `${metrics.concentrationIndex}%`, hint: 'Dependencia sobre pocos controles.' },
        { label: 'Hard gates en foco', value: metrics.hardGateCount, hint: 'Puntos no compensables.' },
        { label: 'Exposicion estructural', value: `${metrics.exposureIndex}/100`, hint: 'Riesgo sistemico consolidado.' },
      ];
    }

    if (kpiMode === 'evidence') {
      return [
        { label: 'Controles con evidencia debil', value: metrics.weakDefenseControls, hint: 'Brecha entre cumplimiento y defensa.' },
        { label: 'Edges mandatorios', value: metrics.mandatoryEdgeCount, hint: 'Relaciones de satisfaccion formal.' },
        { label: 'Riesgos sin control', value: metrics.risksWithoutControl, hint: 'Exposicion sin mitigacion evidente.' },
        { label: 'Exposicion estructural', value: `${metrics.exposureIndex}/100`, hint: 'Lectura ejecutiva de fragilidad.' },
      ];
    }

    if (kpiMode === 'dependency') {
      return [
        { label: 'Indice de concentracion', value: `${metrics.concentrationIndex}%`, hint: 'Mayor share de mitigacion por control.' },
        { label: 'Dependency roots', value: metrics.dependencyRootCount, hint: 'Nodos con impacto en cascada.' },
        { label: 'Hard gates', value: metrics.hardGateCount, hint: 'Puntos de ruptura no compensables.' },
        { label: 'Top controles concentrados', value: metrics.topConcentratedControls.length, hint: 'Dependencias prioritarias.' },
      ];
    }

    if (kpiMode === 'fragility') {
      return [
        { label: 'Hard gates criticos', value: metrics.hardGateCount, hint: 'Rupturas potenciales inmediatas.' },
        { label: 'Riesgos sin cobertura', value: metrics.risksWithoutControl, hint: 'Nodos de exposicion sin mitigacion.' },
        { label: 'Dependency roots', value: metrics.dependencyRootCount, hint: 'Candidatos a falla en cascada.' },
        { label: 'Exposicion estructural', value: `${metrics.exposureIndex}/100`, hint: 'Nivel agregado de fragilidad.' },
      ];
    }

    return [
      { label: 'Exposicion estructural', value: `${metrics.exposureIndex}/100`, hint: 'Concentracion de vulnerabilidad visible.' },
      { label: 'Hard gates', value: metrics.hardGateCount, hint: 'Elementos no compensables en vista.' },
      { label: 'Dependency roots', value: metrics.dependencyRootCount, hint: 'Nodos que disparan cascadas.' },
      { label: 'Concentracion de dependencia', value: `${metrics.concentrationIndex}%`, hint: 'Dependencia sobre pocos controles.' },
    ];
  }, [kpiMode, metrics]);

  const modelCoverage = useMemo(() => {
    const ordered: NodeType[] = ['LAW', 'DOMAIN', 'OBLIGATION', 'RISK', 'CONTROL', 'TEST', 'EVIDENCE'];
    const visibleLayers = ordered.filter((type) => metrics.countsByType[type] > 0);
    return visibleLayers.length > 0 ? visibleLayers.join(' -> ') : 'Sin capas visibles';
  }, [metrics.countsByType]);

  const selectedNode = useMemo(
    () => (selectedElement?.element_kind === 'node' ? selectedElement : null),
    [selectedElement]
  );

  const selectedNodeDataEntries = useMemo(() => {
    if (!selectedNode) return [];
    return Object.entries(selectedNode.element_data)
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .slice(0, 20);
  }, [selectedNode]);
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

  const fitGraph = () => {
    cyRef.current?.fit(undefined, 56);
  };

  const resetToPreset = () => {
    const preset = QUESTION_PRESET_MAP[selectedQuestion];
    setSelectedLayout(preset.defaultLayout);
    setKpiMode(preset.mode);
    setStructuralFilters(preset.structuralDefaults);
    setCriticalityMin(0);
    setGraphVisibilityRules(createVisibilityRules(preset));
    setGraphEmphasisRules(createEmphasisRules(preset));
    setHighlightedEdgeTypes(preset.highlightedEdgeTypes);
    setScopeFilters({ domainId: '', obligationId: '' });
    setSelectedElement(null);
    setGuardrailMessage(null);
    setIsSubgraphMode(false);
    setReloadKey((current) => current + 1);
  };

  const loadSubgraph = async () => {
    if (!selectedElement || selectedElement.element_kind !== 'node') return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/graph/subgraph/${encodeURIComponent(getElementId(selectedElement))}`, {
        cache: 'no-store',
      });
      const payload = (await response.json()) as GraphResponse | { error?: string };
      if (!response.ok) {
        throw new Error((payload as { error?: string }).error || 'No se pudo cargar el subgrafo');
      }
      startTransition(() => {
        setGraph(payload as GraphResponse);
        setIsSubgraphMode(true);
      });
    } catch (subgraphError: any) {
      setError(subgraphError?.message || 'No se pudo cargar el subgrafo');
    } finally {
      setLoading(false);
    }
  };

  const actionRecommendations = useMemo(() => {
    const actions = [] as Array<{ title: string; reason: string; priority: 'Alta' | 'Media' }>;

    if (metrics.hardGateCount > 0) {
      actions.push({
        title: 'Blindar hard gates con plan de cierre verificable',
        reason: `${metrics.hardGateCount} hard gates visibles siguen siendo puntos no compensables.`,
        priority: 'Alta',
      });
    }

    if (metrics.concentrationIndex >= 35) {
      actions.push({
        title: 'Reducir concentracion de dependencia en controles puente',
        reason: `Indice de concentracion actual ${metrics.concentrationIndex}% sugiere vulnerabilidad de cascada.`,
        priority: 'Alta',
      });
    }

    if (metrics.weakDefenseControls > 0) {
      actions.push({
        title: 'Fortalecer evidencia de eficacia en controles criticos',
        reason: `${metrics.weakDefenseControls} controles requieren evidencia robusta para defensa regulatoria.`,
        priority: 'Alta',
      });
    }

    if (metrics.risksWithoutControl > 0) {
      actions.push({
        title: 'Asignar mitigacion explicita a riesgos sin control directo',
        reason: `${metrics.risksWithoutControl} riesgos en vista carecen de relacion de mitigacion visible.`,
        priority: 'Media',
      });
    }

    if (actions.length === 0) {
      actions.push({
        title: 'Revisar criticidad minima para ampliar sensibilidad',
        reason: 'No se observan acciones criticas inmediatas con la configuracion actual.',
        priority: 'Media',
      });
    }

    return actions.slice(0, 4);
  }, [metrics]);

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}>AML structural fragility cockpit</div>
            <h1 className={styles.title}>Simulacion de decision ejecutiva AML</h1>
            <p className={styles.subtitle}>
              Grafo heterogeneo multicapa: ley → dominio → obligacion → riesgo → control → prueba → evidencia.
              Cobertura activa en dataset: <strong>{modelCoverage}</strong>.
            </p>
            <div className={styles.heroBadges}>
              <span className={styles.badge}><Layers3 size={14} /> {processed.nodes.length} nodos visibles</span>
              <span className={styles.badge}><GitBranch size={14} /> {processed.edges.length} aristas visibles</span>
              <span className={styles.badge}><Sparkles size={14} /> {isSubgraphMode ? 'Subgrafo activo' : 'Vista de pregunta activa'}</span>
            </div>
          </div>

          <div className={styles.heroActions}>
            <button type="button" className={styles.dangerButton} onClick={() => router.push('/score/dashboard')}>
              <XCircle size={14} />
              Cerrar graph
            </button>
            <button type="button" className={styles.ghostButton} onClick={fitGraph}>
              <Maximize2 size={14} />
              Ajustar vista
            </button>
            <button type="button" className={styles.ghostButton} onClick={resetToPreset}>
              <RefreshCw size={14} />
              Reset preset
            </button>
            {isSubgraphMode ? (
              <button type="button" className={styles.primaryButton} onClick={() => setReloadKey((current) => current + 1)}>
                <Minimize2 size={14} />
                Volver al grafo de pregunta
              </button>
            ) : (
              <button
                type="button"
                className={styles.primaryButton}
                onClick={loadSubgraph}
                disabled={!selectedElement || selectedElement.element_kind !== 'node'}
              >
                <Network size={14} />
                Explorar subgrafo
              </button>
            )}
          </div>
        </header>

        <section className={styles.modeStrip}>
          {MODE_OPTIONS.map((mode) => (
            <button
              key={mode.value}
              type="button"
              className={`${styles.modeButton} ${kpiMode === mode.value ? styles.modeActive : ''}`}
              onClick={() => setKpiMode(mode.value)}
              title={mode.helper}
            >
              {mode.label}
            </button>
          ))}
        </section>

        <section className={styles.kpiStrip}>
          {kpiCards.map((kpi) => (
            <article key={kpi.label} className={styles.kpiCard}>
              <div className={styles.kpiLabel}>{kpi.label}</div>
              <div className={styles.kpiValue}>{kpi.value}</div>
              <div className={styles.kpiHint}>{kpi.hint}</div>
            </article>
          ))}
        </section>

        <div className={styles.workspace}>
          <aside className={styles.filtersCard}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardEyebrow}>Filtro principal</div>
                <div className={styles.cardTitle}>Preguntas-driver AML</div>
              </div>
              <Filter size={16} className={styles.cardIcon} />
            </div>

            <div className={styles.questionList}>
              {QUESTION_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`${styles.questionCard} ${selectedQuestion === preset.id ? styles.questionActive : ''}`}
                  onClick={() => setSelectedQuestion(preset.id)}
                >
                  <div className={styles.questionText}>{preset.prompt}</div>
                  <div className={styles.questionMeta}>
                    <span>{preset.defaultLayout}</span>
                    <span>{preset.mode}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className={styles.controlBlock}>
              <div className={styles.controlLabel}>Alcance</div>
              <select
                className={styles.selectInput}
                value={scopeFilters.domainId}
                onChange={(event) => setScopeFilters((current) => ({ ...current, domainId: event.target.value }))}
              >
                <option value="">Todos los dominios</option>
                {availableDomainOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
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
            </div>

            <div className={styles.controlBlock}>
              <div className={styles.controlLabel}>Criticidad minima</div>
              <input
                className={styles.range}
                type="range"
                min="0"
                max="5"
                step="1"
                value={criticalityMin}
                onChange={(event) => setCriticalityMin(Number(event.target.value))}
              />
              <div className={styles.rangeMeta}>
                <span>0</span>
                <strong>{criticalityMin}</strong>
                <span>5</span>
              </div>
            </div>

            <div className={styles.controlBlock}>
              <div className={styles.advancedArea}>
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
            </div>

            {guardrailMessage && <div className={styles.guardrail}><AlertTriangle size={14} /> {guardrailMessage}</div>}
          </aside>

          <div className={styles.mainColumn}>
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

            <section className={styles.sidePanel}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.cardEyebrow}>Panel analitico</div>
                </div>
                <FileSearch size={16} className={styles.cardIcon} />
              </div>
              <div className={styles.panelHorizontal}>
                <div className={styles.panelBlock}>
                  <div className={styles.controlLabel}>Detalle del nodo seleccionado</div>
                  {!selectedNode && (
                    <div className={styles.emptyState}>Haz clic en un nodo del grafo para ver su detalle.</div>
                  )}
                  {selectedNode && (
                    <div className={styles.detailContent}>
                      <div className={styles.detailHero}>
                        <span className={styles.detailKind}>{selectedNode.element_kind.toUpperCase()}</span>
                        <div className={styles.detailTitle}>{getElementLabel(selectedNode.element_data)}</div>
                        <div className={styles.detailCode}>{selectedNode.element_data.code || getElementId(selectedNode)}</div>
                      </div>

                      <div className={styles.detailGrid}>
                        {selectedNodeDataEntries.map(([key, value]) => (
                          <div key={key} className={styles.detailRow}>
                            <span>{key}</span>
                            <strong>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.panelBlock}>
                  <div className={styles.controlLabel}>Top vulnerabilidades</div>
                  <div className={styles.rankList}>
                    {metrics.topVulnerabilities.map((item) => (
                      <div key={item.id} className={styles.rankItem}>
                        <span>{item.label}</span>
                        <strong>{item.score}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.panelBlock}>
                  <div className={styles.controlLabel}>Acciones de mayor impacto</div>
                  <div className={styles.actionList}>
                    {actionRecommendations.map((action) => (
                      <div key={action.title} className={styles.actionItem}>
                        <div>
                          <strong>{action.title}</strong>
                          <p>{action.reason}</p>
                        </div>
                        <span className={styles.actionPriority}>{action.priority}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

