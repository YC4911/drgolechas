import { Types } from "mongoose";
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
import { updateAddressSchema } from "@/lib/auth/validation";

type RouteContext = { params: Promise<{ id: string }> };

function invalidIdResponse() {
  return invalidInputResponse([
    { path: ["id"], message: "Provide a valid address ID." },
  ]);
}

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const auth = await requireCustomer();
  if (!auth.customer) return auth.response;
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return invalidIdResponse();

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = updateAddressSchema.safeParse(body.body);
  if (!parsed.success) return invalidInputResponse(parsed.error.issues);

  try {
    const address = await AddressModel.findOne({
      _id: id,
      user: auth.customer.id,
    }).exec();
    if (!address) {
      return NextResponse.json(
        { error: "Address not found." },
        { status: 404 },
      );
    }

    if (parsed.data.isDefault === true) {
      await AddressModel.updateMany(
        { user: auth.customer.id, _id: { $ne: address._id } },
        { $set: { isDefault: false } },
      ).exec();
    }

    Object.assign(address, parsed.data);
    await address.save();
    return NextResponse.json({ data: address.toObject() });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const auth = await requireCustomer();
  if (!auth.customer) return auth.response;
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return invalidIdResponse();

  try {
    const address = await AddressModel.findOne({
      _id: id,
      user: auth.customer.id,
    }).exec();
    if (!address) {
      return NextResponse.json(
        { error: "Address not found." },
        { status: 404 },
      );
    }

    const wasDefault = address.isDefault;
    await address.deleteOne();
    await UserModel.updateOne(
      { _id: auth.customer.id },
      { $pull: { addresses: address._id } },
    ).exec();

    if (wasDefault) {
      const nextDefault = await AddressModel.findOne({ user: auth.customer.id })
        .sort({ createdAt: 1 })
        .exec();
      if (nextDefault) {
        nextDefault.isDefault = true;
        await nextDefault.save();
      }
    }

    return NextResponse.json({ data: { id, deleted: true } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
