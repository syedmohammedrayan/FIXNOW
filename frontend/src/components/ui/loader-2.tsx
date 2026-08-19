'use client';

export const Loader2 = () => {
  return (
    <div
      className="loader-2"
      role="status"
      aria-label="Processing request"
    >
      <div className="loader-2-shape">
        <svg viewBox="0 0 80 80" aria-hidden="true">
          <circle r="32" cy="40" cx="40" />
        </svg>
      </div>

      <div className="loader-2-shape triangle">
        <svg viewBox="0 0 86 80" aria-hidden="true">
          <polygon points="43 8 79 72 7 72" />
        </svg>
      </div>

      <div className="loader-2-shape">
        <svg viewBox="0 0 80 80" aria-hidden="true">
          <rect height="64" width="64" y="8" x="8" />
        </svg>
      </div>

      <style jsx>{`
        .loader-2 {
          --path: #fff;
          --dot: #f00;
          --duration: 3s;

          display: flex;
          align-items: center;
          justify-content: center;
          width: max-content;
          min-height: 76px;
          padding: 8px 12px;
        }

        .loader-2-shape {
          width: 44px;
          height: 44px;
          position: relative;
          display: inline-block;
          margin: 0 16px;
        }

        .loader-2-shape::before {
          content: "";
          width: 6px;
          height: 6px;
          border-radius: 50%;
          position: absolute;
          display: block;
          background: var(--dot);
          top: 37px;
          left: 19px;
          transform: translate(-18px, -18px);
          animation: loader-2-dot-rect var(--duration)
            cubic-bezier(0.785, 0.135, 0.15, 0.86) infinite;
          z-index: 2;
        }

        .loader-2-shape svg {
          display: block;
          width: 100%;
          height: 100%;
        }

        .loader-2-shape svg rect,
        .loader-2-shape svg polygon,
        .loader-2-shape svg circle {
          fill: none;
          stroke: var(--path);
          stroke-width: 10px;
          stroke-linejoin: round;
          stroke-linecap: round;
        }

        .loader-2-shape svg polygon {
          stroke-dasharray: 145 76 145 76;
          stroke-dashoffset: 0;
          animation: loader-2-path-triangle var(--duration)
            cubic-bezier(0.785, 0.135, 0.15, 0.86) infinite;
        }

        .loader-2-shape svg rect {
          stroke-dasharray: 192 64 192 64;
          stroke-dashoffset: 0;
          animation: loader-2-path-rect var(--duration)
            cubic-bezier(0.785, 0.135, 0.15, 0.86) infinite;
        }

        .loader-2-shape svg circle {
          stroke-dasharray: 150 50 150 50;
          stroke-dashoffset: 75;
          animation: loader-2-path-circle var(--duration)
            cubic-bezier(0.785, 0.135, 0.15, 0.86) infinite;
        }

        .loader-2-shape.triangle {
          width: 48px;
        }

        .loader-2-shape.triangle::before {
          left: 21px;
          transform: translate(-10px, -18px);
          animation: loader-2-dot-triangle var(--duration)
            cubic-bezier(0.785, 0.135, 0.15, 0.86) infinite;
        }

        @keyframes loader-2-path-triangle {
          33% {
            stroke-dashoffset: 74;
          }

          66% {
            stroke-dashoffset: 147;
          }

          100% {
            stroke-dashoffset: 221;
          }
        }

        @keyframes loader-2-dot-triangle {
          33% {
            transform: translate(0, 0);
          }

          66% {
            transform: translate(10px, -18px);
          }

          100% {
            transform: translate(-10px, -18px);
          }
        }

        @keyframes loader-2-path-rect {
          25% {
            stroke-dashoffset: 64;
          }

          50% {
            stroke-dashoffset: 128;
          }

          75% {
            stroke-dashoffset: 192;
          }

          100% {
            stroke-dashoffset: 256;
          }
        }

        @keyframes loader-2-dot-rect {
          25% {
            transform: translate(0, 0);
          }

          50% {
            transform: translate(18px, -18px);
          }

          75% {
            transform: translate(0, -36px);
          }

          100% {
            transform: translate(-18px, -18px);
          }
        }

        @keyframes loader-2-path-circle {
          25% {
            stroke-dashoffset: 125;
          }

          50% {
            stroke-dashoffset: 175;
          }

          75% {
            stroke-dashoffset: 225;
          }

          100% {
            stroke-dashoffset: 275;
          }
        }

        @media (max-width: 640px) {
          .loader-2 {
            transform: scale(0.78);
          }
        }
      `}</style>
    </div>
  );
};
