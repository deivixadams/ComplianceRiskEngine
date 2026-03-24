create schema if not exists graph;

create table if not exists graph.risk_analyst (
    id uuid primary key default gen_random_uuid(),

    risk_id uuid not null,
    element_id uuid not null,

    probability numeric(8,4) not null,
    impact numeric(8,4) not null,

    connectivity smallint not null,
    cascade numeric(8,4) not null,

    k_factor numeric(8,4) not null default 1.0000,

    base_score numeric(18,6) generated always as (
        probability * impact
    ) stored,

    adjusted_score numeric(18,6) generated always as (
        (probability * impact) * (1 + (k_factor * cascade))
    ) stored,

    analysis_notes text,
    source text,
    scenario text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint fk_risk_analyst_risk
        foreign key (risk_id)
        references graph.risk(id)
        on update cascade
        on delete cascade,

    constraint chk_risk_analyst_probability
        check (probability >= 0),

    constraint chk_risk_analyst_impact
        check (impact >= 0),

    constraint chk_risk_analyst_connectivity
        check (connectivity between 1 and 5),

    constraint chk_risk_analyst_cascade
        check (cascade between 0 and 1),

    constraint chk_risk_analyst_k_factor
        check (k_factor >= 0)
);

create index if not exists idx_risk_analyst_risk_id
    on graph.risk_analyst (risk_id);

create index if not exists idx_risk_analyst_element_id
    on graph.risk_analyst (element_id);

create index if not exists idx_risk_analyst_adjusted_score
    on graph.risk_analyst (adjusted_score desc);
