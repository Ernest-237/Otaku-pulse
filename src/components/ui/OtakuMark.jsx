export default function OtakuMark({
  size = 18,
  className,
  style,
  kind = '🍡',
}) {
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size,
        lineHeight: 1,
        flexShrink: 0,
        ...style,
      }}
    >
      {kind}
    </span>
  )
}
