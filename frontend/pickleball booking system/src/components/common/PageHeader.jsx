const PageHeader = ({ title, subtitle }) => (
  <div className="mb-6 sm:mb-8">
    <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">{title}</h1>
    {subtitle && <p className="mt-3 max-w-3xl text-base text-slate-600">{subtitle}</p>}
  </div>
);

export default PageHeader;
