import { after } from "next/server";
import { OrderModel } from "@/models/order";
import { UserModel } from "@/models/user";
import {
  accountOrderUrl,
  isEmailDeliveryConfigured,
  sendTemplatedEmail,
} from "@/services/email";
import type { EmailTemplate } from "@/services/email/types";

type OrderEmailTemplate = Extract<
  EmailTemplate,
  | "orderConfirmation"
  | "paymentConfirmation"
  | "orderShipped"
  | "orderDelivered"
  | "cancellation"
  | "refund"
>;

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);

export function scheduleOrderEmail(
  orderId: string,
  template: OrderEmailTemplate,
): void {
  if (!isEmailDeliveryConfigured()) return;
  after(async () => {
    try {
      const order = await OrderModel.findById(orderId)
        .select(
          "orderNumber total shippingAddress trackingNumber paymentStatus user",
        )
        .lean()
        .exec();
      if (!order) throw new Error("Order email references a missing order.");
      const user = await UserModel.findOne({
        _id: order.user,
        role: "customer",
        active: true,
      })
        .select("name email")
        .lean()
        .exec();
      if (!user) throw new Error("Order email references a missing customer.");

      const orderUrl = accountOrderUrl(orderId);
      const name = order.shippingAddress.name || user.name;
      if (
        template === "orderConfirmation" ||
        template === "paymentConfirmation"
      ) {
        await sendTemplatedEmail(template, user.email, {
          name,
          orderNumber: order.orderNumber,
          total: formatPrice(order.total),
          orderUrl,
        });
      } else if (template === "orderShipped") {
        await sendTemplatedEmail(template, user.email, {
          name,
          orderNumber: order.orderNumber,
          trackingNumber: order.trackingNumber ?? "",
          orderUrl,
        });
      } else if (template === "refund") {
        await sendTemplatedEmail(template, user.email, {
          name,
          orderNumber: order.orderNumber,
          amount: formatPrice(order.total),
          orderUrl,
        });
      } else {
        await sendTemplatedEmail(template, user.email, {
          name,
          orderNumber: order.orderNumber,
          orderUrl,
        });
      }
    } catch (error) {
      console.error(`Order ${template} email delivery failed.`, error);
    }
  });
}
