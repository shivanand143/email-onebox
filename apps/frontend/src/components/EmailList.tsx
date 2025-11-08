import { useEmails } from "@/hooks/useEmails";
import { EmailListItem } from "./EmailListItem";

interface Props {
  selectedEmailId?: string;
  onSelect: (id: string) => void;
}

export const EmailList = ({ selectedEmailId, onSelect }: Props) => {
  const { data, isLoading, isError, refetch, isFetching } = useEmails();
  const items = data?.items ?? [];

  if (isLoading) return <div className="email-list"><p>Loading emails…</p></div>;
  if (isError)
    return (
      <div className="email-list">
        <p>Failed to load emails.</p>
        <button className="button" onClick={() => refetch()}>Retry</button>
      </div>
    );

  return (
    <div className="email-list">
      <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <strong>{data?.total ?? 0} emails</strong>
        {isFetching && <span style={{ marginLeft: "0.5rem", color: "#94a3b8" }}>Refreshing…</span>}
      </div>
      <div className="email-cards">
        {items.map((email) => (
          <EmailListItem
            key={email.id}
            email={email}
            isActive={email.id === selectedEmailId}
            onSelect={() => onSelect(email.id)}
          />
        ))}
        {!items.length && <p style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>No emails found</p>}
      </div>
    </div>
  );
};
