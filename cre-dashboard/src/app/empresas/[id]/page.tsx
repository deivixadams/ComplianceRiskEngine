import EnterpriseDashboard from "@/components/dashboard/EnterpriseDashboard";

export default function EnterprisePage({ params }: { params: { id: string } }) {
    // In a real app, fetch data based on params.id
    return <EnterpriseDashboard enterpriseName={params.id === '1' ? "Bank Alpha" : "Fintech Beta"} />;
}
