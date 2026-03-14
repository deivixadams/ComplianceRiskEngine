'use client';

import React, {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Filter,
  GitBranch,
  Layers3,
  Maximize2,
  Minimize2,
  Network,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

type GraphViewRow = {
  element_kind: 'node' | 'edge';
  element_key: string;
  element_data: Record<string, any>;
};

type FilterOption = {
  value: string;
  count: number;
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
    availableFilters?: {
      nodeTypes: FilterOption[];
      edgeTypes: FilterOption[];
    };
  };
};

type CytoscapeModule = typeof import('cytoscape');
type CytoscapeCore = import('cytoscape').Core;
type CytoscapeElementDefinition = import('cytoscape').ElementDefinition;

const LAYOUT_OPTIONS = [
  { value: 'breadthfirst', label: 'Jerárquico' },
  { value: 'cose', label: 'Orgánico' },
  { value: 'circle', label: 'Radial' },
];

const NODE_TYPE_COLORS: Record<string, string> = {
  DOMAIN: '#38bdf8',
  OBLIGATION: '#f59e0b',
  RISK: '#fb7185',
  CONTROL: '#34d399',
};

const EDGE_TYPE_COLORS: Record<string, string> = {
  DOMAIN_TO_DOMAIN: '#22d3ee',
  DOMAIN_TO_OBLIGATION: '#38bdf8',
  OBLIGATION_TO_RISK: '#f97316',
  RISK_TO_CONTROL: '#f43f5e',
  OBLIGATION_TO_CONTROL: '#34d399',
  OBLIGATION_TO_OBLIGATION: '#a78bfa',
};

function buildCytoscapeStylesheet() {
  return [
    {
      selector: 'node',
      style: {
        'background-color': 'data(vizColor)',
        label: 'data(label)',
        color: '#e5eefc',
        'font-size': 10,
        'font-weight': 700,
        'text-wrap': 'wrap',
        'text-max-width': 120,
        'text-valign': 'center',
        'text-halign': 'center',
        width: 'data(vizSize)',
        height: 'data(vizSize)',
        'border-width': 'data(vizBorderWidth)',
        'border-color': '#dbeafe',
        'overlay-opacity': 0,
      },
    },
    {
      selector: 'edge',
      style: {
        width: 'data(vizWidth)',
        'curve-style': 'bezier',
        'line-color': 'data(vizColor)',
        'target-arrow-color': 'data(vizColor)',
        'target-arrow-shape': 'triangle',
        label: 'data(vizLabel)',
        color: '#bfdbfe',
        'font-size': 8,
        'text-background-opacity': 1,
        'text-background-color': 'rgba(7, 13, 30, 0.88)',
        'text-background-padding': 3,
        'text-rotation': 'autorotate',
        'overlay-opacity': 0,
        opacity: 0.9,
      },
    },
    {
      selector: '.is-focused',
      style: {
        'border-color': '#ffffff',
        'border-width': 4,
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
        opacity: 0.13,
      },
    },
  ];
}

function toVizNode(element: GraphViewRow): CytoscapeElementDefinition {
  const data = element.element_data;
  const type = String(data.type || 'UNKNOWN');
  const riskWeight = Number(data.risk_weight ?? data.criticality ?? 0);
  const isHardGate = Boolean(data.is_hard_gate);
  const isDependencyRoot = Boolean(data.is_dependency_root);

  return {
    data: {
      ...data,
      vizColor: NODE_TYPE_COLORS[type] || '#94a3b8',
      vizSize: Math.max(42, Math.min(84, 42 + riskWeight * 0.22)),
      vizBorderWidth: isHardGate || isDependencyRoot ? 4 : 2,
    },
  };
}

function toVizEdge(element: GraphViewRow): CytoscapeElementDefinition {
  const data = element.element_data;
  const edgeType = String(data.edge_type || 'EDGE');
  const weight = Number(data.weight ?? data.strength ?? data.coverage_weight ?? 0.4);
  const label = String(data.label || edgeType).replaceAll('_', ' ');

  return {
    data: {
      ...data,
      vizColor: EDGE_TYPE_COLORS[edgeType] || '#64748b',
      vizWidth: Math.max(1.8, Math.min(7, weight * 5)),
      vizLabel: label,
    },
  };
}

