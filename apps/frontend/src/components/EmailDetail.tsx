import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, EmailCategory } from "@/lib/api";
import { useEmail } from "@/hooks/useEmails";

interface Props {
  emailId?: string;
}

const categories: EmailCategory[] = [
  "interested",
  "meeting_booked",
  "not_interested",
  "out_of_office",
  "spam",
  "uncategorized",
];

export const EmailDetail = ({ emailId }: Props) => {
  const queryClient = useQueryClient();
  const { data: email, isLoading } = useEmail(emailId);
  const [reply, setReply] = useState("");
  const [context, setContext] = useState("");
  const [showAIReply, setShowAIReply] = useState(false);
  const [knowledgeLoaded, setKnowledgeLoaded] = useState(false);
  const [knowledgeError, setKnowledgeError] = useState<string | null>(null);

  useEffect(() => {
    setReply("");
    setContext("");
    setShowAIReply(false);
    setKnowledgeLoaded(false);
    setKnowledgeError(null);
  }, [emailId]);

  const updateCategory = useMutation({
    mutationFn: (category: EmailCategory) =>
      api.updateCategory(emailId!, category),
    onSuccess: (_, category) => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      queryClient.setQueryData(["email", emailId], (current: any) => ({
        ...current,
        category,
      }));
    },
  });

  const reclassify = useMutation({
    mutationFn: () => api.reclassify(emailId!),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      queryClient.setQueryData(["email", emailId], (current: any) => ({
        ...current,
        category: result.category,
      }));
    },
  });

  const suggestReply = useMutation({
    mutationFn: () =>
      api.suggestReply(
        emailId!,
        email?.textBody ?? email?.htmlBody ?? "",
        context || undefined
      ),
    onSuccess: (result) => setReply(result.reply),
  });

  if (!emailId)
    return (
      <div className="email-detail empty-state">
        <p>Select an email to view details.</p>
      </div>
    );

  if (isLoading || !email)
    return (
      <div className="email-detail empty-state">
        <p>Loading email details...</p>
      </div>
    );

  const hasHTML = !!email.htmlBody;

  return (
    <div className="email-detail">
      {/* Header */}
      <div className="email-header">
        <div className="email-meta">
          <span className={`tag ${email.category}`}>
            {email.category.replace(/_/g, " ")}
          </span>
          <h2 className="email-subject">{email.subject}</h2>
          <div className="email-fromto">
            <div>
              <strong>From:</strong>{" "}
              {email.from.map((f) => f.name || f.address).join(", ")}
            </div>
            <div>
              <strong>To:</strong>{" "}
              {email.to.map((t) => t.name || t.address).join(", ")}
            </div>
            <div>
              <strong>Date:</strong>{" "}
              {new Date(email.date).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </div>
          </div>
        </div>

        {/* Category dropdown + AI reclassify button */}
        <div className="email-controls">
          <select
            className="select"
            value={email.category}
            onChange={(e) =>
              updateCategory.mutate(e.target.value as EmailCategory)
            }
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <button
            className="button"
            onClick={() => reclassify.mutate()}
            disabled={reclassify.isPending}
          >
            {reclassify.isPending ? "Reclassifying…" : "Re-run AI"}
          </button>
        </div>
      </div>

      {/* Email Body */}
      <div className="email-body-container">
        {hasHTML ? (
          <div
            className="email-body html"
            dangerouslySetInnerHTML={{ __html: email.htmlBody! }}
          />
        ) : (
          <pre className="email-body text">{email.textBody ?? "No content"}</pre>
        )}
      </div>

      {/* Toggle for AI Reply */}
      {!showAIReply && (
        <div className="ai-reply-toggle">
          <button
            className="button"
            onClick={async () => {
              setShowAIReply(true);
              setKnowledgeError(null);
              if (!knowledgeLoaded) {
                try {
                  await api.listKnowledge(); // 🔥 Lazy-load knowledge only once
                  setKnowledgeLoaded(true);
                  console.log("✅ Knowledge base loaded");
                } catch (err) {
                  console.error("⚠️ Failed to load knowledge base", err);
                  setKnowledgeError("Failed to load AI knowledge base.");
                }
              }
            }}
          >
            ✳️ Show AI Reply
          </button>
        </div>
      )}

      {/* AI Reply Section */}
      {showAIReply && (
        <div className="reply-panel">
          <h3>AI Suggested Reply</h3>

          {knowledgeError && (
            <p className="text-red-400 text-sm mb-2">{knowledgeError}</p>
          )}
          {!knowledgeLoaded && !knowledgeError && (
            <p className="text-slate-400 text-sm mb-2">
              Loading knowledge base...
            </p>
          )}

          <textarea
            placeholder="Click generate to create a suggested reply."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
          <textarea
            placeholder="Optional: add more context for AI..."
            value={context}
            onChange={(e) => setContext(e.target.value)}
            style={{ minHeight: "80px" }}
          />
          <button
            className="button"
            disabled={suggestReply.isPending}
            onClick={() => suggestReply.mutate()}
          >
            {suggestReply.isPending ? "Generating…" : "Generate Suggested Reply"}
          </button>
        </div>
      )}
    </div>
  );
};
