import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { reservationsTable, surpriseBagsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import {
  CreatePaymentIntentBody,
  ConfirmPaymentBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/payment/create-intent", async (req, res) => {
  try {
    const body = CreatePaymentIntentBody.parse(req.body);

    const [reservation] = await db
      .select({
        id: reservationsTable.id,
        totalPrice: reservationsTable.totalPrice,
        paymentStatus: reservationsTable.paymentStatus,
        bagId: reservationsTable.bagId,
      })
      .from(reservationsTable)
      .where(eq(reservationsTable.id, body.reservationId));

    if (!reservation) {
      res.status(404).json({ error: "not_found", message: "Reservation not found" });
      return;
    }

    const amountInYen = Math.round(reservation.totalPrice);

    const stripeKey = process.env["STRIPE_SECRET_KEY"];

    if (stripeKey) {
      try {
        const stripe = await import("stripe").then((m) => new m.default(stripeKey));
        const intent = await stripe.paymentIntents.create({
          amount: amountInYen,
          currency: "jpy",
          metadata: {
            reservationId: String(reservation.id),
          },
        });

        await db
          .update(reservationsTable)
          .set({ paymentIntentId: intent.id })
          .where(eq(reservationsTable.id, reservation.id));

        res.json({
          clientSecret: intent.client_secret,
          paymentIntentId: intent.id,
          amount: amountInYen,
          currency: "jpy",
        });
        return;
      } catch (stripeErr) {
        console.error("Stripe error:", stripeErr);
      }
    }

    const mockIntentId = `pi_mock_${Date.now()}`;
    await db
      .update(reservationsTable)
      .set({ paymentIntentId: mockIntentId })
      .where(eq(reservationsTable.id, reservation.id));

    res.json({
      clientSecret: `${mockIntentId}_secret_mock`,
      paymentIntentId: mockIntentId,
      amount: amountInYen,
      currency: "jpy",
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "bad_request", message: "Failed to create payment intent" });
  }
});

router.post("/payment/confirm", async (req, res) => {
  try {
    const body = ConfirmPaymentBody.parse(req.body);

    const [reservation] = await db
      .select()
      .from(reservationsTable)
      .where(eq(reservationsTable.id, body.reservationId));

    if (!reservation) {
      res.status(404).json({ error: "not_found", message: "Reservation not found" });
      return;
    }

    await db
      .update(reservationsTable)
      .set({
        paymentStatus: "paid",
        status: "confirmed",
        paymentIntentId: body.paymentIntentId,
      })
      .where(eq(reservationsTable.id, body.reservationId));

    const [updated] = await db
      .select({
        id: reservationsTable.id,
        userId: reservationsTable.userId,
        bagId: reservationsTable.bagId,
        storeId: reservationsTable.storeId,
        quantity: reservationsTable.quantity,
        totalPrice: reservationsTable.totalPrice,
        status: reservationsTable.status,
        paymentIntentId: reservationsTable.paymentIntentId,
        paymentStatus: reservationsTable.paymentStatus,
        pickupCode: reservationsTable.pickupCode,
        createdAt: reservationsTable.createdAt,
      })
      .from(reservationsTable)
      .where(eq(reservationsTable.id, body.reservationId));

    res.json({
      ...updated,
      bag: null,
      store: null,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "bad_request", message: "Failed to confirm payment" });
  }
});

// ─── Stripe Checkout Session ───────────────────────────────────────────────
router.post("/checkout/session", async (req, res) => {
  try {
    const { reservationId, successUrl, cancelUrl } = req.body as {
      reservationId: number;
      successUrl: string;
      cancelUrl: string;
    };

    if (!reservationId || !successUrl || !cancelUrl) {
      res.status(400).json({ error: "bad_request", message: "reservationId, successUrl, cancelUrl are required" });
      return;
    }

    const [reservation] = await db
      .select({
        id: reservationsTable.id,
        totalPrice: reservationsTable.totalPrice,
        paymentStatus: reservationsTable.paymentStatus,
        bagId: reservationsTable.bagId,
      })
      .from(reservationsTable)
      .where(eq(reservationsTable.id, reservationId));

    if (!reservation) {
      res.status(404).json({ error: "not_found", message: "Reservation not found" });
      return;
    }

    if (reservation.paymentStatus === "paid") {
      res.status(409).json({ error: "already_paid", message: "This reservation is already paid" });
      return;
    }

    const stripeKey = process.env["STRIPE_SECRET_KEY"];
    if (!stripeKey) {
      res.status(503).json({ error: "stripe_not_configured", message: "Stripe is not configured" });
      return;
    }

    const stripe = await import("stripe").then((m) => new m.default(stripeKey));

    const amountInYen = Math.round(reservation.totalPrice);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product_data: {
              name: "食べロス レスキュー商品",
              description: "食品ロスを減らすサプライズバッグ",
              images: ["https://images.unsplash.com/photo-1542838132-92c53300491e?w=400"],
            },
            unit_amount: amountInYen,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        metadata: {
          reservationId: String(reservation.id),
          platformFeeAmount: String(Math.floor(amountInYen * 0.2)),
          platformFeeRate: "20",
        },
      },
      success_url: successUrl.includes("{CHECKOUT_SESSION_ID}")
        ? successUrl
        : `${successUrl}${successUrl.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        reservationId: String(reservation.id),
      },
      locale: "ja",
    });

    await db
      .update(reservationsTable)
      .set({ paymentIntentId: session.id })
      .where(eq(reservationsTable.id, reservation.id));

    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error("Stripe Checkout error:", err);
    res.status(500).json({ error: "stripe_error", message: "Failed to create checkout session" });
  }
});

// ─── Stripe Checkout Verify (after redirect) ────────────────────────────────
router.get("/checkout/verify", async (req, res) => {
  try {
    const { session_id, reservation_id } = req.query as { session_id?: string; reservation_id?: string };

    if (!session_id || !reservation_id) {
      res.status(400).json({ error: "bad_request", message: "session_id and reservation_id required" });
      return;
    }

    const reservationId = parseInt(reservation_id);
    const stripeKey = process.env["STRIPE_SECRET_KEY"];

    if (stripeKey) {
      const stripe = await import("stripe").then((m) => new m.default(stripeKey));
      const session = await stripe.checkout.sessions.retrieve(session_id);

      if (session.payment_status === "paid") {
        await db
          .update(reservationsTable)
          .set({ paymentStatus: "paid", status: "confirmed", paymentIntentId: session.payment_intent as string })
          .where(eq(reservationsTable.id, reservationId));

        res.json({ status: "paid", reservationId });
        return;
      }

      res.json({ status: session.payment_status, reservationId });
      return;
    }

    // Stripe未設定のフォールバック
    await db
      .update(reservationsTable)
      .set({ paymentStatus: "paid", status: "confirmed" })
      .where(eq(reservationsTable.id, reservationId));

    res.json({ status: "paid", reservationId });
  } catch (err) {
    console.error("Verify error:", err);
    res.status(500).json({ error: "verify_error", message: "Failed to verify session" });
  }
});

export default router;
