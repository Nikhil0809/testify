import { motion } from 'framer-motion';
import { GraduationCap, ShieldCheck, Sparkles } from 'lucide-react';

const AuthLayout = ({ children, title, subtitle, footer }) => (
  <div className="relative min-h-screen overflow-hidden">
    {/* decorative blobs */}
    <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-accent-violet/20 blur-[120px]" />
    <div className="pointer-events-none absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-accent-blue/20 blur-[120px]" />
    <div className="pointer-events-none absolute -bottom-40 left-1/3 h-[420px] w-[420px] rounded-full bg-accent-purple/15 blur-[130px]" />

    <div className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-10 px-5 py-10 lg:grid-cols-2 lg:gap-16 lg:px-10">
      {/* Brand side */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:block"
      >
        <div className="mb-8 inline-flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient shadow-glow">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className="font-display text-2xl font-extrabold text-white">Testify</span>
        </div>

        <h1 className="font-display text-5xl font-extrabold leading-tight text-white">
          Master concepts with
          <span className="bg-brand-gradient bg-clip-text text-transparent"> focused tests</span>.
        </h1>
        <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-400">
          Ten random questions. Ten minutes. Instant, detailed feedback with an explanation for
          every answer — built for students who want to improve fast.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Sparkles, title: 'Adaptive pool', text: '10 fresh MCQs every attempt' },
            { icon: ShieldCheck, title: 'Server graded', text: 'Scores computed securely' },
            { icon: GraduationCap, title: 'Deep review', text: 'Compare your answers' },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.12 }}
              className="glass glass-hover rounded-2xl p-4"
            >
              <f.icon className="mb-3 h-5 w-5 text-accent-violet" />
              <p className="text-sm font-semibold text-white">{f.title}</p>
              <p className="mt-1 text-xs text-slate-400">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Form side */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.1 }}
        className="mx-auto w-full max-w-md"
      >
        <div className="mb-7 flex items-center gap-3 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-xl font-extrabold text-white">Testify</span>
        </div>

        <div className="glass-strong rounded-3xl p-7 sm:p-9 shadow-glow">
          <h2 className="font-display text-2xl font-bold text-white">{title}</h2>
          <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>

        {footer && <p className="mt-6 text-center text-sm text-slate-400">{footer}</p>}
      </motion.div>
    </div>
  </div>
);

export default AuthLayout;
