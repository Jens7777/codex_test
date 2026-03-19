const STAGE_META = [
  { id: 'problem', label: 'Problem', x: 0, y: 40, accent: '#d97757' },
  { id: 'targetGroups', label: 'Malgrupper', x: 320, y: 40, accent: '#db8d62' },
  { id: 'inputs', label: 'Resurser', x: 640, y: 40, accent: '#1f7a8c' },
  { id: 'activities', label: 'Aktiviteter', x: 960, y: 40, accent: '#217b74' },
  { id: 'outputs', label: 'Outputs', x: 1280, y: 40, accent: '#2f6fb0' },
  {
    id: 'shortTermOutcomes',
    label: 'Kortsiktiga effekter',
    x: 1600,
    y: 0,
    accent: '#5270a6'
  },
  {
    id: 'longTermOutcomes',
    label: 'Langsiktiga effekter',
    x: 1600,
    y: 200,
    accent: '#6a5f9c'
  },
  { id: 'impact', label: 'Impact', x: 1920, y: 100, accent: '#a0566d' },
  { id: 'assumptions', label: 'Antaganden', x: 960, y: 320, accent: '#87624b' },
  { id: 'indicators', label: 'Indikatorer', x: 1280, y: 320, accent: '#3b6d6c' }
];

const createNodeItems = (value) => {
  if (typeof value === 'string') {
    return value ? [value] : [];
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => item.text).filter(Boolean);
};

export const buildOverviewNodes = (theory) =>
  STAGE_META.map((stage) => ({
    id: stage.id,
    type: 'overviewNode',
    position: { x: stage.x, y: stage.y },
    sourcePosition: 'right',
    targetPosition: 'left',
    data: {
      label: stage.label,
      accent: stage.accent,
      items: createNodeItems(theory?.[stage.id]),
      isEmpty: createNodeItems(theory?.[stage.id]).length === 0
    }
  }));

export const buildOverviewEdges = () => [
  ['problem', 'targetGroups'],
  ['targetGroups', 'inputs'],
  ['inputs', 'activities'],
  ['activities', 'outputs'],
  ['outputs', 'shortTermOutcomes'],
  ['outputs', 'longTermOutcomes'],
  ['shortTermOutcomes', 'impact'],
  ['longTermOutcomes', 'impact'],
  ['assumptions', 'activities'],
  ['indicators', 'outputs']
].map(([source, target]) => ({
  id: `${source}-${target}`,
  source,
  target,
  animated: target === 'impact',
  style: {
    stroke: '#c4b8aa',
    strokeWidth: 1.5
  }
}));
