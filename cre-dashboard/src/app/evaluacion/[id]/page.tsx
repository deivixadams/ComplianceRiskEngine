import AssessmentWizard from "@/components/dashboard/AssessmentWizard";

export default function AssessmentPage({ params }: { params: { id: string } }) {
    // In a real app, fetch obligation context based on params.id
    return (
        <div style={{ padding: '2rem' }}>
            <AssessmentWizard obligationId="O-001" obligationName="Gobierno y Oficial de Cumplimiento" />
        </div>
    );
}
