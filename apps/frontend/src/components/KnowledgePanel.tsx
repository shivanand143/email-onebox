import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const KnowledgePanel = () => {
  const queryClient = useQueryClient();
  const { data: documents } = useQuery({
    queryKey: ["knowledge"],
    queryFn: api.listKnowledge,
  });

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");

  const addMutation = useMutation({
    mutationFn: () => api.addKnowledge({ title, content }),
    onSuccess: () => {
      setMessage("✅ Knowledge added successfully");
      setTitle("");
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["knowledge"] });
      setTimeout(() => setMessage(""), 2000);
    },
    onError: () => {
      setMessage("❌ Failed to add knowledge");
      setTimeout(() => setMessage(""), 2000);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.removeKnowledge(id),
    onSuccess: () => {
      setMessage("🗑️ Knowledge deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["knowledge"] });
      setTimeout(() => setMessage(""), 2000);
    },
    onError: () => {
      setMessage("❌ Failed to delete knowledge");
      setTimeout(() => setMessage(""), 2000);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      setMessage("⚠️ Please fill both title and content");
      setTimeout(() => setMessage(""), 2000);
      return;
    }
    addMutation.mutate();
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🧠 Knowledge Base</h2>

      {message && <div style={{ color: "#16a34a", marginBottom: "0.5rem" }}>{message}</div>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        <input
          className="input"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="input"
          style={{ minHeight: "90px" }}
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button className="button" type="submit" disabled={addMutation.isPending}>
          {addMutation.isPending ? "Adding…" : "Add Knowledge"}
        </button>
      </form>

      <hr style={{ margin: "1rem 0", borderColor: "#475569" }} />

      <div className="knowledge-list">
        {documents?.length ? (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="knowledge-card"
              style={{
                background: "#1e293b",
                borderRadius: "8px",
                padding: "0.75rem",
                marginBottom: "0.75rem",
                color: "#e2e8f0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <strong>{doc.title}</strong>
                <button
                  className="button"
                  style={{
                    background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  }}
                  onClick={() => removeMutation.mutate(doc.id)}
                >
                  Remove
                </button>
              </div>
              <p style={{ color: "#cbd5f5", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                {doc.content}
              </p>
            </div>
          ))
        ) : (
          <span style={{ color: "#94a3b8" }}>No knowledge yet</span>
        )}
      </div>
    </div>
  );
};
