const stylesByType = {
  error: 'border-rose-300 bg-rose-50 text-rose-700',
  success: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  info: 'border-sky-300 bg-sky-50 text-sky-700'
};

const Alert = ({ type = 'info', message }) => {
  if (!message) return null;

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${stylesByType[type] || stylesByType.info}`}>
      {message}
    </div>
  );
};

export default Alert;
