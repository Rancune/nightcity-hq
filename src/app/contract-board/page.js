'use client';
import dynamic from 'next/dynamic';
import styles from './ContractBoard.module.css';

const ContractMap = dynamic(() => import('./ContractMap'), { ssr: false });

export default function ContractBoardPage() {
  return (
    <div className={styles.holoBg}>
      <h1 className={styles.holoTitle}>Contract Board - Night City</h1>
      <div className={styles.mapContainer}>
        <ContractMap />
        <div className={styles.scanlines} />
        <div className={styles.noise} />
      </div>
    </div>
  );
} 