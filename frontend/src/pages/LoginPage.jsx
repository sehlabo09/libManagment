import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoginForm from '../components/LoginForm';
import Loader from '../components/Loader';

const EMPTY_SIGNUP = { fullName: '', membershipId: '', email: '', password: '', confirm: '' };

export default function LoginPage() {
  const { user, loading, register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;

  const [tab, setTab] = useState('login');
  const [values, setValues] = useState(EMPTY_SIGNUP);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="loader-page">
        <Loader message="Checking your session..." />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  function handleLoginSuccess(signedInUser) {
    // Administrators continue to the page they originally tried to open,
    // members always land on their dashboard.
    const destination = signedInUser.role === 'ADMIN' && from ? from : '/dashboard';
    navigate(destination, { replace: true });
  }

  function switchTab(nextTab) {
    setTab(nextTab);
    setErrors({});
    setServerError('');
  }

  function handleChange(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function validate() {
    const next = {};
    if (!values.fullName.trim()) next.fullName = 'Full name is required';
    if (!values.membershipId.trim()) next.membershipId = 'Membership ID is required';
    if (!values.email.trim()) {
      next.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      next.email = 'Enter a valid email address';
    }
    if (values.password.length < 8) {
      next.password = 'Password must be at least 8 characters';
    } else if (!/[A-Za-z]/.test(values.password) || !/[0-9]/.test(values.password)) {
      next.password = 'Password must contain at least one letter and one number';
    }
    if (values.confirm !== values.password) {
      next.confirm = 'Passwords do not match';
    }
    return next;
  }

  async function handleSignUp(event) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setServerError('');
    try {
      const created = await register({
        fullName: values.fullName.trim(),
        membershipId: values.membershipId.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      showToast(`Account created. Welcome, ${created.fullName}`, 'success');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setServerError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-card">
      <h2>Library Management System</h2>

      <div className="auth-tabs">
        <button
          type="button"
          className={`auth-tab${tab === 'login' ? ' active' : ''}`}
          onClick={() => switchTab('login')}
        >
          Login
        </button>
        <button
          type="button"
          className={`auth-tab${tab === 'signup' ? ' active' : ''}`}
          onClick={() => switchTab('signup')}
        >
          Sign Up
        </button>
      </div>

      {tab === 'login' ? (
        <>
          <LoginForm onSuccess={handleLoginSuccess} />

          <div className="credentials-hint">
            <strong>Default administrator</strong>
            <br />
            Email: <code>admin@library.com</code>
            <br />
            Password: <code>Admin@123</code>
            <br />
            You will be asked to change this password after your first sign in.
          </div>
        </>
      ) : (
        <form onSubmit={handleSignUp} noValidate>
          {serverError ? <div className="alert alert-error">{serverError}</div> : null}

          <div className="signup-role-note">
            New accounts are created as library members. Ask an administrator if you need
            administrator access.
          </div>

          <div className="form-group">
            <label htmlFor="reg-fullname">Full name</label>
            <input
              id="reg-fullname"
              name="fullName"
              value={values.fullName}
              onChange={handleChange}
              aria-invalid={Boolean(errors.fullName)}
              placeholder="e.g. Thabo Mokoena"
            />
            {errors.fullName ? <span className="field-error">{errors.fullName}</span> : null}
          </div>

          <div className="form-group">
            <label htmlFor="reg-membership">Membership ID</label>
            <input
              id="reg-membership"
              name="membershipId"
              value={values.membershipId}
              onChange={handleChange}
              aria-invalid={Boolean(errors.membershipId)}
              placeholder="e.g. LIB-2026-014"
            />
            {errors.membershipId ? <span className="field-error">{errors.membershipId}</span> : null}
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Email address</label>
            <input
              id="reg-email"
              name="email"
              type="email"
              value={values.email}
              onChange={handleChange}
              aria-invalid={Boolean(errors.email)}
              placeholder="you@example.com"
            />
            {errors.email ? <span className="field-error">{errors.email}</span> : null}
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={values.password}
              onChange={handleChange}
              aria-invalid={Boolean(errors.password)}
              placeholder="At least 8 characters"
            />
            {errors.password ? <span className="field-error">{errors.password}</span> : null}
          </div>

          <div className="form-group">
            <label htmlFor="reg-confirm">Confirm password</label>
            <input
              id="reg-confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              value={values.confirm}
              onChange={handleChange}
              aria-invalid={Boolean(errors.confirm)}
              placeholder="Repeat your password"
            />
            {errors.confirm ? <span className="field-error">{errors.confirm}</span> : null}
          </div>

          <button type="submit" className="login-button" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>
      )}

      <div className="auth-switch">
        {tab === 'login' ? (
          <>
            New member?{' '}
            <button type="button" onClick={() => switchTab('signup')}>
              Create an account
            </button>
          </>
        ) : (
          <>
            Already registered?{' '}
            <button type="button" onClick={() => switchTab('login')}>
              Sign in
            </button>
          </>
        )}
      </div>
    </div>
  );
}
