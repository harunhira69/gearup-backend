import httpStatus from "http-status";
import { PaymentStatus, RentalStatus } from "../../../generated/prisma/enums";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe";
import { createError } from "../../utils/createError";
import { CreatePaymentPayload } from "./payments.interface";

const createCheckOutSession = async (
  payload: CreatePaymentPayload,
  customerId: string
) => {
  const rentalOrder = await prisma.rentalOrder.findFirst({
    where: {
      id: payload.rentalOrderId,
      customerId,
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          stripeCustomerId: true,
        },
      },
      payment: true,
      items: {
        include: {
          gearItem: true,
        },
      },
    },
  });

  if (!rentalOrder) {
    throw createError("Rental order not found", httpStatus.NOT_FOUND, {
      field: "rentalOrderId",
      value: payload.rentalOrderId,
    });
  }

  if (rentalOrder.status === RentalStatus.PAID) {
    throw createError("This rental order is already paid", httpStatus.CONFLICT);
  }

  if (rentalOrder.status === RentalStatus.CANCELLED) {
    throw createError(
      "Payment cannot be created for a cancelled rental order",
      httpStatus.BAD_REQUEST,
      {
        currentStatus: rentalOrder.status,
      }
    );
  }

  if (rentalOrder.status !== RentalStatus.CONFIRMED) {
    throw createError(
      "Rental order must be confirmed before payment",
      httpStatus.BAD_REQUEST,
      {
        currentStatus: rentalOrder.status,
        requiredStatus: RentalStatus.CONFIRMED,
      }
    );
  }

  if (rentalOrder.payment?.status === PaymentStatus.PAID) {
    throw createError("This rental order is already paid", httpStatus.CONFLICT);
  }

  let stripeCustomerId = rentalOrder.customer.stripeCustomerId;

  if (!stripeCustomerId) {
    const stripeCustomer = await stripe.customers.create({
      email: rentalOrder.customer.email,
      name: rentalOrder.customer.name,
      metadata: {
        customerId: rentalOrder.customer.id,
        customerName: rentalOrder.customer.name,
        customerEmail: rentalOrder.customer.email,
      },
    });

    stripeCustomerId = stripeCustomer.id;
  }

  const currency = config.stripe_currency || "usd";
  const amountInSmallestUnit = Math.round(rentalOrder.totalAmount * 100);

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: stripeCustomerId,

    success_url: `${config.app_url}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.app_url}/payment-cancelled`,

    line_items: [
      {
        price_data: {
          currency,
          unit_amount: amountInSmallestUnit,
          product_data: {
            name: "GearUp Rental Payment",
            description: `Rental order ID: ${rentalOrder.id}`,
          },
        },
        quantity: 1,
      },
    ],

    metadata: {
      customerId,
      rentalOrderId: rentalOrder.id,
    },

    payment_intent_data: {
      metadata: {
        customerId,
        rentalOrderId: rentalOrder.id,
      },
    },
  });

  return {
    sessionId: checkoutSession.id,
    checkoutUrl: checkoutSession.url,
    amount: rentalOrder.totalAmount,
    currency,
  };
};

export const paymentService = {
  createCheckOutSession,
};