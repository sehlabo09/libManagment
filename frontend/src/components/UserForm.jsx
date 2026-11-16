import { useState } from 'react';

const EMPTY = {
  fullName: '',
  membershipId: '',
  email: '',
  role: 'USER',
  password: '',
};

export default function UserForm({ user, onSubmit, onCancel }) {
  const isEdit = Boolean(user);

  const [values, setValues] = useState(
    isEdit
      ? {
          fullName: user.fullName || '',
          membershipId: user.membershipId || '',
          email: user.email || '',
          role: user.role || 'USER',
          password: '',
        }
      : EMPTY
  );

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

    // Password is mandatory when creating, optional (change) when editing.
    if (!isEdit || values.password) {
      if (values.password.length < 8) {
        next.password = 'Password must be at least 8 characters';
      } else if (!/[A-Za-z]/.test(values.password) || !/[0-9]/.test(values.password)) {
        next.password = 'Password must contain at least one letter and one number';
      }
    }

    return next;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload = {
      fullName: values.fullName.trim(),
      membershipId: values.membershipId.trim(),
      email: values.email.trim(),
      role: values.role,
    };
    if (values.password) payload.password = values.password;

    setSubmitting(true);
    setServerError('');
    try {
      await onSubmit(payload);
    } catch (error) {
      setServerError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="book-form" onSubmit={handleSubmit} noValidate>
      {serverError ? <div className="alert alert-error">{serverError}</div> : null}

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="user-fullname">Full name</label>
          <input
            id="user-fullname"
            name="fullName"
            value={values.fullName}
            onChange={handleChange}
            aria-invalid={Boolean(errors.fullName)}
            placeholder="e.g. Thabo Mokoena"
          />
          {errors.fullName ? <span className="field-error">{errors.fullName}</span> : null}
        </div>

        <div className="form-group">
          <label htmlFor="user-membership">Membership ID</label>
          <input
            id="user-membership"
            name="membershipId"
            value={values.membershipId}
            onChange={handleChange}
            aria-invalid={Boolean(errors.membershipId)}
            placeholder="e.g. LIB-2026-014"
          />
          {errors.membershipId ? <span className="field-error">{errors.membershipId}</span> : null}
          <span className="helper-text">Membership IDs must be unique.</span>
        </div>

        <div className="form-group">
          <label htmlFor="user-email">Email address</label>
          <input
            id="user-email"
            name="email"
            type="email"
            value={values.email}
            onChange={handleChange}
            aria-invalid={Boolean(errors.email)}
            placeholder="e.g. thabo@example.com"
          />
          {errors.email ? <span className="field-error">{errors.email}</span> : null}
          <span className="helper-text">Email addresses must be unique.</span>
        </div>

        <div className="form-group">
          <label htmlFor="user-role">Role</label>
          <select id="user-role" name="role" value={values.role} onChange={handleChange}>
            <option value="USER">USER - library member</option>
            <option value="ADMIN">ADMIN - full access</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="user-password">
            {isEdit ? 'New password (leave blank to keep current)' : 'Password'}
          </label>
          <input
            id="user-password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={values.password}
            onChange={handleChange}
            aria-invalid={Boolean(errors.password)}
            placeholder={isEdit ? 'Unchanged' : 'At least 8 characters'}
          />
          {errors.password ? <span className="field-error">{errors.password}</span> : null}
          <span className="helper-text">
            At least 8 characters with a letter and a number.
          </span>
        </div>
      </div>

      <div className="form-buttons">
        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : isEdit ? 'Update user' : 'Create user'}
        </button>
        <button type="button" className="cancel-button" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      </div>
    </form>
  );
}
