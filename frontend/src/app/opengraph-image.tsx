import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Conclave — Confidential Private Credit on Zama fhEVM";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(ellipse at top, #f7f3df 0%, rgb(247, 243, 223) 60%, #ece4cb 100%)",
          display: "flex",
          flexDirection: "column",
          padding: "80px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#725d42",
          position: "relative",
        }}
      >
        {/* paper grain dots — top corner accent */}
        <div
          style={{
            position: "absolute",
            top: 60,
            right: 80,
            display: "flex",
            gap: 8,
            opacity: 0.6,
          }}
        >
          <div style={{ width: 12, height: 12, borderRadius: 12, background: "#82d5bb" }} />
          <div style={{ width: 12, height: 12, borderRadius: 12, background: "#f7cd67" }} />
          <div style={{ width: 12, height: 12, borderRadius: 12, background: "#8ac68a" }} />
          <div style={{ width: 12, height: 12, borderRadius: 12, background: "#e59266" }} />
        </div>

        {/* small caps category */}
        <div
          style={{
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#9f927d",
            marginBottom: 32,
          }}
        >
          Confidential Onchain Finance · Zama fhEVM
        </div>

        {/* big wordmark with leaf */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginBottom: 28,
          }}
        >
          <div style={{ fontSize: 92, lineHeight: 1 }}>🍃</div>
          <div
            style={{
              fontSize: 144,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "#794f27",
              lineHeight: 1,
            }}
          >
            Conclave
          </div>
        </div>

        {/* tagline */}
        <div
          style={{
            fontSize: 38,
            fontWeight: 500,
            letterSpacing: "-0.005em",
            color: "#725d42",
            maxWidth: 940,
            lineHeight: 1.25,
          }}
        >
          Confidential private credit, decided in cryptographic conclave.
        </div>

        {/* feature row pills */}
        <div
          style={{
            display: "flex",
            gap: 14,
            marginTop: 56,
            flexWrap: "wrap",
          }}
        >
          {[
            { emoji: "🌿", label: "Encrypted KYC tier" },
            { emoji: "🌱", label: "Score-as-state" },
            { emoji: "🪺", label: "Tier-gated pool" },
            { emoji: "🗳️", label: "Anti-bribery conclave" },
          ].map((p) => (
            <div
              key={p.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "#fffdf3",
                border: "2px solid #d4c9b4",
                borderRadius: 50,
                padding: "12px 22px",
                fontSize: 22,
                fontWeight: 600,
                color: "#794f27",
                boxShadow: "0 4px 0 0 #bdaea0",
              }}
            >
              <span style={{ fontSize: 28, lineHeight: 1 }}>{p.emoji}</span>
              <span>{p.label}</span>
            </div>
          ))}
        </div>

        {/* footer URL */}
        <div
          style={{
            position: "absolute",
            left: 80,
            bottom: 56,
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 24,
            fontFamily: "monospace",
            color: "#9f927d",
            fontWeight: 600,
            letterSpacing: "0.02em",
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 10,
              background: "#6fba2c",
            }}
          />
          conclave-rho.vercel.app
          <span style={{ color: "#c4b89e" }}>·</span>
          Sepolia · 4 contracts live
        </div>

        {/* footer right — Conclave Phone metaphor mark */}
        <div
          style={{
            position: "absolute",
            right: 80,
            bottom: 50,
            fontSize: 18,
            color: "#9f927d",
            fontFamily: "monospace",
            fontWeight: 600,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          Conclave Phone v0.1
        </div>
      </div>
    ),
    { ...size },
  );
}
