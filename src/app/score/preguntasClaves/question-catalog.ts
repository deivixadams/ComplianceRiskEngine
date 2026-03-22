export type QuestionCatalogItem = {
  id: string;
  order: number;
  category: string;
  question: string;
  response: string;
  candidateViews: string[];
};

export type MatchedFrameworkView = {
  schema: string;
  name: string;
  description: string;
  key: string;
};

export type QuestionResolvedItem = Omit<QuestionCatalogItem, 'candidateViews'> & {
  view: MatchedFrameworkView | null;
};

export const QUESTION_CATALOG: QuestionCatalogItem[] = [
  {
    id: 'fragility_q1',
    order: 1,
    category: 'Fragilidad estructural',
    question: 'Cuales son los pocos controles cuya falla podria comprometer multiples obligaciones regulatorias?',
    response:
      'La prioridad esta en controles con alta concentracion de cobertura. Si uno falla, compromete varias obligaciones de forma simultanea. La mitigacion recomendada es reforzar redundancia, monitoreo y evidencia de operacion.',
    candidateViews: ['graph.v_critical_controls_base', 'corpus.v_cre_control_degree'],
  },
  {
    id: 'fragility_q2',
    order: 2,
    category: 'Fragilidad estructural',
    question: 'Donde esta la mayor fragilidad estructural del sistema AML?',
    response:
      'La mayor fragilidad se ubica donde convergen criticidad alta, dependencia y baja capacidad de compensacion. Ese cluster debe ser la primera prioridad del plan de remediacion para reducir impacto sistemico.',
    candidateViews: ['score.v_system_fragility_draft', 'score.v_domain_fragility_propagated_draft'],
  },
  {
    id: 'fragility_q3',
    order: 3,
    category: 'Fragilidad estructural',
    question: 'Que controles son estructuralmente criticos para sostener el sistema de cumplimiento AML?',
    response:
      'Son los controles con mayor efecto de soporte transversal sobre obligaciones y riesgos. Su deterioro eleva exposicion residual en cadena. Deben tener seguimiento reforzado, pruebas frecuentes y responsables asignados.',
    candidateViews: ['graph.v_critical_controls_base', 'graph.v_ultra_critical_controls'],
  },
  {
    id: 'fragility_q4',
    order: 4,
    category: 'Fragilidad estructural',
    question: 'Cuantos controles son estructuralmente clave para la estabilidad del sistema AML?',
    response:
      'El foco no es solo cantidad, sino concentracion de dependencia sobre ese conjunto. Pocos controles con alto peso elevan fragilidad. La decision clave es distribuir mejor la carga de mitigacion.',
    candidateViews: ['graph.v_critical_controls_base'],
  },
  {
    id: 'fragility_q5',
    order: 5,
    category: 'Fragilidad estructural',
    question: 'Cuantas obligaciones regulatorias son estructuralmente clave para la estabilidad del sistema AML?',
    response:
      'Las obligaciones clave son las que concentran riesgo y condicionan mayor cantidad de controles. Su degradacion afecta estabilidad global del marco AML. Deben priorizarse en remediacion y pruebas de defensa.',
    candidateViews: ['graph.v_key_obligations_base'],
  },
  {
    id: 'fragility_q6',
    order: 6,
    category: 'Fragilidad estructural',
    question: 'Que parte del sistema podria fallar primero si uno de esos controles criticos deja de operar?',
    response:
      'Falla primero el tramo directamente conectado al control critico (riesgos y obligaciones vinculadas). Luego el efecto se propaga por dependencias estructurales. Se recomienda activar planes de contingencia por cadena de impacto.',
    candidateViews: ['graph.graph_edges', 'graph.cre_graph_view'],
  },
  {
    id: 'fragility_q7',
    order: 7,
    category: 'Fragilidad estructural',
    question: 'Que controles sostienen el mayor numero de obligaciones regulatorias criticas?',
    response:
      'Corresponden a nodos de alta centralidad normativa. Si presentan debilidad, aumenta riesgo de observacion regulatoria. Deben contar con evidencia consistente y cobertura de pruebas de estres.',
    candidateViews: ['corpus.v_cre_control_degree', 'graph.v_critical_controls_base'],
  },
  {
    id: 'dependencies_q8',
    order: 8,
    category: 'Dependencias sistemicas',
    question: 'Que obligaciones regulatorias dependen de un unico control?',
    response:
      'Estas obligaciones tienen cobertura mono-punto. Una falla unica puede dejar exposicion inmediata. Es recomendable incorporar controles complementarios para evitar dependencia exclusiva.',
    candidateViews: ['graph.v_key_obligations_base'],
  },
  {
    id: 'dependencies_q9',
    order: 9,
    category: 'Dependencias sistemicas',
    question: 'Que controles son dependency roots dentro del sistema AML?',
    response:
      'Los dependency roots concentran enlaces de propagacion y pueden gatillar fallas en cascada. Son nodos de vigilancia prioritaria y deben tener umbrales de alerta temprana mas estrictos.',
    candidateViews: ['graph.cre_graph_view', 'corpus.v_score_cre_graph_base'],
  },
  {
    id: 'dependencies_q10',
    order: 10,
    category: 'Dependencias sistemicas',
    question: 'Que nodos concentran mas dependencias regulatorias dentro del sistema AML?',
    response:
      'Los nodos con mayor concentracion de dependencias determinan gran parte de la resiliencia del sistema. Al estar sobrecargados, reducen margen de maniobra frente a incidentes. Deben entrar primero en planes de descompresion estructural.',
    candidateViews: ['graph.cre_graph_view', 'graph.v_critical_controls_base'],
  },
  {
    id: 'dependencies_q11',
    order: 11,
    category: 'Dependencias sistemicas',
    question: 'Donde depende el sistema AML excesivamente de pocos controles?',
    response:
      'La sobredependencia aparece donde unos pocos controles absorben cobertura amplia de obligaciones y riesgos. Ese patron incrementa probabilidad de ruptura sistemica. La prioridad es redistribuir mitigacion y reforzar controles satelite.',
    candidateViews: ['graph.v_critical_controls_base', 'corpus._score_v_cre_control_degree'],
  },
  {
    id: 'dependencies_q12',
    order: 12,
    category: 'Dependencias sistemicas',
    question: 'Donde se concentra la mayor exposicion estructural dentro del sistema AML?',
    response:
      'La maxima exposicion se concentra donde coinciden criticidad elevada, baja defensa y enlaces mandatorios. Ese frente debe ser el primer bloque del backlog de correccion para reducir riesgo residual agregado.',
    candidateViews: ['score.v_system_fragility_draft', 'score.v_domain_fragility_propagated_draft'],
  },
  {
    id: 'dependencies_q13',
    order: 13,
    category: 'Dependencias sistemicas',
    question: 'Que dominios regulatorios concentran mas obligaciones criticas?',
    response:
      'Son dominios con mayor densidad de obligaciones de alto impacto. Su debilidad afecta la arquitectura de cumplimiento de forma transversal. Deben priorizarse en estrategia de fortalecimiento trimestral.',
    candidateViews: ['score.v_domain_fragility_draft', 'graph.v_key_obligations_base'],
  },
  {
    id: 'dependencies_q14',
    order: 14,
    category: 'Dependencias sistemicas',
    question: 'Donde una falla podria propagarse a multiples obligaciones regulatorias?',
    response:
      'La propagacion se observa en cadenas con alta conectividad entre obligaciones, riesgos y controles. Un evento local puede escalar rapido a incumplimiento amplio. Deben instalarse barreras estructurales en esos enlaces.',
    candidateViews: ['score.v_domain_fragility_propagated_draft', 'graph.graph_edges'],
  },
  {
    id: 'defense_q15',
    order: 15,
    category: 'Defensa regulatoria',
    question: 'Que controles funcionan como hard gates regulatorios dentro del sistema AML?',
    response:
      'Los hard gates son no compensables: su falla compromete defensa regulatoria de forma directa. Deben mantenerse con baja tolerancia a desvio, pruebas periodicas y respaldo probatorio verificable.',
    candidateViews: ['graph.cre_graph_view', 'corpus.v_score_cre_graph_base'],
  },
  {
    id: 'defense_q16',
    order: 16,
    category: 'Defensa regulatoria',
    question: 'Que obligaciones regulatorias dependen directamente de esos hard gates?',
    response:
      'Son obligaciones con exposicion inmediata ante caida de hard gates. Requieren trazabilidad clara de dependencia y controles de respaldo validados. Deben figurar en agenda prioritaria de auditoria.',
    candidateViews: ['graph.graph_edges', 'graph.cre_graph_view'],
  },
  {
    id: 'defense_q17',
    order: 17,
    category: 'Defensa regulatoria',
    question: 'Que ocurriria estructuralmente si uno de esos hard gates deja de operar?',
    response:
      'Se produce una ruptura en la cadena de control, con aumento rapido del riesgo residual. El impacto tiende a extenderse por dependencias conectadas. Debe existir plan de reaccion con responsables y tiempos definidos.',
    candidateViews: ['score.v_domain_fragility_propagated_draft', 'graph.graph_edges'],
  },
  {
    id: 'defense_q18',
    order: 18,
    category: 'Defensa regulatoria',
    question: 'Que controles criticos carecen de evidencia suficiente para ser defendidos ante el regulador?',
    response:
      'Son controles con ejecucion declarada pero evidencia debil o dispersa. Esa brecha afecta la solidez de la defensa en inspeccion. La accion inmediata es cerrar trazabilidad probatoria por control critico.',
    candidateViews: ['corpus.controltest_graph_view', 'score.v_control_score_draft'],
  },
  {
    id: 'defense_q19',
    order: 19,
    category: 'Defensa regulatoria',
    question: 'Que obligaciones regulatorias criticas no pueden demostrarse con evidencia verificable hoy?',
    response:
      'Estas obligaciones presentan alto riesgo de observacion regulatoria porque la evidencia no sustenta el cumplimiento de forma verificable. Se debe consolidar evidencia por obligacion y asegurar consistencia documental.',
    candidateViews: ['corpus.controltest_graph_view', 'graph.v_key_obligations_base'],
  },
  {
    id: 'defense_q20',
    order: 20,
    category: 'Defensa regulatoria',
    question: 'Si el regulador inspeccionara hoy el sistema AML, que vulnerabilidades estructurales veria primero?',
    response:
      'Primero veria concentraciones de riesgo sin mitigacion robusta, hard gates fragiles y dependencias excesivas en pocos nodos. Esas areas deben contar con plan corto de saneamiento y evidencia preparada.',
    candidateViews: ['score.v_system_fragility_draft', 'graph.v_ultra_critical_controls'],
  },
  {
    id: 'defense_q21',
    order: 21,
    category: 'Defensa regulatoria',
    question: 'Que controles u obligaciones deberian priorizarse primero para reducir la exposicion regulatoria?',
    response:
      'La priorizacion debe iniciar en nodos con mayor impacto sistemico y menor defensa efectiva: alta criticidad, alta dependencia y evidencia insuficiente. Esa combinacion reduce exposicion en menor tiempo.',
    candidateViews: ['graph.v_ultra_critical_controls', 'graph.v_key_obligations_base'],
  },
];
