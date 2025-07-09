import './not-found.css';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="introuvable">
      <div className="stack" style={{ '--stacks': 3 }}>
        <span style={{ '--index': 0 }}>404</span>
        <span style={{ '--index': 1 }}>404</span>
        <span style={{ '--index': 2 }}>404</span>
      </div>
      <span className="introuvable_text">Page introuvable</span>
      <Link href="/" className="back_home_btn">Retour à l&apos;accueil</Link>
    </div>
  );
} 