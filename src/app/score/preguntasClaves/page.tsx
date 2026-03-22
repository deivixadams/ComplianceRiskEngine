import prisma from '@/lib/prisma';
import PreguntasClavesClient from './PreguntasClavesClient';
import { QUESTION_CATALOG, type QuestionResolvedItem } from './question-catalog';

type FrameworkViewRow = {
  object_schema: string;
  object_name: string;
  object_description: string | null;
};

async function getFrameworkViews(): Promise<Map<string, FrameworkViewRow>> {
  try {
    const rows = (await (prisma as any).$queryRaw`
      SELECT object_schema, object_name, object_description
      FROM "_Schema".framework_doc_view
      WHERE object_type = 'VIEW'
        AND column_name IS NULL
    `) as FrameworkViewRow[];

    return new Map(
      rows.map((row) => [`${row.object_schema}.${row.object_name}`.toLowerCase(), row] as const)
    );
  } catch (error) {
    console.error('Error reading "_Schema".framework_doc_view:', error);
    return new Map();
  }
}

function resolveQuestions(viewsMap: Map<string, FrameworkViewRow>): QuestionResolvedItem[] {
  return QUESTION_CATALOG.map((question) => {
    const matchedKey = question.candidateViews.find((viewKey) => viewsMap.has(viewKey.toLowerCase()));

    if (!matchedKey) {
      return {
        id: question.id,
        order: question.order,
        category: question.category,
        question: question.question,
        response: question.response,
        view: null,
      };
    }

    const selectedView = viewsMap.get(matchedKey.toLowerCase());
    if (!selectedView) {
      return {
        id: question.id,
        order: question.order,
        category: question.category,
        question: question.question,
        response: question.response,
        view: null,
      };
    }

    return {
      id: question.id,
      order: question.order,
      category: question.category,
      question: question.question,
      response: question.response,
      view: {
        schema: selectedView.object_schema,
        name: selectedView.object_name,
        key: `${selectedView.object_schema}.${selectedView.object_name}`,
        description:
          selectedView.object_description?.trim() || 'Vista documentada sin descripcion de negocio.',
      },
    };
  });
}

export default async function PreguntasClavesPage() {
  const frameworkViews = await getFrameworkViews();
  const questions = resolveQuestions(frameworkViews);
  return <PreguntasClavesClient questions={questions} />;
}
