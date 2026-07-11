import httpStatus from "http-status";
import Stripe from "stripe";
import {
  PaymentProvider,
  PaymentStatus,
  RentalStatus,
} from "../../../generated/prisma/enums";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe";
import { createError } from "../../utils/createError";
import {
  ConfirmPaymentPayload,
  CreatePaymentPayload,
} from "./payments.interface";

const getStripeAmount = (amount: number) => {
  return Math.round(amount * 100);
};

const createCheckOutSession = async (
  payload: CreatePaymentPayload,
  customerId: string
) => {
  if (!payload?.rentalOrderId) {
    throw createError("Rental order ID is required", httpStatus.BAD_REQUEST, {
      field: "rentalOrderId",
      message: "Rental order ID is required",
    });
  }

  const rentalOrder = await prisma.$transaction(async (tx) => {
    const order = await tx.rentalOrder.findFirst({
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

    if (!order) {
      throw createError("Rental order not found", httpStatus.NOT_FOUND, {
        field: "rentalOrderId",
        value: payload.rentalOrderId,
      });
    }

    if (order.status === RentalStatus.PAID) {
      throw createError("This rental order is already paid", httpStatus.CONFLICT);
    }

    if (order.status === RentalStatus.CANCELLED) {
      throw createError(
        "Payment cannot be created for a cancelled rental order",
        httpStatus.BAD_REQUEST,
        {
          currentStatus: order.status,
        }
      );
    }

    if (order.status !== RentalStatus.CONFIRMED) {
      throw createError(
        "Rental order must be confirmed before payment",
        httpStatus.BAD_REQUEST,
        {
          currentStatus: order.status,
          requiredStatus: RentalStatus.CONFIRMED,
        }
      );
    }

    if (order.payment?.status === PaymentStatus.PAID) {
      throw createError("This rental order is already paid", httpStatus.CONFLICT);
    }

    return order;
  });

  if (rentalOrder.payment?.stripeCheckoutSessionId) {
    const existingSession = await stripe.checkout.sessions.retrieve(
      rentalOrder.payment.stripeCheckoutSessionId
    );

    if (existingSession.status === "open" && existingSession.url) {
      return {
        payment: rentalOrder.payment,
        sessionId: existingSession.id,
        checkoutUrl: existingSession.url,
        amount: rentalOrder.totalAmount,
        currency: rentalOrder.payment.currency,
      };
    }
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
  const amountInSmallestUnit = getStripeAmount(rentalOrder.totalAmount);

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

  const payment = await prisma.$transaction(async (tx) => {
    if (!rentalOrder.customer.stripeCustomerId) {
      await tx.user.update({
        where: {
          id: customerId,
        },
        data: {
          stripeCustomerId,
        },
      });
    }

    const existingPayment = await tx.payment.findUnique({
      where: {
        rentalOrderId: rentalOrder.id,
      },
    });

    if (existingPayment) {
      const updatedPayment = await tx.payment.update({
        where: {
          id: existingPayment.id,
        },
        data: {
          amount: rentalOrder.totalAmount,
          currency,
          provider: PaymentProvider.STRIPE,
          status: PaymentStatus.PENDING,
          stripeCheckoutSessionId: checkoutSession.id,
        },
        include: {
          rentalOrder: {
            include: {
              items: {
                include: {
                  gearItem: true,
                },
              },
            },
          },
        },
      });

      return updatedPayment;
    }

    const createdPayment = await tx.payment.create({
      data: {
        rentalOrderId: rentalOrder.id,
        customerId,
        amount: rentalOrder.totalAmount,
        currency,
        provider: PaymentProvider.STRIPE,
        status: PaymentStatus.PENDING,
        stripeCheckoutSessionId: checkoutSession.id,
      },
      include: {
        rentalOrder: {
          include: {
            items: {
              include: {
                gearItem: true,
              },
            },
          },
        },
      },
    });

    return createdPayment;
  });

  return {
    payment,
    sessionId: checkoutSession.id,
    checkoutUrl: checkoutSession.url,
    amount: rentalOrder.totalAmount,
    currency,
  };
};

const markCheckoutSessionPaidIntoDB = async (
  checkoutSession: Stripe.Checkout.Session
) => {
  const sessionId = checkoutSession.id;

  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: {
        stripeCheckoutSessionId: sessionId,
      },
      include: {
        rentalOrder: true,
      },
    });

    if (!payment) {
      throw createError(
        "Payment not found for this checkout session",
        httpStatus.NOT_FOUND,
        {
          sessionId,
        }
      );
    }

    if (payment.status === PaymentStatus.PAID) {
      const paidPayment = await tx.payment.findUniqueOrThrow({
        where: {
          id: payment.id,
        },
        include: {
          rentalOrder: {
            include: {
              items: {
                include: {
                  gearItem: true,
                },
              },
            },
          },
        },
      });

      return paidPayment;
    }

    if (checkoutSession.payment_status !== "paid") {
      return payment;
    }

    const stripePaymentIntentId =
      typeof checkoutSession.payment_intent === "string"
        ? checkoutSession.payment_intent
        : checkoutSession.payment_intent?.id || null;

    const updatedPayment = await tx.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: PaymentStatus.PAID,
        stripePaymentIntentId,
        transactionId: stripePaymentIntentId,
        paidAt: new Date(),
      },
      include: {
        rentalOrder: {
          include: {
            items: {
              include: {
                gearItem: true,
              },
            },
          },
        },
      },
    });

    await tx.rentalOrder.update({
      where: {
        id: payment.rentalOrderId,
      },
      data: {
        status: RentalStatus.PAID,
      },
    });

    return updatedPayment;
  });

  return result;
};

