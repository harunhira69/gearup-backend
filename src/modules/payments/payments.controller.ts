import { Request, Response } from "express";
import httpStatus from "http-status";
import Stripe from "stripe";
import config from "../../config";
import { stripe } from "../../lib/stripe";
import { catchAsync } from "../../utils/catchAsync";
import { createError } from "../../utils/createError";
import { sendResponse } from "../../utils/sendResonse";
import { paymentService } from "./payments.service";

const createCheckOutSession = catchAsync(async (req: Request, res: Response) => {
  const customerId = req.user?.id;

  if (!customerId) {
    throw createError("Customer information not found", httpStatus.UNAUTHORIZED);
  }

  const result = await paymentService.createCheckOutSession(
    req.body,
    customerId
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Checkout session created successfully",
    data: result,
  });
});

const confirmPayment = catchAsync(async (req: Request, res: Response) => {
  const customerId = req.user?.id;

  if (!customerId) {
    throw createError("Customer information not found", httpStatus.UNAUTHORIZED);
  }

  const result = await paymentService.confirmPaymentIntoDB(req.body, customerId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payment confirmation checked successfully",
    data: result,
  });
});

const getMyPayments = catchAsync(async (req: Request, res: Response) => {
  const customerId = req.user?.id;

  if (!customerId) {
    throw createError("Customer information not found", httpStatus.UNAUTHORIZED);
  }

  const result = await paymentService.getMyPaymentsFromDB(customerId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payments retrieved successfully",
    data: result,
  });
});

const getSinglePayment = catchAsync(async (req: Request, res: Response) => {
  const customerId = req.user?.id;
  const paymentId = req.params.id;

  if (!customerId) {
    throw createError("Customer information not found", httpStatus.UNAUTHORIZED);
  }

  const result = await paymentService.getSinglePaymentFromDB(
    paymentId as string,
    customerId
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payment details retrieved successfully",
    data: result,
  });
});

const handleStripeWebhook = async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"];

  if (!signature) {
    return res.status(400).send("Missing Stripe signature");
  }

  if (!config.stripe_webhook_secret) {
    return res.status(500).send("Stripe webhook secret is missing");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      config.stripe_webhook_secret
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown webhook error";

    return res.status(400).send(`Webhook Error: ${message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;

        await paymentService.markCheckoutSessionPaidIntoDB(checkoutSession);
        break;
      }

      case "checkout.session.async_payment_succeeded": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;

        await paymentService.markCheckoutSessionPaidIntoDB(checkoutSession);
        break;
      }

      case "checkout.session.expired": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;

        await paymentService.markCheckoutSessionExpiredIntoDB(checkoutSession);
        break;
      }

      case "checkout.session.async_payment_failed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;

        await paymentService.markCheckoutSessionExpiredIntoDB(checkoutSession);
        break;
      }

      default:
        break;
    }

    return res.status(200).json({
      received: true,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook processing failed";

    return res.status(500).json({
      received: false,
      message,
    });
  }
};

export const paymentController = {
  createCheckOutSession,
  confirmPayment,
  getMyPayments,
  getSinglePayment,
  handleStripeWebhook,
};