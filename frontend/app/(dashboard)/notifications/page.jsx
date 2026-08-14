"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Bell, Check, Filter, Info, ChevronDown, Calendar, 
  RefreshCw, UserPlus, CheckCircle2, XCircle, 
  MoreVertical, ChevronLeft, ChevronRight, CheckSquare, Square,
  CheckCheck, Trash2
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import RowActionsMenu from "@/components/ui/RowActionsMenu";
import { NotificationBell } from "@/components/ui/NotificationPanel";
import ViewNotificationModal from "@/components/notifications/ViewNotificationModal";
import ConfirmDeleteModal from "@/components/guests/ConfirmDeleteModal";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [rsvpChangeRequest, setRsvpChangeRequest] = useState("requested"); // requested, not_requested, all
  const [guestStatus, setGuestStatus] = useState("All status");
  const [notificationType, setNotificationType] = useState("All types");
  const [dateRange, setDateRange] = useState("Select date range");
  const [sortBy, setSortBy] = useState("Newest first");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Actions menu state
  const [openMenuId, setOpenMenuId] = useState(null);
  
  // Modals state
  const [actionNotification, setActionNotification] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const token = getAccessToken();
    const DUMMY_DATA = [
      { id: "1", type: "change_request", title: "RSVP change requested", message: "Mr. Perera has requested to change their RSVP details.", createdAt: new Date(Date.now() - 16 * 60000).toISOString(), isRead: false, guest: { name: "Mr. Perera", phone: "071 123 4567", status: "pending review", requestForChange: true } },
      { id: "2", type: "rsvp_submitted", title: "New RSVP received", message: "Mr. Gamage has confirmed their attendance.", createdAt: new Date(Date.now() - 45 * 60000).toISOString(), isRead: false, guest: { name: "Mr. Gamage", phone: "077 123 1231", status: "confirmed", requestForChange: false } },
      { id: "3", type: "rsvp_submitted", title: "New RSVP received", message: "Ms. Chethana has confirmed their attendance.", createdAt: new Date(Date.now() - 60 * 60000).toISOString(), isRead: true, guest: { name: "Ms. Chethana", phone: "071 882 4836", status: "confirmed", requestForChange: false } },
      { id: "4", type: "rsvp_cancelled", title: "RSVP declined", message: "Mr. Behan has declined the invitation.", createdAt: new Date(Date.now() - 120 * 60000).toISOString(), isRead: true, guest: { name: "Mr. Behan", phone: "011 234 5678", status: "declined", requestForChange: false } },
      { id: "5", type: "change_request", title: "RSVP change requested", message: "Ms. Heshani has requested to change their RSVP details.", createdAt: new Date(Date.now() - 180 * 60000).toISOString(), isRead: true, guest: { name: "Ms. Heshani", phone: "078 123 4567", status: "pending review", requestForChange: true } },
      { id: "6", type: "guest_added", title: "New Guest added", message: "Kamal Perera has been added to the guest list.", createdAt: new Date(Date.now() - 300 * 60000).toISOString(), isRead: true, guest: { name: "Kamal Perera", phone: "071 000 0001", status: "pending", requestForChange: false } },
      { id: "7", type: "schedule_updated", title: "Event updated", message: "\"Photo Session\" has been updated.", createdAt: new Date(Date.now() - 400 * 60000).toISOString(), isRead: true, guest: null },
      { id: "8", type: "rsvp_submitted", title: "New RSVP received", message: "Sunil Silva has confirmed their attendance.", createdAt: new Date(Date.now() - 1440 * 60000).toISOString(), isRead: true, guest: { name: "Sunil Silva", phone: "077 111 2222", status: "confirmed", requestForChange: false } },
      { id: "9", type: "rsvp_cancelled", title: "RSVP declined", message: "Nimal Fernando has declined the invitation.", createdAt: new Date(Date.now() - 2880 * 60000).toISOString(), isRead: true, guest: { name: "Nimal Fernando", phone: "071 222 3333", status: "declined", requestForChange: false } },
      { id: "10", type: "change_request", title: "RSVP change requested", message: "Amal Silva has requested to change their RSVP details.", createdAt: new Date(Date.now() - 4320 * 60000).toISOString(), isRead: true, guest: { name: "Amal Silva", phone: "072 444 5555", status: "pending review", requestForChange: true } }
    ];

    if (!token) {
      setNotifications(DUMMY_DATA);
      setLoading(false);
      return;
    }
    try {
      const data = await apiRequest("/api/couple/notifications", { token });
      setNotifications([...(data.notifications || []), ...DUMMY_DATA]);
    } catch (err) {
      console.error(err);
      setNotifications(DUMMY_DATA);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      await apiRequest("/api/couple/notifications/mark-read", { method: "POST", token });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkOneRead = async (notif) => {
    if (!notif || notif.isRead) return;
    const token = getAccessToken();
    if (token) {
      try {
        await apiRequest(`/api/couple/notifications/${notif.id}/mark-read`, {
          method: "POST",
          token,
        });
      } catch (err) {
        console.error(err);
      }
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
    );
  };

  const handleClearFilters = () => {
    setRsvpChangeRequest("all");
    setGuestStatus("All status");
    setNotificationType("All types");
    setDateRange("Select date range");
    setSortBy("Newest first");
    setCurrentPage(1);
  };

  const handleDeleteNotification = async () => {
    if (!actionNotification) return;
    const token = getAccessToken();
    if (!token) return;
    try {
      await apiRequest(`/api/couple/notifications/${actionNotification.id}`, { method: "DELETE", token });
      setNotifications(prev => prev.filter(n => n.id !== actionNotification.id));
      setIsDeleteModalOpen(false);
      setActionNotification(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Apply Filters
  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];

    if (rsvpChangeRequest === "requested") {
      filtered = filtered.filter(n => n.guest?.requestForChange === true || n.type === 'change_request');
    } else if (rsvpChangeRequest === "not_requested") {
      filtered = filtered.filter(n => n.guest?.requestForChange !== true && n.type !== 'change_request');
    }

    if (guestStatus !== "All status") {
      filtered = filtered.filter(n => n.guest?.status?.toLowerCase() === guestStatus.toLowerCase());
    }

    if (notificationType !== "All types") {
      if (notificationType === "RSVP Change Request") filtered = filtered.filter(n => n.type === 'change_request');
      if (notificationType === "New RSVP") filtered = filtered.filter(n => n.type === 'rsvp_submitted');
      if (notificationType === "RSVP Declined") filtered = filtered.filter(n => n.type === 'rsvp_cancelled');
    }

    // Sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === "Newest first" ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [notifications, rsvpChangeRequest, guestStatus, notificationType, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const currentItems = filteredNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getNotificationIcon = (type) => {
    switch (type) {
      case "change_request":
        return <div className="w-10 h-10 rounded-full bg-[#fdf8eb] text-[#e69e46] flex items-center justify-center"><RefreshCw className="w-5 h-5" /></div>;
      case "rsvp_submitted":
        return <div className="w-10 h-10 rounded-full bg-[#f8f5fb] text-[#7732A4] flex items-center justify-center"><UserPlus className="w-5 h-5" /></div>;
      case "rsvp_cancelled":
      case "guest_deleted":
        return <div className="w-10 h-10 rounded-full bg-[#fdf5f5] text-[#eb5757] flex items-center justify-center"><XCircle className="w-5 h-5" /></div>;
      default:
        return <div className="w-10 h-10 rounded-full bg-[#f0f9f4] text-[#27ae60] flex items-center justify-center"><CheckCircle2 className="w-5 h-5" /></div>;
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case "change_request":
        return <span className="px-3 py-1 bg-[#fdf8eb] text-[#e69e46] text-xs font-bold rounded-full">RSVP Change Request</span>;
      case "rsvp_submitted":
        return <span className="px-3 py-1 bg-[#f8f5fb] text-[#7732A4] text-xs font-bold rounded-full">New RSVP</span>;
      case "rsvp_cancelled":
        return <span className="px-3 py-1 bg-[#fdf5f5] text-[#eb5757] text-xs font-bold rounded-full">RSVP Declined</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">Update</span>;
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "confirmed") {
      return <span className="px-3 py-1 bg-[#f0f9f4] text-[#27ae60] text-xs font-bold rounded-full">Confirmed</span>;
    }
    if (s === "declined") {
      return <span className="px-3 py-1 bg-[#fdf5f5] text-[#eb5757] text-xs font-bold rounded-full">Declined</span>;
    }
    return <span className="px-3 py-1 bg-[#fdf8eb] text-[#e69e46] text-xs font-bold rounded-full">Pending Review</span>;
  };

  function timeAgo(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  }

  function formatDateTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
  }

  return (
    <div className="flex-1 bg-[#fdfcf9] min-h-screen p-6 md:p-8 w-full">
      
      {/* Header */}
      <div className="md:hidden mb-6">
        <h1 className="font-serif font-bold text-3xl text-navy mb-1">Notifications</h1>
        <p className="text-muted text-[15px]">Stay updated with RSVP changes, guest responses, and important activity.</p>
      </div>

      <div className="hidden md:flex justify-between items-center mb-8 bg-white p-5 rounded-2xl border border-border card-shadow">
        <div>
          <h1 className="font-serif font-bold text-2xl text-navy mb-1">Notifications</h1>
          <p className="text-muted text-sm">Stay updated with RSVP changes, guest responses, and important activity.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-4 py-2 border border-[#d6c7e6] text-[#7732A4] rounded-xl text-sm font-medium hover:bg-[#f8f5fb] transition-colors bg-white shadow-sm"
          >
            <Check className="w-4 h-4" />
            Mark all as read
          </button>
          <NotificationBell />
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-[20px] p-6 mb-6 shadow-sm border border-[#eef0f3]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-navy font-bold">
            <Filter className="w-5 h-5 text-[#7732A4]" />
            Filters
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleClearFilters} className="text-sm text-muted hover:text-navy font-medium">Clear all</button>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-4 w-full">
          
          {/* RSVP change request */}
          <div className="flex flex-col gap-2 xl:w-[320px] shrink-0">
            <label className="text-[13px] font-medium text-muted flex items-center gap-1">
              RSVP change request <Info className="w-3.5 h-3.5" />
            </label>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setRsvpChangeRequest(rsvpChangeRequest === "requested" ? "all" : "requested")}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors flex-1
                ${rsvpChangeRequest === "requested" ? "bg-[#f8f5fb] border-[#7732A4] text-[#7732A4]" : "bg-white border-[#eef0f3] text-navy hover:bg-gray-50"}`}
              >
                {rsvpChangeRequest === "requested" ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-muted" />}
                Requested
              </button>
              <button 
                onClick={() => setRsvpChangeRequest(rsvpChangeRequest === "not_requested" ? "all" : "not_requested")}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors flex-1
                ${rsvpChangeRequest === "not_requested" ? "bg-[#f8f5fb] border-[#7732A4] text-[#7732A4]" : "bg-white border-[#eef0f3] text-navy hover:bg-gray-50"}`}
              >
                {rsvpChangeRequest === "not_requested" ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-muted" />}
                Not requested
              </button>
            </div>
          </div>

          {/* The 4 Select Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
            {/* Guest Status */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-medium text-muted flex items-center gap-1">
                Guest status <Info className="w-3.5 h-3.5" />
              </label>
              <div className="relative">
                <select 
                  value={guestStatus}
                  onChange={(e) => setGuestStatus(e.target.value)}
                  className="w-full appearance-none bg-white border border-[#eef0f3] rounded-lg px-4 py-2.5 text-sm font-medium text-navy focus:outline-none focus:border-[#7732A4]"
                >
                  <option>All status</option>
                  <option>Confirmed</option>
                  <option>Pending</option>
                  <option>Declined</option>
                </select>
                <ChevronDown className="w-4 h-4 text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Notification Type */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-medium text-muted flex items-center gap-1">
                Notification type <Info className="w-3.5 h-3.5" />
              </label>
              <div className="relative">
                <select 
                  value={notificationType}
                  onChange={(e) => setNotificationType(e.target.value)}
                  className="w-full appearance-none bg-white border border-[#eef0f3] rounded-lg px-4 py-2.5 text-sm font-medium text-navy focus:outline-none focus:border-[#7732A4]"
                >
                  <option>All types</option>
                  <option>RSVP Change Request</option>
                  <option>New RSVP</option>
                  <option>RSVP Declined</option>
                </select>
                <ChevronDown className="w-4 h-4 text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Date Range */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-medium text-muted flex items-center gap-1">
                Date range <span className="text-[10px]">⇅</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select 
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full appearance-none bg-white border border-[#eef0f3] rounded-lg pl-9 pr-10 py-2.5 text-sm font-medium text-muted focus:outline-none focus:border-[#7732A4]"
                >
                  <option>Select date range</option>
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                </select>
                <ChevronDown className="w-4 h-4 text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Sort By */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-medium text-muted flex items-center gap-1">
                Sort by <span className="text-[10px]">↑↓</span>
              </label>
              <div className="relative">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full appearance-none bg-white border border-[#eef0f3] rounded-lg px-4 py-2.5 text-sm font-medium text-navy focus:outline-none focus:border-[#7732A4]"
                >
                  <option>Newest first</option>
                  <option>Oldest first</option>
                </select>
                <ChevronDown className="w-4 h-4 text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

        </div>
      </div>


      {/* Table */}
      <div className="bg-white rounded-[20px] shadow-sm border border-[#eef0f3] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#eef0f3]">
                <th className="px-6 py-4 text-[11px] font-bold text-muted uppercase tracking-wider">Notification</th>
                <th className="px-6 py-4 text-[11px] font-bold text-muted uppercase tracking-wider">Guest</th>
                <th className="px-6 py-4 text-[11px] font-bold text-muted uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-[11px] font-bold text-muted uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-muted uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 text-[11px] font-bold text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((notif) => (
                <tr key={notif.id} className="border-b border-[#eef0f3] last:border-0 hover:bg-[#fdfcf9] transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-start gap-4">
                      {getNotificationIcon(notif.type)}
                      <div>
                        <p className="text-[15px] font-bold text-navy leading-tight">{notif.title}</p>
                        <p className="text-[13px] text-muted mt-1 leading-snug max-w-[250px]">{notif.message}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-top">
                    {notif.guest ? (
                      <>
                        <p className="text-[15px] font-bold text-navy">{notif.guest.name}</p>
                        <p className="text-[13px] text-muted mt-1">{notif.guest.phone || "-"}</p>
                      </>
                    ) : (
                      <p className="text-[13px] text-muted">N/A</p>
                    )}
                  </td>
                  <td className="px-6 py-5 align-top">
                    {getTypeBadge(notif.type)}
                  </td>
                  <td className="px-6 py-5 align-top">
                    {getStatusBadge(notif.guest?.status)}
                  </td>
                  <td className="px-6 py-5 align-top">
                    <p className="text-[13px] text-muted mb-1">{timeAgo(notif.createdAt)}</p>
                    <p className="text-[13px] text-muted">{formatDateTime(notif.createdAt)}</p>
                  </td>
                  <td className="px-6 py-5 align-top">
                    <RowActionsMenu
                      id={notif.id}
                      openId={openMenuId}
                      setOpenId={setOpenMenuId}
                      label="Notification actions"
                      items={[
                        {
                          label: "View details",
                          icon: Info,
                          onClick: () => {
                            setActionNotification(notif);
                            setIsViewModalOpen(true);
                          }
                        },
                        {
                          label: "Mark as read",
                          icon: CheckCheck,
                          onClick: () => handleMarkOneRead(notif),
                        },
                        {
                          label: "Delete notification",
                          icon: Trash2,
                          destructive: true,
                          onClick: () => {
                            setActionNotification(notif);
                            setIsDeleteModalOpen(true);
                          }
                        }
                      ]}
                    />
                  </td>
                </tr>
              ))}
              
              {currentItems.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-muted">
                    No notifications found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredNotifications.length > 0 && (
          <div className="px-6 py-5 flex items-center justify-between border-t border-[#eef0f3]">
            <p className="text-[13px] text-muted font-medium">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredNotifications.length)} of {filteredNotifications.length} notifications
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded border border-[#eef0f3] flex items-center justify-center text-muted hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {Array.from({ length: totalPages }).map((_, i) => (
                <button 
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded text-[13px] font-bold flex items-center justify-center transition-colors
                  ${currentPage === i + 1 ? "bg-[#7732A4] text-white" : "border border-[#eef0f3] text-muted hover:bg-gray-50"}`}
                >
                  {i + 1}
                </button>
              ))}

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded border border-[#eef0f3] flex items-center justify-center text-muted hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ViewNotificationModal
        open={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setActionNotification(null);
        }}
        notification={actionNotification}
      />

      <ConfirmDeleteModal
        open={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setActionNotification(null);
        }}
        onConfirm={handleDeleteNotification}
        title="Delete Notification"
        itemName={actionNotification?.title || "this notification"}
        description="This will permanently delete this notification. This action cannot be undone."
      />
    </div>
  );
}
