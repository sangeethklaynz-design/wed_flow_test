const { sequelize } = require("../models");
const {
  mapPaymentStatus,
  createConnectedAccount,
  createAccountOnboardingLink,
  retrieveAccount,
} = require("../services/stripePayments");

async function loadEventOwner(eventId) {
  const [rows] = await sequelize.query(
    `
    SELECT
      e.id AS event_id,
      e.name AS event_name,
      e.user_id,
      u.email AS owner_email,
      u.stripe_account_id,
      u.stripe_charges_enabled,
      u.stripe_details_submitted
    FROM events e
    LEFT JOIN users u ON u.id = e.user_id
    WHERE e.id = ?
    LIMIT 1;
    `,
    { replacements: [eventId] }
  );
  return rows[0] || null;
}

async function loadUserPaymentRow(userId) {
  const [rows] = await sequelize.query(
    `
    SELECT id, email, stripe_account_id, stripe_charges_enabled, stripe_details_submitted
    FROM users
    WHERE id = ?
    LIMIT 1;
    `,
    { replacements: [userId] }
  );
  return rows[0] || null;
}

async function syncUserFromStripeAccount(userId, account) {
  await sequelize.query(
    `
    UPDATE users
    SET stripe_account_id = ?,
        stripe_charges_enabled = ?,
        stripe_details_submitted = ?
    WHERE id = ?;
    `,
    {
      replacements: [
        account.id,
        account.charges_enabled ? 1 : 0,
        account.details_submitted ? 1 : 0,
        userId,
      ],
    }
  );
}

function stripeConfigError(err, res) {
  if (
    err?.code === "STRIPE_NOT_CONFIGURED" ||
    err?.code === "APP_PUBLIC_URL_MISSING"
  ) {
    return res.status(503).json({
      error: "Service Unavailable",
      message: err.message,
    });
  }
  return null;
}

async function getEventPayments(req, res) {
  try {
    const eventId = String(req.params.id || "").trim();
    if (!eventId) {
      return res.status(400).json({ error: "Bad Request", message: "id is required" });
    }

    const row = await loadEventOwner(eventId);
    if (!row) {
      return res.status(404).json({ error: "Not Found", message: "Event not found" });
    }
    if (!row.user_id) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Event has no owner account to connect payments",
      });
    }

    if (row.stripe_account_id) {
      try {
        const account = await retrieveAccount(row.stripe_account_id);
        await syncUserFromStripeAccount(row.user_id, account);
        const refreshed = await loadUserPaymentRow(row.user_id);
        return res.status(200).json({
          eventId,
          payments: mapPaymentStatus(refreshed),
        });
      } catch (err) {
        if (stripeConfigError(err, res)) return;
        // Fall through to DB status if Stripe retrieve fails transiently
        console.error("getEventPayments retrieveAccount:", err.message);
      }
    }

    return res.status(200).json({
      eventId,
      payments: mapPaymentStatus(row),
    });
  } catch (err) {
    console.error("getEventPayments error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to load payment status",
    });
  }
}

async function connectEventPayments(req, res) {
  try {
    const eventId = String(req.params.id || "").trim();
    if (!eventId) {
      return res.status(400).json({ error: "Bad Request", message: "id is required" });
    }

    const row = await loadEventOwner(eventId);
    if (!row) {
      return res.status(404).json({ error: "Not Found", message: "Event not found" });
    }
    if (!row.user_id) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Event has no owner account to connect payments",
      });
    }

    let stripeAccountId = row.stripe_account_id;
    if (!stripeAccountId) {
      const account = await createConnectedAccount({ email: row.owner_email });
      stripeAccountId = account.id;
      await syncUserFromStripeAccount(row.user_id, account);
    }

    const link = await createAccountOnboardingLink(stripeAccountId, { eventId });
    const refreshed = await loadUserPaymentRow(row.user_id);

    return res.status(200).json({
      eventId,
      onboardingUrl: link.url,
      payments: mapPaymentStatus(refreshed),
    });
  } catch (err) {
    if (stripeConfigError(err, res)) return;
    console.error("connectEventPayments error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: err.message || "Failed to start payment connect",
    });
  }
}

async function refreshEventPaymentsConnect(req, res) {
  try {
    const eventId = String(req.params.id || "").trim();
    if (!eventId) {
      return res.status(400).json({ error: "Bad Request", message: "id is required" });
    }

    const row = await loadEventOwner(eventId);
    if (!row) {
      return res.status(404).json({ error: "Not Found", message: "Event not found" });
    }
    if (!row.stripe_account_id) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Payment account not started; call connect first",
      });
    }

    const link = await createAccountOnboardingLink(row.stripe_account_id, {
      eventId,
    });
    return res.status(200).json({
      eventId,
      onboardingUrl: link.url,
      payments: mapPaymentStatus(row),
    });
  } catch (err) {
    if (stripeConfigError(err, res)) return;
    console.error("refreshEventPaymentsConnect error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: err.message || "Failed to refresh payment connect",
    });
  }
}

async function getCouplePayments(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized", message: "Not authenticated" });
    }

    const row = await loadUserPaymentRow(userId);
    if (!row) {
      return res.status(404).json({ error: "Not Found", message: "User not found" });
    }

    if (row.stripe_account_id) {
      try {
        const account = await retrieveAccount(row.stripe_account_id);
        await syncUserFromStripeAccount(userId, account);
        const refreshed = await loadUserPaymentRow(userId);
        return res.status(200).json({ payments: mapPaymentStatus(refreshed) });
      } catch (err) {
        if (stripeConfigError(err, res)) return;
        console.error("getCouplePayments retrieveAccount:", err.message);
      }
    }

    return res.status(200).json({ payments: mapPaymentStatus(row) });
  } catch (err) {
    console.error("getCouplePayments error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to load payment status",
    });
  }
}

async function connectCouplePayments(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized", message: "Not authenticated" });
    }

    const row = await loadUserPaymentRow(userId);
    if (!row) {
      return res.status(404).json({ error: "Not Found", message: "User not found" });
    }

    let stripeAccountId = row.stripe_account_id;
    if (!stripeAccountId) {
      const account = await createConnectedAccount({ email: row.email });
      stripeAccountId = account.id;
      await syncUserFromStripeAccount(userId, account);
    }

    const link = await createAccountOnboardingLink(stripeAccountId);
    const refreshed = await loadUserPaymentRow(userId);

    return res.status(200).json({
      onboardingUrl: link.url,
      payments: mapPaymentStatus(refreshed),
    });
  } catch (err) {
    if (stripeConfigError(err, res)) return;
    console.error("connectCouplePayments error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: err.message || "Failed to start payment connect",
    });
  }
}

async function refreshCouplePaymentsConnect(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized", message: "Not authenticated" });
    }

    const row = await loadUserPaymentRow(userId);
    if (!row) {
      return res.status(404).json({ error: "Not Found", message: "User not found" });
    }
    if (!row.stripe_account_id) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Payment account not started; call connect first",
      });
    }

    const link = await createAccountOnboardingLink(row.stripe_account_id);
    return res.status(200).json({
      onboardingUrl: link.url,
      payments: mapPaymentStatus(row),
    });
  } catch (err) {
    if (stripeConfigError(err, res)) return;
    console.error("refreshCouplePaymentsConnect error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: err.message || "Failed to refresh payment connect",
    });
  }
}

module.exports = {
  getEventPayments,
  connectEventPayments,
  refreshEventPaymentsConnect,
  getCouplePayments,
  connectCouplePayments,
  refreshCouplePaymentsConnect,
};
