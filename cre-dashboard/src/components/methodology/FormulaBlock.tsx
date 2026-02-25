"use client";

import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import styles from './FormulaBlock.module.css';

interface FormulaBlockProps {
    latex: string;
    block?: boolean;
    label?: string;
}

export default function FormulaBlock({ latex, block = true, label }: FormulaBlockProps) {
    return (
        <div className={styles.formulaWrapper}>
            <div className={styles.glow}></div>
            <div className={styles.formulaCard}>
                {label && (
                    <div className={styles.label}>
                        <span className={styles.dot} />
                        {label}
                    </div>
                )}
                <div className={styles.mathContent}>
                    {block ? (
                        <BlockMath math={latex} />
                    ) : (
                        <InlineMath math={latex} />
                    )}
                </div>
            </div>
        </div>
    );
}
