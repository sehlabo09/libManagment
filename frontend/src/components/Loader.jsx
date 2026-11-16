export default function Loader({ message = 'Loading...', size = 'lg' }) {
  return (
    <div className="loader">
      <div className={`spinner ${size === 'lg' ? 'spinner--lg' : ''}`} />
      <span>{message}</span>
    </div>
  );
}
