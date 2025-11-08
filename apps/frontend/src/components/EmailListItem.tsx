import { EmailRecord } from "@/lib/api";

interface Props {
  email: EmailRecord;
  isActive: boolean;
  onSelect: () => void;
}

const formatAddress = (addresses: EmailRecord["from"]) =>
  addresses.map((a) => a.name ?? a.address).join(", ");

export const EmailListItem = ({ email, isActive, onSelect }: Props) => (
  <button
    type="button"
    className={`email-item ${isActive ? "active" : ""}`}
    onClick={onSelect}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600 }}>{email.subject}</h3>
      <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
        {new Date(email.date).toLocaleString()}
      </span>
    </div>
    <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: "0.25rem 0" }}>
      {formatAddress(email.from)}
    </p>
    <p style={{ fontSize: "0.85rem", color: "#cbd5f5", margin: "0.25rem 0" }}>
      {email.snippet ?? email.textBody?.slice(0, 100) ?? "No preview"}
    </p>
    <div style={{ marginTop: "0.4rem" }}>
      <span className={`tag ${email.category}`}>{email.category.replace(/_/g, " ")}</span>
    </div>
  </button>
);
