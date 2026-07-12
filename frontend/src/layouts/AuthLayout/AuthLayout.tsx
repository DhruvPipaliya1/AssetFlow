import { Outlet } from 'react-router-dom';
import {
  LaptopOutlined,
  SwapOutlined,
  CalendarOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { APP_NAME, APP_TAGLINE } from '../../config/constants';
import './AuthLayout.css';

const FEATURES = [
  { icon: <LaptopOutlined />, title: 'Full asset lifecycle', text: 'Register, tag with QR & track every asset to retirement.' },
  { icon: <SwapOutlined />, title: 'Smart allocation', text: 'Allocate & transfer with built-in conflict handling.' },
  { icon: <CalendarOutlined />, title: 'Overlap-free booking', text: 'Reserve rooms, vehicles & gear by time slot — no clashes.' },
  { icon: <SafetyCertificateOutlined />, title: 'Governed workflows', text: 'Approval-gated maintenance, audits & role-based access.' },
];

// Split-screen auth shell: a branded story panel on the left, the routed form
// (login / signup / forgot) on the right. Collapses to just the form on mobile.
export function AuthLayout() {
  return (
    <div className="af-auth">
      <aside className="af-auth__brand" aria-hidden>
        <div className="af-auth__brand-inner">
          <div className="af-auth__logo-row">
            <span className="af-auth__mark">AF</span>
            <span className="af-auth__word">{APP_NAME}</span>
          </div>

          <h1 className="af-auth__headline">Every asset, accounted for.</h1>
          <p className="af-auth__lead">
            {APP_TAGLINE} — one place to track, allocate, book, maintain and audit everything your organization owns.
          </p>

          <ul className="af-auth__features">
            {FEATURES.map((f) => (
              <li className="af-auth__feature" key={f.title}>
                <span className="af-auth__feature-icon">{f.icon}</span>
                <span>
                  <span className="af-auth__feature-title">{f.title}</span>
                  <span className="af-auth__feature-text">{f.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="af-auth__foot">Enterprise Asset &amp; Resource Management</div>
      </aside>

      <main className="af-auth__panel">
        <div className="af-auth__form">
          <div className="af-auth__form-brand">
            <span className="af-auth__mark af-auth__mark--sm">AF</span>
            <span className="af-auth__word af-auth__word--dark">{APP_NAME}</span>
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
