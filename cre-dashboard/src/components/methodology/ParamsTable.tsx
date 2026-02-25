"use client";

import styles from './ParamsTable.module.css';

interface Parameter {
    code: string;
    name: string;
    value: string;
    range: string;
    approver: string;
}

interface ParamsTableProps {
    params: Parameter[];
}

export default function ParamsTable({ params }: ParamsTableProps) {
    return (
        <div className={styles.tableContainer}>
            <div className={styles.scrollArea}>
                <table className={styles.table}>
                    <thead>
                        <tr className={styles.headerRow}>
                            <th className={styles.th}>Ref</th>
                            <th className={styles.th}>Definición</th>
                            <th className={styles.th} style={{ textAlign: 'right' }}>Valor</th>
                            <th className={styles.th}>Rango</th>
                            <th className={styles.th}>Autoridad</th>
                        </tr>
                    </thead>
                    <tbody style={{ borderBottom: 'none' }}>
                        {params.map((p) => (
                            <tr key={p.code} className={styles.row}>
                                <td className={styles.td}>
                                    <span className={styles.codeCell}>{p.code}</span>
                                </td>
                                <td className={styles.td}>
                                    <span className={styles.nameCell}>{p.name}</span>
                                </td>
                                <td className={`${styles.td} ${styles.valueCell}`}>
                                    {p.value}
                                </td>
                                <td className={`${styles.td} ${styles.rangeCell}`}>
                                    {p.range}
                                </td>
                                <td className={styles.td}>
                                    <div className={styles.approverBadge}>
                                        <div className={styles.approverDot} />
                                        {p.approver}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className={styles.infoBox}>
                <div className={styles.infoIcon} />
                <p className={styles.infoText}>
                    Parametrización sujeta a quorum del Comité de Riesgos. Última actualización: <span className={styles.infoHighlight}>Hoy, 10:42 AM</span>.
                </p>
            </div>
        </div>
    );
}
