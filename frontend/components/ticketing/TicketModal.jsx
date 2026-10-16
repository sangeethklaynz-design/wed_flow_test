"use client";

import { useEffect, useState } from "react";
import ModalCloseButton from "@/components/ui/ModalCloseButton";

export default function TicketModal({
  open,
  onClose,
  onSubmit,
  initialTicket = null,
  mode = "add",
  saving = false,
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(initialTicket?.name ?? "");
    setPrice(
      initialTicket?.price !== undefined && initialTicket?.price !== null
        ? String(initialTicket.price)
        : ""
    );
    setDescription(initialTicket?.description ?? "");
    setQuantity(
      initialTicket?.quantity !== undefined && initialTicket?.quantity !== null
        ? String(initialTicket.quantity)
        : ""
    );
    setError("");

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, initialTicket]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Ticket name is required");
      return;
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setError("Please enter a valid price (greater than or equal to 0)");
      return;
    }

    const payload = {
      id: initialTicket?.id,
      name: trimmedName,
      price: numPrice,
      description: description.trim(),
      quantity: quantity ? parseInt(quantity, 10) : null,
    };

    try {
      setError("");
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err?.message || "Failed to save ticket type");
    }
  };

  const isEdit = mode === "edit";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity w-full h-full cursor-default"
        onClick={onClose}
        aria-label="Close modal backdrop"
      />

      <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 sm:p-8 card-shadow border border-border z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-serif font-bold text-2xl text-[#054380]">
            {isEdit ? "Edit Ticket Type" : "Add Ticket Type"}
          </h2>
          <ModalCloseButton onClick={onClose} />
        </div>

        {error ? (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-navy mb-1.5">
              Ticket Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Standard, VIP, Premium"
              className="w-full px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[#0B72E7] transition-all text-sm text-navy placeholder:text-muted/60"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-1.5">
              Price (LKR) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="any"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g., 2000"
              className="w-full px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[#0B72E7] transition-all text-sm text-navy placeholder:text-muted/60"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., General Admission, Access to VIP Lounge"
              className="w-full px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[#0B72E7] transition-all text-sm text-navy placeholder:text-muted/60 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-1.5">
              Available Quantity / Capacity
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Leave blank for unlimited"
              className="w-full px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[#0B72E7] transition-all text-sm text-navy placeholder:text-muted/60"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-2.5 px-4 rounded-xl border border-border text-navy font-medium text-sm hover:bg-cream transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#0B72E7] hover:bg-[#0961C5] text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center"
            >
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Ticket Type"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
