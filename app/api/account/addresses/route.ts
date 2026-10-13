import { NextResponse } from "next/server";
import { AddressModel } from "@/models/address";
import { UserModel } from "@/models/user";
import {
  apiErrorResponse,
  invalidInputResponse,
  readJsonBody,
} from "@/lib/api/errors";
import { isSameOriginRequest } from "@/lib/auth/origin";
import { requireCustomer } from "@/lib/auth/route-guard";
import { addressSchema } from "@/lib/auth/validation";

export async function GET() {
  const auth = await requireCustomer();
  if (!auth.customer) return auth.response;

  try {
    const addresses = await AddressModel.find({ user: auth.customer.id })
      .sort({ isDefault: -1, createdAt: -1 })
      .select(
        "label recipientName phone line1 line2 landmark city state postalCode country isDefault createdAt",
      )
      .lean()
      .exec();
    return NextResponse.json({ data: addresses });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const auth = await requireCustomer();
  if (!auth.customer) return auth.response;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = addressSchema.safeParse(body.body);
  if (!parsed.success) return invalidInputResponse(parsed.error.issues);

  try {
    const currentCount = await AddressModel.countDocuments({
      user: auth.customer.id,
    });
    const makeDefault = parsed.data.isDefault || currentCount === 0;
    if (makeDefault) {
      await AddressModel.updateMany(
        { user: auth.customer.id },
        { $set: { isDefault: false } },
      ).exec();
    }

    const address = await AddressModel.create({
      ...parsed.data,
      user: auth.customer.id,
      isDefault: makeDefault,
    });
    await UserModel.updateOne(
      { _id: auth.customer.id },
      { $addToSet: { addresses: address._id } },
    ).exec();

    return NextResponse.json({ data: address.toObject() }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
