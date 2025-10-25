/**
 * Reusable Card Component
 */

const Card = ({
  children,
  title,
  subtitle,
  headerAction,
  padding = 'p-6',
  className = '',
  hover = false,
  centerTitle = false,
}) => {
  return (
    <div
      className={`
        relative overflow-hidden
        bg-gradient-to-br from-dark-card/80 to-dark-card/40
        backdrop-blur-xl rounded-2xl border border-white/10
        shadow-lg
        ${hover ? 'hover:border-white/20 hover:shadow-xl transition-all duration-300' : ''}
        ${className}
      `}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none" />

      {(title || headerAction) && (
        <div className={`relative flex items-center ${centerTitle && !headerAction ? 'justify-center' : 'justify-between'} px-6 py-4 border-b border-white/10`}>
          <div className={centerTitle && !headerAction ? 'text-center' : ''}>
            {title && (
              <h3 className="text-lg font-semibold text-white">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className={`relative ${padding}`}>{children}</div>
    </div>
  );
};

export default Card;
