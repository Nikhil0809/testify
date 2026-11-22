import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { User, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import AuthLayout from '../layouts/AuthLayout';
import { useAuth } from '../context/AuthContext';
import { ButtonLoader } from '../components/Loader';
import useDocumentTitle from '../hooks/useDocumentTitle';

const Signup = () => {
  useDocumentTitle('Create account');
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const user = await register({ name: form.name, email: form.email, password: form.password });
      toast.success(`Welcome, ${user.name.split(' ')[0]}! Your account is ready.`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start taking timed tests and track your progress."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-accent-violet hover:text-accent-purple">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="name" className="label-text">
            Full name
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              minLength={2}
              maxLength={60}
              value={form.name}
              onChange={onChange}
              placeholder="Jane Doe"
              className="input-field pl-11"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="label-text">
            Email address
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={onChange}
              placeholder="you@example.com"
              className="input-field pl-11"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="password" className="label-text">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="password"
                name="password"
                type={show ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={6}
                value={form.password}
                onChange={onChange}
                placeholder="Min. 6 characters"
                className="input-field pl-11 pr-11"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:text-slate-300"
                aria-label={show ? 'Hide password' : 'Show password'}
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirm" className="label-text">
              Confirm password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="confirm"
                name="confirm"
                type={show ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={form.confirm}
                onChange={onChange}
                placeholder="Repeat password"
                className="input-field pl-11"
              />
            </div>
          </div>
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          whileTap={{ scale: 0.98 }}
          className="btn-primary w-full"
        >
          {loading ? (
            <>
              <ButtonLoader /> Creating account…
            </>
          ) : (
            <>
              Create account <ArrowRight className="h-4 w-4" />
            </>
          )}
        </motion.button>

        <p className="text-center text-[11px] leading-relaxed text-slate-500">
          By signing up you agree to take tests under your own name. Scores are computed on the
          server.
        </p>
      </form>
    </AuthLayout>
  );
};

export default Signup;
