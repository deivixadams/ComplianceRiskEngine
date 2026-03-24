import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prismaClientSingleton = () => {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL!.replace(/\?schema=\w+/, '') });
    const base = new PrismaClient({ adapter });

    // Prisma introspection generates snake_case model names. Provide compatibility aliases
    // expected by the application without changing call sites.
    const compat = new Proxy(base as any, {
        get(target, prop: string | symbol) {
            if (typeof prop !== "string") return (target as any)[prop];

            const aliasMap: Record<string, string> = {
                securityUser: "security_users",
                securityRbac: "security_rbac",
                securityUserScope: "security_user_scope",
                securityUserToken: "security_user_token",

                corpusAssessment: "audit_assessment",
                corpusAssessmentDraft: "audit_assessment_draft",
                corpusEvaluation: "audit_evaluation",
                corpusAuditLog: "audit_log",
                corpusCompany: "company",
                corpusDomain: "domain",
                corpusFrameworkVersion: "framework_version",
                corpusJurisdiction: "jurisdiction",
                corpusRisk: "risk",
            };

            if (prop in aliasMap) {
                return (target as any)[aliasMap[prop]];
            }

            if (prop === "corpus") {
                return {
                    assessment_draft: (target as any).audit_assessment_draft,
                };
            }

            return (target as any)[prop];
        }
    });

    return compat as PrismaClient;
};

declare global {
    // Prisma client is generated at runtime; keep type loose to avoid build-time breakage.
    // eslint-disable-next-line no-var
    var prisma: any | undefined;
}

const prisma: any = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
