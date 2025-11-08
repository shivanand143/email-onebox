import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useFilterStore } from "@/stores/filterStore";
import { ChevronDown } from "lucide-react";


export const AccountFilter = () => {
  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: api.listAccounts,
  });
  const { accountId, folder, setAccountId, setFolder } = useFilterStore();

  const folders = useMemo(() => {
    if (!accounts || !accountId) return [];
    const account = accounts.find((item) => item.id === accountId);
    return account?.folders ?? [];
  }, [accounts, accountId]);

  return (
    <div className="account-filter-container">
      <h2 className="filter-heading">Accounts</h2>

      {/* Email Account Dropdown */}
      <div className="dropdown-group">
        <label htmlFor="account" className="dropdown-label">
          Email Account
        </label>
        <div className="dropdown-wrapper">
          <select
            id="account"
            className="custom-dropdown"
            value={accountId ?? ""}
            onChange={(e) => setAccountId(e.target.value || undefined)}
          >
            <option value="">All accounts</option>
            {accounts?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label} ({a.email})
              </option>
            ))}
          </select>
          <ChevronDown size={18} className="dropdown-icon" />
        </div>
      </div>

      {/* Folder Dropdown */}
      <div className="dropdown-group">
        <label htmlFor="folder" className="dropdown-label">
          Folder
        </label>
        <div className="dropdown-wrapper">
          <select
            id="folder"
            className="custom-dropdown"
            value={folder ?? ""}
            onChange={(e) => setFolder(e.target.value || undefined)}
            disabled={!folders.length}
          >
            <option value="">All folders</option>
            {folders.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <ChevronDown size={18} className="dropdown-icon" />
        </div>
      </div>
    </div>
  );
};
