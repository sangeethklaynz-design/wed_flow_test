"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  Copy,
  KeyRound,
  Plus,
  Settings,
  Shield,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import clsx from "clsx";
import { NotificationBell } from "@/components/ui/NotificationPanel";
import { apiRequest } from "@/lib/api";
import { getAccessToken, getStoredUser } from "@/lib/auth";

const PERMISSION_LABELS = {
  viewDashboard: "View dashboard",
  viewGuests: "View guests",
  addGuests: "Add guests",
  editGuests: "Edit guests",
  deleteGuests: "Delete guests",
  viewSchedule: "View schedule",
  editSchedule: "Edit schedule",
  viewInvitation: "View invitation",
  editInvitation: "Edit invitation",
  viewNotifications: "View notifications",
  editNotifications: "Edit notifications",
  viewPayments: "View payments / finance",
  editPayments: "Edit payments / ticketing",
  viewTickets: "View tickets",
  scanTickets: "Scan tickets",
};

function formatPermissionLabel(key) {
  return PERMISSION_LABELS[key] || key;
}

export default function SettingsPage() {
  const user = getStoredUser();
  const isOwner = Boolean(user?.isOrgOwner);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [roles, setRoles] = useState([]);
  const [permissionKeys, setPermissionKeys] = useState([]);
  const [staff, setStaff] = useState([]);
  const [maxStaffAccounts, setMaxStaffAccounts] = useState(0);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [draftPerms, setDraftPerms] = useState({});
  const [savingRole, setSavingRole] = useState(false);
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [newStaffRoleKey, setNewStaffRoleKey] = useState("agent");
  const [newStaffUsername, setNewStaffUsername] = useState("");
  const [credentialsBanner, setCredentialsBanner] = useState(null);
  const [actionBusyId, setActionBusyId] = useState(null);

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) || null,
    [roles, selectedRoleId]
  );

  const assignableRoles = useMemo(
    () => roles.filter((r) => !r.locked && r.key !== "admin"),
    [roles]
  );

  const loadAll = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setError("Sign in required");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [rolesData, staffData] = await Promise.all([
        apiRequest("/api/couple/roles", { token }),
        apiRequest("/api/couple/staff", { token }),
      ]);
      const nextRoles = rolesData?.roles || [];
      setRoles(nextRoles);
      setPermissionKeys(rolesData?.permissionKeys || []);
      setStaff(staffData?.staff || []);
      setMaxStaffAccounts(Number(staffData?.maxStaffAccounts) || 0);
      setSelectedRoleId((prev) => {
        if (prev && nextRoles.some((r) => r.id === prev)) return prev;
        const firstEditable =
          nextRoles.find((r) => !r.locked && r.key !== "admin") || nextRoles[0];
        return firstEditable?.id || null;
      });
    } catch (err) {
      setError(err?.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!selectedRole) {
      setDraftPerms({});
      return;
    }
    setDraftPerms({ ...(selectedRole.permissions || {}) });
  }, [selectedRole]);

  const handleTogglePerm = (key) => {
    if (!selectedRole || selectedRole.locked || selectedRole.key === "admin") {
      return;
    }
    setDraftPerms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveRole = async () => {
    const token = getAccessToken();
    if (!token || !selectedRole || selectedRole.locked) return;
    setSavingRole(true);
    setError("");
    try {
      const data = await apiRequest(`/api/couple/roles/${selectedRole.id}`, {
        method: "PATCH",
        token,
        body: { permissions: draftPerms },
      });
      if (data?.roles) setRoles(data.roles);
      else await loadAll();
    } catch (err) {
      setError(err?.message || "Failed to save role");
    } finally {
      setSavingRole(false);
    }
  };

  const handleCreateStaff = async () => {
    const token = getAccessToken();
    if (!token || creatingStaff) return;
    setCreatingStaff(true);
    setError("");
    try {
      const data = await apiRequest("/api/couple/staff", {
        method: "POST",
        token,
        body: {
          roleKey: newStaffRoleKey,
          username: newStaffUsername.trim() || undefined,
        },
      });
      if (data?.credentials) {
        setCredentialsBanner(data.credentials);
      }
      setNewStaffUsername("");
      await loadAll();
    } catch (err) {
      setError(err?.message || "Failed to create staff");
    } finally {
      setCreatingStaff(false);
    }
  };

  const runStaffAction = async (staffId, body, { confirmMessage } = {}) => {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    const token = getAccessToken();
    if (!token) return;
    setActionBusyId(staffId);
    setError("");
    try {
      const data = await apiRequest(`/api/couple/staff/${staffId}`, {
        method: "PATCH",
        token,
        body,
      });
      if (data?.credentials) {
        setCredentialsBanner(data.credentials);
      }
      await loadAll();
    } catch (err) {
      setError(err?.message || "Failed to update staff");
    } finally {
      setActionBusyId(null);
    }
  };

  const handleDeleteStaff = async (staffId) => {
    if (!window.confirm("Delete this staff account? This cannot be undone.")) {
      return;
    }
    const token = getAccessToken();
    if (!token) return;
    setActionBusyId(staffId);
    setError("");
    try {
      await apiRequest(`/api/couple/staff/${staffId}`, {
        method: "DELETE",
        token,
      });
      await loadAll();
    } catch (err) {
      setError(err?.message || "Failed to delete staff");
    } finally {
      setActionBusyId(null);
    }
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  };

  if (!isOwner) {
    return (
      <div className="p-6 md:p-8 lg:p-12 w-full min-w-0">
        <section className="w-full min-h-[78px] bg-white rounded-[20px] px-6 md:px-8 py-3.5 flex items-center justify-between border border-[#E2E8F0]/70 shadow-sm mb-6">
          <h1 className="font-serif font-bold text-[24px] md:text-[28px] text-[#0A2569]">
            Settings
          </h1>
          <NotificationBell />
        </section>
        <div className="bg-white rounded-[15px] border border-[#E2E8F0]/70 p-8 text-center text-[#64748B]">
          Only the organization owner can manage roles and staff.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 lg:p-12 w-full min-w-0 flex flex-col gap-6 md:gap-8">
      <section className="w-full min-h-[78px] bg-white rounded-[20px] px-6 md:px-8 py-3.5 flex items-center justify-between border border-[#E2E8F0]/70 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EAF5FF] flex items-center justify-center text-[#054380]">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-[24px] md:text-[28px] text-[#0A2569] leading-tight">
              Settings
            </h1>
            <p className="text-[13px] text-[#64748B] mt-0.5">
              Roles and staff credentials for your organization
            </p>
          </div>
        </div>
        <NotificationBell />
      </section>

      {error ? (
        <div className="flex items-start gap-2 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {credentialsBanner ? (
        <div className="rounded-[15px] border border-[#B7D4F5] bg-[#EAF5FF] px-5 py-4">
          <p className="font-sans font-semibold text-[#054380] text-sm mb-2">
            Credentials (shown once — copy now)
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="text-sm text-[#0A2569]">
              <span className="text-[#64748B]">Username:</span>{" "}
              <code className="font-mono bg-white/80 px-2 py-0.5 rounded">
                {credentialsBanner.username}
              </code>
            </div>
            <div className="text-sm text-[#0A2569]">
              <span className="text-[#64748B]">Password:</span>{" "}
              <code className="font-mono bg-white/80 px-2 py-0.5 rounded">
                {credentialsBanner.password}
              </code>
            </div>
            <button
              type="button"
              onClick={() =>
                copyText(
                  `${credentialsBanner.username} / ${credentialsBanner.password}`
                )
              }
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0B72E7] hover:underline"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy
            </button>
            <button
              type="button"
              onClick={() => setCredentialsBanner(null)}
              className="sm:ml-auto text-sm text-[#64748B] hover:text-[#0A2569]"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="bg-white rounded-[15px] border border-[#E2E8F0]/70 p-10 text-center text-[#64748B]">
          Loading settings…
        </div>
      ) : (
        <>
          {/* Roles */}
          <section className="w-full bg-white rounded-[15px] p-6 sm:p-7 md:p-8 border border-[#E2E8F0]/70 shadow-sm">
            <div className="flex items-start gap-3 mb-6">
              <div className="w-9 h-9 rounded-lg bg-[#EAF5FF] flex items-center justify-center text-[#054380] shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-sans font-bold text-[18px] md:text-[20px] text-[#0A2569]">
                  Roles
                </h2>
                <p className="text-[13px] text-[#64748B] mt-1">
                  Admin is locked. Edit manager and agent permission checkboxes.
                </p>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg:w-56 shrink-0 space-y-2">
                {roles.map((role) => {
                  const active = role.id === selectedRoleId;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRoleId(role.id)}
                      className={clsx(
                        "w-full text-left px-4 py-3 rounded-xl border transition-colors",
                        active
                          ? "bg-[#EAF5FF] border-[#0B72E7]/40 text-[#054380]"
                          : "bg-white border-[#E2E8F0] text-[#334155] hover:bg-[#F8FAFC]"
                      )}
                    >
                      <div className="font-medium text-sm capitalize">
                        {role.name || role.key}
                      </div>
                      <div className="text-[11px] text-[#64748B] mt-0.5">
                        {role.locked || role.key === "admin"
                          ? "Locked"
                          : "Editable"}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex-1 min-w-0">
                {selectedRole ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
                      {(permissionKeys.length
                        ? permissionKeys
                        : Object.keys(draftPerms)
                      ).map((key) => {
                        const locked =
                          selectedRole.locked || selectedRole.key === "admin";
                        const checked = Boolean(draftPerms[key]);
                        return (
                          <label
                            key={key}
                            className={clsx(
                              "flex items-center gap-3 px-3 py-2.5 rounded-xl border border-[#E2E8F0]",
                              locked
                                ? "bg-[#F8FAFC] cursor-not-allowed opacity-80"
                                : "bg-white cursor-pointer hover:border-[#B7D4F5]"
                            )}
                          >
                            <input
                              type="checkbox"
                              className="rounded border-[#CBD5E1] text-[#0B72E7] focus:ring-[#0B72E7]"
                              checked={checked}
                              disabled={locked}
                              onChange={() => handleTogglePerm(key)}
                            />
                            <span className="text-sm text-[#1E293B]">
                              {formatPermissionLabel(key)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {!(selectedRole.locked || selectedRole.key === "admin") ? (
                      <button
                        type="button"
                        onClick={handleSaveRole}
                        disabled={savingRole}
                        className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-[#054380] text-white text-sm font-medium hover:bg-[#04366a] disabled:opacity-60"
                      >
                        <Check className="w-4 h-4" />
                        {savingRole ? "Saving…" : "Save permissions"}
                      </button>
                    ) : null}
                  </>
                ) : (
                  <p className="text-sm text-[#64748B]">Select a role</p>
                )}
              </div>
            </div>
          </section>

          {/* Staff */}
          <section className="w-full bg-white rounded-[15px] p-6 sm:p-7 md:p-8 border border-[#E2E8F0]/70 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#EAF5FF] flex items-center justify-center text-[#054380] shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-sans font-bold text-[18px] md:text-[20px] text-[#0A2569]">
                    Staff
                  </h2>
                  <p className="text-[13px] text-[#64748B] mt-1">
                    {staff.filter((s) => !s.isOrgOwner).length} /{" "}
                    {maxStaffAccounts} seats used (excluding owner)
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 mb-6 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <input
                type="text"
                value={newStaffUsername}
                onChange={(e) => setNewStaffUsername(e.target.value)}
                placeholder="Username (optional)"
                className="h-10 px-3 rounded-xl border border-[#CBD5E1] text-sm bg-white flex-1 min-w-0 focus:outline-none focus:ring-1 focus:ring-[#0B72E7] focus:border-[#0B72E7]"
              />
              <select
                value={newStaffRoleKey}
                onChange={(e) => setNewStaffRoleKey(e.target.value)}
                className="h-10 px-3 rounded-xl border border-[#CBD5E1] text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#0B72E7]"
              >
                {assignableRoles.map((r) => (
                  <option key={r.id} value={r.key}>
                    {r.name || r.key}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleCreateStaff}
                disabled={creatingStaff || !assignableRoles.length}
                className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-[#0B72E7] text-white text-sm font-medium hover:bg-[#0960c4] disabled:opacity-60"
              >
                <Plus className="w-4 h-4" />
                {creatingStaff ? "Creating…" : "Create staff"}
              </button>
            </div>

            <div className="w-full overflow-x-auto rounded-[10px] border border-[#E2E8F0]/80">
              <table className="w-full text-left border-collapse min-w-[560px]">
                <thead>
                  <tr className="bg-[#E2EAF5] h-[46px] border-b border-[#D8E3F2]">
                    <th className="px-4 py-3 text-[11px] uppercase tracking-wide text-[#556987] font-bold">
                      User
                    </th>
                    <th className="px-4 py-3 text-[11px] uppercase tracking-wide text-[#556987] font-bold">
                      Role
                    </th>
                    <th className="px-4 py-3 text-[11px] uppercase tracking-wide text-[#556987] font-bold">
                      Status
                    </th>
                    <th className="px-4 py-3 text-[11px] uppercase tracking-wide text-[#556987] font-bold text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((row, index) => (
                    <tr
                      key={row.id}
                      className={clsx(
                        "border-b border-[#EEF2F6] h-[56px]",
                        index % 2 === 0 ? "bg-white" : "bg-[#FCFDFE]"
                      )}
                    >
                      <td className="px-4 py-3 text-sm text-[#1E293B]">
                        <div className="font-medium">
                          {row.username || row.email || "—"}
                        </div>
                        {row.isOrgOwner ? (
                          <div className="text-[11px] text-[#054380]">Owner</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#334155] capitalize">
                        {row.roleName || row.roleKey || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={clsx(
                            "inline-flex px-2 py-0.5 rounded-md text-xs font-medium",
                            row.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          )}
                        >
                          {row.isActive ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {row.isOrgOwner ? (
                          <span className="text-xs text-[#94A3B8]">—</span>
                        ) : (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              title="Reset password"
                              disabled={actionBusyId === row.id}
                              onClick={() =>
                                runStaffAction(
                                  row.id,
                                  { resetPassword: true },
                                  {
                                    confirmMessage:
                                      "Reset password for this staff user?",
                                  }
                                )
                              }
                              className="p-2 rounded-lg text-[#054380] hover:bg-[#EAF5FF] disabled:opacity-50"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              title={row.isActive ? "Disable" : "Enable"}
                              disabled={actionBusyId === row.id}
                              onClick={() =>
                                runStaffAction(row.id, {
                                  isActive: !row.isActive,
                                })
                              }
                              className="p-2 rounded-lg text-[#054380] hover:bg-[#EAF5FF] disabled:opacity-50"
                            >
                              <UserCog className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              title="Delete"
                              disabled={actionBusyId === row.id}
                              onClick={() => handleDeleteStaff(row.id)}
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!staff.length ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-sm text-[#64748B]"
                      >
                        No users yet
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
