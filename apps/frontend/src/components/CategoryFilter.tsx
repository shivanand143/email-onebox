import { EmailCategory } from "@/lib/api";
import { useFilterStore } from "@/stores/filterStore";

const categories: { value: EmailCategory; label: string }[] = [
  { value: "interested", label: "Interested" },
  { value: "meeting_booked", label: "Meeting" },
  { value: "not_interested", label: "Not Interested" },
  { value: "out_of_office", label: "OOO" },
  { value: "spam", label: "Spam" },
];

export const CategoryFilter = () => {
  const { categories: active, toggleCategory } = useFilterStore();

  return (
    <div>
      <label>Categories</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.5rem" }}>
        {categories.map((cat) => {
          const activeStyle = active.includes(cat.value);
          return (
            <button
              key={cat.value}
              type="button"
              className="button"
              style={{
                background: activeStyle
                  ? "linear-gradient(135deg, #6366f1, #818cf8)"
                  : "rgba(255,255,255,0.05)",
              }}
              onClick={() => toggleCategory(cat.value)}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