const markCheckoutSessionExpiredIntoDB = async (
  checkoutSession: Stripe.Checkout.Session
) => {
  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: {
        stripeCheckoutSessionId: checkoutSession.id,
      },
    });

    if (!payment) {
      return null;
    }

    if (payment.status === PaymentStatus.PAID) {
      return payment;
    }

    const updatedPayment = await tx.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: PaymentStatus.FAILED,
      },
    });

    return updatedPayment;
  });

  return result;
};

const confirmPaymentIntoDB = async (
  payload: ConfirmPaymentPayload,
  customerId: string
) => {
  const payment = await prisma.$transaction(async (tx) => {
    const result = await tx.payment.findFirst({
      where: {
        customerId,
        ...(payload.paymentId && { id: payload.paymentId }),
        ...(payload.sessionId && {
          stripeCheckoutSessionId: payload.sessionId,
        }),
      },
      include: {
        rentalOrder: true,
      },
    });

    if (!result) {
      throw createError("Payment not found", httpStatus.NOT_FOUND, {
        paymentId: payload.paymentId,
        sessionId: payload.sessionId,
      });
    }

    if (!result.stripeCheckoutSessionId) {
      throw createError(
        "Stripe checkout session not found for this payment",
        httpStatus.BAD_REQUEST,
        {
          paymentId: result.id,
        }
      );
    }

    if (result.status === PaymentStatus.PAID) {
      return result;
    }

    return result;
  });

  if (payment.status === PaymentStatus.PAID) {
    return payment;
  }

  const checkoutSession = await stripe.checkout.sessions.retrieve(
    payment.stripeCheckoutSessionId as string,
    {
      expand: ["payment_intent"],
    }
  );

  if (
    checkoutSession.status === "complete" &&
    checkoutSession.payment_status === "paid"
  ) {
    return markCheckoutSessionPaidIntoDB(checkoutSession);
  }

  return payment;
};

const getMyPaymentsFromDB = async (customerId: string) => {
  const payments = await prisma.$transaction(async (tx) => {
    const result = await tx.payment.findMany({
      where: {
        customerId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        rentalOrder: {
          include: {
            items: {
              include: {
                gearItem: true,
              },
            },
          },
        },
      },
    });

    return result;
  });

  return payments;
};

const getSinglePaymentFromDB = async (
  paymentId: string,
  customerId: string
) => {
  const payment = await prisma.$transaction(async (tx) => {
    const result = await tx.payment.findFirst({
      where: {
        id: paymentId,
        customerId,
      },
      include: {
        rentalOrder: {
          include: {
            items: {
              include: {
                gearItem: true,
              },
            },
          },
        },
      },
    });

    if (!result) {
      throw createError("Payment not found", httpStatus.NOT_FOUND, {
        field: "id",
        value: paymentId,
      });
    }

    return result;
  });

  return payment;
};

export const paymentService = {
  createCheckOutSession,
  confirmPaymentIntoDB,
  getMyPaymentsFromDB,
  getSinglePaymentFromDB,
  markCheckoutSessionPaidIntoDB,
  markCheckoutSessionExpiredIntoDB,
};