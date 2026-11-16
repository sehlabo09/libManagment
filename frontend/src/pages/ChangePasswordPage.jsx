import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ChangePasswordPage() {
  const { token, user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [values, setValues] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function validate() {
    const next = {};
    if (!values.currentPassword) next.currentPassword = 'Your current password is required';
    if (values.newPassword.length < 8) {
      next.newPassword = 'New password must be at least 8 characters';
    } else if (!/[A-Za-z]/.test(values.newPassword) || !/[0-9]/.test(values.newPassword)) {
      next.newPassword = 'New password must contain at least one letter and one number';
    }
    if (values.confirm !== values.newPassword) next.confirm = 'Passwords do not match';
    return next;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setServerError('');
    try {
      await apiRequest('/auth/change-password', {
        method: 'POST',
        token,
        body: {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        },
      });
      await refreshUser();
      showToast('Password updated successfully', 'success');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setServerError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <h1>Change Password</h1>
      <p className="dashboard-welcome">Signed in as {user?.email}</p>

      {user?.mustChangePassword ? (
        <div className="alert alert-warn">
          For security reasons you must change the starter password before continuing.
        </div>
      ) : null}

      <form className="book-form" onSubmit={handleSubmit} noValidate>
        {serverError ? <div className="alert alert-error">{serverError}</div> : null}

        <div className="form-group">
          <label htmlFor="current-password">Current password</label>
          <input
            id="current-password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            value={values.currentPassword}
            onChange={handleChange}
            aria-invalid={Boolean(errors.currentPassword)}
          />
          {errors.currentPassword ? (
            <span className="field-error">{errors.currentPassword}</span>
          ) : null}
        </div>

        <div className="form-group">
          <label htmlFor="new-password">New password</label>
          <input
            id="new-password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            value={values.newPassword}
            onChange={handleChange}
            aria-invalid={Boolean(errors.newPassword)}
          />
          {errors.newPassword ? <span className="field-error">{errors.newPassword}</span> : null}
          <span className="helper-text">
            At least 8 characters, including a letter and a number.
          </span>
        </div>

        <div className="form-group">
          <label htmlFor="confirm-password">Confirm new password</label>
          <input
            id="confirm-password"
            name="confirm"
            type="password"
            autoComplete="new-password"
            value={values.confirm}
            onChange={handleChange}
            aria-invalid={Boolean(errors.confirm)}
          />
          {errors.confirm ? <span className="field-error">{errors.confirm}</span> : null}
        </div>

        <div className="form-buttons">
          <button type="submit" disabled={submitting}>
            {submitting ? 'Updating...' : 'Update password'}
          </button>
        </div>
      </form>
    </>
  );
}
