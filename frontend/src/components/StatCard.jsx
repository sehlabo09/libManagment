export default function StatCard({ label, value, variant = '' }) {
  return (
    <div className={variant ? `dashboard-card ${variant}` : 'dashboard-card'}>
      <h3>{label}</h3>
      <p>{value}</p>
    </div>
  );
}
