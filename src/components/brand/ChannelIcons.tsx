// Ícones das plataformas (logos de marca em SVG inline). Mantêm as cores
// oficiais — o className de cor da nav não se aplica a eles de propósito.
// Assinatura compatível com os ícones lucide usados na Sidebar.
type IconProps = { size?: number; className?: string; strokeWidth?: number };

export function GoogleAdsIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      {/* barra amarela + barra azul formando o "A", disco azul na base */}
      <rect
        x="8.6"
        y="1.8"
        width="6.4"
        height="15.5"
        rx="3.2"
        fill="#FBBC04"
        transform="rotate(20 11.8 9.5)"
      />
      <rect
        x="9"
        y="1.8"
        width="6.4"
        height="15.5"
        rx="3.2"
        fill="#4285F4"
        transform="rotate(-20 12.2 9.5)"
      />
      <circle cx="6.6" cy="18.2" r="3.3" fill="#34A853" />
    </svg>
  );
}

export function MetaAdsIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      {/* símbolo infinito da Meta */}
      <path
        fill="#0866FF"
        d="M7 7.4c-2.9 0-5 2.1-5 4.6s2.1 4.6 5 4.6c2.5 0 4.1-1.8 5-3.6.9 1.8 2.5 3.6 5 3.6 2.9 0 5-2.1 5-4.6s-2.1-4.6-5-4.6c-2.5 0-4.1 1.8-5 3.6-.9-1.8-2.5-3.6-5-3.6Zm0 3.1c1.2 0 2 .9 2.9 2.4l.1.1-.1.1c-.9 1.5-1.7 2.4-2.9 2.4-1.3 0-2.2-.9-2.2-2s.9-2 2.2-2Zm10 0c1.3 0 2.2.9 2.2 2s-.9 2-2.2 2c-1.2 0-2-.9-2.9-2.4l-.1-.1.1-.1c.9-1.5 1.7-2.4 2.9-2.4Z"
      />
    </svg>
  );
}
