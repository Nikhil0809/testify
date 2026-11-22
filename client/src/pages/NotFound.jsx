import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import useDocumentTitle from '../hooks/useDocumentTitle';

const NotFound = () => {
  useDocumentTitle('Page not found');
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="glass-strong max-w-md rounded-3xl p-10">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gradient shadow-glow">
          <Compass className="h-8 w-8 text-white" />
        </div>
        <p className="font-display text-6xl font-extrabold bg-brand-gradient bg-clip-text text-transparent">
          404
        </p>
        <h1 className="mt-3 font-display text-xl font-bold text-white">Page not found</h1>
        <p className="mt-2 text-sm text-slate-400">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link to="/dashboard" className="btn-primary mt-6 inline-flex">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