export default function GraphSimulationClient() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<CytoscapeCore | null>(null);
  const [graph, setGraph] = useState<GraphResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<GraphViewRow | null>(null);
  const [layout, setLayout] = useState('breadthfirst');
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search.trim());
  const [selectedNodeTypes, setSelectedNodeTypes] = useState<string[]>([]);
  const [selectedEdgeTypes, setSelectedEdgeTypes] = useState<string[]>([]);
  const [onlyHardGate, setOnlyHardGate] = useState(false);
  const [onlyDependencyRoot, setOnlyDependencyRoot] = useState(false);
  const [onlyPrimary, setOnlyPrimary] = useState(false);
  const [onlyMandatory, setOnlyMandatory] = useState(false);
  const [criticalityMin, setCriticalityMin] = useState(0);
  const [isSubgraphMode, setIsSubgraphMode] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const availableNodeTypes = graph?.meta.availableFilters?.nodeTypes ?? [];
  const availableEdgeTypes = graph?.meta.availableFilters?.edgeTypes ?? [];

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    selectedNodeTypes.forEach((value) => params.append('node_type', value));
    selectedEdgeTypes.forEach((value) => params.append('edge_type', value));
    if (deferredSearch) params.set('search', deferredSearch);
    if (onlyHardGate) params.set('hard_gate', 'true');
    if (onlyDependencyRoot) params.set('dependency_root', 'true');
    if (onlyPrimary) params.set('primary', 'true');
    if (onlyMandatory) params.set('mandatory', 'true');
    if (criticalityMin > 0) params.set('criticality_min', String(criticalityMin));

    setLoading(true);
    setError(null);
    setSelectedElement(null);

    const load = async () => {
      try {
        const response = await fetch(`/api/graph?${params.toString()}`, { signal: controller.signal });
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
  }, [
    criticalityMin,
    deferredSearch,
    onlyDependencyRoot,
    onlyHardGate,
    onlyMandatory,
    onlyPrimary,
    reloadKey,
    selectedEdgeTypes,
    selectedNodeTypes,
  ]);

  const separated = useMemo(() => {
    const elements = graph?.elements ?? [];
    const nodes = elements.filter((element) => element.element_kind === 'node');
    const edges = elements.filter((element) => element.element_kind === 'edge');
    const nodeIds = new Set(nodes.map((element) => String(element.element_data.id)));
    const connectedEdges = edges.filter((element) => {
      const source = String(element.element_data.source || '');
      const target = String(element.element_data.target || '');
      return nodeIds.has(source) && nodeIds.has(target);
    });

    return {
      nodes,
      edges: connectedEdges,
      cyElements: [...nodes.map(toVizNode), ...connectedEdges.map(toVizEdge)],
    };
  }, [graph]);

  useEffect(() => {
    let mounted = true;

    const renderGraph = async () => {
      if (!containerRef.current) return;
      const cytoscapeImport = (await import('cytoscape')) as any;
      const cytoscape = (cytoscapeImport.default ?? cytoscapeImport) as any;
      if (!mounted || !containerRef.current) return;

      cyRef.current?.destroy();

      const cy = cytoscape({
        container: containerRef.current,
        elements: separated.cyElements,
        layout: {
          name: layout,
          animate: false,
          fit: true,
          padding: 60,
          directed: true,
          spacingFactor: layout === 'circle' ? 1.1 : 1.55,
        } as any,
        minZoom: 0.2,
        maxZoom: 3,
        style: buildCytoscapeStylesheet() as any,
      });

      cy.on('tap', 'node, edge', (event) => {
        const current = event.target;
        const data = current.data();
        const row = graph?.elements.find((element) => String(element.element_data.id) === String(data.id)) ?? null;
        setSelectedElement(row);

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
  }, [graph, layout, separated.cyElements]);

  const selectedDataEntries = useMemo(() => {
    if (!selectedElement) return [];
    return Object.entries(selectedElement.element_data)
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .slice(0, 18);
  }, [selectedElement]);

  const fitGraph = () => {
    cyRef.current?.fit(undefined, 50);
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedNodeTypes([]);
    setSelectedEdgeTypes([]);
    setOnlyHardGate(false);
    setOnlyDependencyRoot(false);
    setOnlyPrimary(false);
    setOnlyMandatory(false);
    setCriticalityMin(0);
  };

  const handleNodeTypeToggle = (value: string) => {
    setSelectedNodeTypes((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  };

  const handleEdgeTypeToggle = (value: string) => {
    setSelectedEdgeTypes((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  };

  const loadSubgraph = async () => {
    if (!selectedElement || selectedElement.element_kind !== 'node') return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/graph/subgraph/${encodeURIComponent(String(selectedElement.element_data.id))}`);
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

  const restoreFullGraph = () => {
    resetFilters();
    setSelectedElement(null);
    setIsSubgraphMode(false);
    setReloadKey((current) => current + 1);
  };

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}>graph simulation cockpit</div>
            <h1 className={styles.title}>Simulación estructural del CRE</h1>
            <p className={styles.subtitle}>
              Grafo heterogéneo multicapa: ley → dominio → obligación → riesgo → control → prueba → evidencia
            </p>
            <div className={styles.heroBadges}>
              <span className={styles.badge}><Layers3 size={14} /> {graph?.meta.counts.nodes ?? 0} nodos</span>
              <span className={styles.badge}><GitBranch size={14} /> {separated.edges.length} aristas visibles</span>
              <span className={styles.badge}><Sparkles size={14} /> {isSubgraphMode ? 'Modo subgrafo' : 'Grafo completo'}</span>
            </div>
          </div>

          <div className={styles.heroActions}>
            <button
              type="button"
              className={styles.dangerButton}
              onClick={() => router.push('/score/dashboard')}
            >
              <XCircle size={14} />
              Cerrar graph
            </button>
            <button type="button" className={styles.ghostButton} onClick={fitGraph}>
              <Maximize2 size={14} />
              Ajustar vista
            </button>
            <button type="button" className={styles.ghostButton} onClick={resetFilters}>
              <RefreshCw size={14} />
              Limpiar filtros
            </button>
            {isSubgraphMode ? (
              <button type="button" className={styles.primaryButton} onClick={restoreFullGraph}>
                <Minimize2 size={14} />
                Volver al grafo completo
              </button>
            ) : (
              <button
                type="button"
                className={styles.primaryButton}
                onClick={loadSubgraph}
                disabled={!selectedElement || selectedElement.element_kind !== 'node'}
              >
                <Network size={14} />
                Explorar vecindad
              </button>
            )}
          </div>
        </header>

        <div className={styles.workspace}>
          <aside className={styles.filtersCard}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardEyebrow}>Filtros</div>
                <div className={styles.cardTitle}>Exploración semántica</div>
              </div>
              <Filter size={16} className={styles.cardIcon} />
            </div>

            <label className={styles.searchBox}>
              <Search size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por code, label o id"
              />
            </label>

            <div className={styles.controlBlock}>
              <div className={styles.controlLabel}>Layout</div>
              <div className={styles.segmented}>
                {LAYOUT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`${styles.segmentButton} ${layout === option.value ? styles.segmentActive : ''}`}
                    onClick={() => setLayout(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.controlBlock}>
              <div className={styles.controlLabel}>Tipos de nodo</div>
              <div className={styles.filterList}>
                {availableNodeTypes.map((option) => (
                  <label key={option.value} className={styles.filterItem}>
                    <input
                      type="checkbox"
                      checked={selectedNodeTypes.includes(option.value)}
                      onChange={() => handleNodeTypeToggle(option.value)}
                    />
                    <span>{option.value}</span>
                    <strong>{option.count}</strong>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.controlBlock}>
              <div className={styles.controlLabel}>Tipos de arista</div>
              <div className={styles.filterList}>
                {availableEdgeTypes.map((option) => (
                  <label key={option.value} className={styles.filterItem}>
                    <input
                      type="checkbox"
                      checked={selectedEdgeTypes.includes(option.value)}
                      onChange={() => handleEdgeTypeToggle(option.value)}
                    />
                    <span>{option.value}</span>
                    <strong>{option.count}</strong>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.controlBlock}>
              <div className={styles.controlLabel}>Atributos estructurales</div>
              <div className={styles.toggleGrid}>
                <label className={styles.toggleItem}>
                  <input type="checkbox" checked={onlyHardGate} onChange={() => setOnlyHardGate((current) => !current)} />
                  <span><ShieldAlert size={14} /> Hard gates</span>
                </label>
                <label className={styles.toggleItem}>
                  <input
                    type="checkbox"
                    checked={onlyDependencyRoot}
                    onChange={() => setOnlyDependencyRoot((current) => !current)}
                  />
                  <span><Network size={14} /> Dependency roots</span>
                </label>
                <label className={styles.toggleItem}>
                  <input type="checkbox" checked={onlyPrimary} onChange={() => setOnlyPrimary((current) => !current)} />
                  <span><ShieldCheck size={14} /> Edges primarios</span>
                </label>
                <label className={styles.toggleItem}>
                  <input
                    type="checkbox"
                    checked={onlyMandatory}
                    onChange={() => setOnlyMandatory((current) => !current)}
                  />
                  <span><Layers3 size={14} /> Edges mandatorios</span>
                </label>
              </div>
            </div>

            <div className={styles.controlBlock}>
              <div className={styles.controlLabel}>Criticidad mínima</div>
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
          </aside>

          <div className={styles.mainColumn}>
            <section className={styles.graphCard}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.cardEyebrow}>Canvas</div>
                  <div className={styles.cardTitle}>Grafo regulatorio navegable</div>
                </div>
                <div className={styles.countPills}>
                  <span className={styles.badge}>Visibles {graph?.meta.counts.total ?? 0}</span>
                  <span className={styles.badge}>Conectadas {separated.edges.length}</span>
                </div>
              </div>

              {loading && <div className={styles.emptyState}>Cargando grafo...</div>}
              {error && <div className={styles.emptyState}>{error}</div>}
              {!loading && !error && separated.cyElements.length === 0 && (
                <div className={styles.emptyState}>No hay elementos que coincidan con los filtros actuales.</div>
              )}
              <div ref={containerRef} className={styles.graphCanvas} />
            </section>

            <section className={styles.detailCard}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.cardEyebrow}>Inspector</div>
                  <div className={styles.cardTitle}>Detalle del elemento</div>
                </div>
                <Network size={16} className={styles.cardIcon} />
              </div>

              {!selectedElement && (
                <div className={styles.emptyState}>
                  Selecciona un nodo o una arista para ver atributos estructurales, metadata y relaciones inmediatas.
                </div>
              )}

              {selectedElement && (
                <div className={styles.detailContent}>
                  <div className={styles.detailHero}>
                    <span className={styles.detailKind}>{selectedElement.element_kind.toUpperCase()}</span>
                    <div className={styles.detailTitle}>{selectedElement.element_data.label || selectedElement.element_data.id}</div>
                    <div className={styles.detailCode}>
                      {selectedElement.element_data.code || selectedElement.element_data.edge_type || selectedElement.element_key}
                    </div>
                  </div>

                  <div className={styles.detailGrid}>
                    {selectedDataEntries.map(([key, value]) => (
                      <div key={key} className={styles.detailRow}>
                        <span>{key}</span>
                        <strong>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</strong>
                      </div>
                    ))}
                  </div>

                  {selectedElement.element_data.metadata && (
                    <div className={styles.metadataCard}>
                      <div className={styles.metadataTitle}>Metadata completa</div>
                      <pre>{JSON.stringify(selectedElement.element_data.metadata, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
