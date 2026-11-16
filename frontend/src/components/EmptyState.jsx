export default function EmptyState({ title = 'Nothing to show yet', message, action }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      {message ? <p className="muted-text">{message}</p> : null}
      {action ? <div style={{ marginTop: 16 }}>{action}</div> : null}
    </div>
  );
}
