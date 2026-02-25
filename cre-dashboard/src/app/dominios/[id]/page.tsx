import DomainDetailView from "@/components/dashboard/DomainDetailView";

export default function DomainPage({ params }: { params: { id: string } }) {
    return <DomainDetailView domainId={params.id} />;
}
