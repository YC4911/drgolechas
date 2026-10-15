"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Profile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
};

type AccountAddress = {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

type AccountOrder = {
  id: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  items: { name: string; quantity: number }[];
};

type AccountDashboardProps = {
  initialProfile: Profile;
  addresses: AccountAddress[];
  orders: AccountOrder[];
};

type ApiPayload = { data?: unknown; error?: string };

const fieldClass = "flex flex-col gap-1.5 text-xs font-medium text-ink";
const sectionClass = "scroll-mt-8 border-b border-line py-8 sm:py-10";

async function submitJson(
  url: string,
  method: string,
  data?: Record<string, unknown>,
): Promise<ApiPayload> {
  const response = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : undefined,
    body: data ? JSON.stringify(data) : undefined,
  });
  const payload: unknown = await response.json();
  const result = payload as ApiPayload;
  if (!response.ok)
    throw new Error(result.error ?? "The request could not be completed.");
  return result;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

export function AccountDashboard({
  initialProfile,
  addresses,
  orders,
}: AccountDashboardProps) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setError("");
    setNotice("");
    const fields = new FormData(form);
    const email = String(fields.get("email") ?? "").trim();
    const password = String(fields.get("currentPassword") ?? "");
    const data: Record<string, unknown> = {
      name: fields.get("name"),
      phone: fields.get("phone"),
    };
    if (email !== profile.email) {
      data.email = email;
      data.currentPassword = password;
    }

    try {
      const response = await submitJson("/api/account/profile", "PATCH", data);
      if (response.data && typeof response.data === "object") {
        setProfile(response.data as Profile);
      }
      setNotice("Your profile has been updated.");
      form.reset();
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Profile update failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleAddAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setError("");
    setNotice("");
    const fields = new FormData(form);
    const data: Record<string, unknown> = Object.fromEntries(fields.entries());
    data.isDefault = fields.get("isDefault") === "on";
    data.country = "India";

    try {
      await submitJson("/api/account/addresses", "POST", data);
      setNotice("Your address has been added.");
      form.reset();
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Address could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleEditAddress(
    event: FormEvent<HTMLFormElement>,
    addressId: string,
  ) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setError("");
    setNotice("");
    const fields = new FormData(form);
    const data: Record<string, unknown> = Object.fromEntries(fields.entries());
    data.isDefault = fields.get("isDefault") === "on";

    try {
      await submitJson(
        `/api/account/addresses/${encodeURIComponent(addressId)}`,
        "PATCH",
        data,
      );
      setNotice("Your address has been updated.");
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Address could not be updated.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteAddress(addressId: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await submitJson(
        `/api/account/addresses/${encodeURIComponent(addressId)}`,
        "DELETE",
      );
      setNotice("Your address has been deleted.");
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Address could not be deleted.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handlePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setError("");
    setNotice("");
    const fields = new FormData(form);
    const data = Object.fromEntries(fields.entries());

    try {
      await submitJson("/api/account/password", "POST", data);
      setNotice(
        "Your password has been changed. Other sessions have been signed out.",
      );
      form.reset();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Password could not be changed.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setBusy(true);
    setError("");
    try {
      await submitJson("/api/auth/logout", "POST");
      router.replace("/login");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sign out failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1320px] px-5 py-8 sm:px-8 sm:py-12 lg:px-12">
      <div className="border-line flex flex-wrap items-end justify-between gap-4 border-b pb-6">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-[var(--color-herbal-gold)] uppercase">
            Your account
          </p>
          <h1 className="font-display text-teal mt-2 text-4xl">
            Hello, {profile.name}
          </h1>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={handleLogout}
          disabled={busy}
        >
          Sign out
        </Button>
      </div>

      <nav
        aria-label="Account sections"
        className="border-line flex flex-wrap gap-x-6 gap-y-2 border-b py-4 text-sm"
      >
        {[
          ["Profile", "profile"],
          ["Orders", "orders"],
          ["Addresses", "addresses"],
          ["Settings", "settings"],
        ].map(([label, id]) => (
          <Link
            key={id}
            href={`#${id}`}
            className="text-teal font-medium hover:underline"
          >
            {label}
          </Link>
        ))}
      </nav>

      {error ? (
        <p
          role="alert"
          className="mt-5 border border-[#a54535]/30 bg-[#fff7f4] p-3 text-sm text-[#8a3428]"
        >
          {error}
        </p>
      ) : null}
      {notice ? (
        <p
          role="status"
          className="border-line bg-cream text-teal mt-5 border p-3 text-sm"
        >
          {notice}
        </p>
      ) : null}

      <section id="profile" className={sectionClass}>
        <h2 className="font-display text-teal text-2xl">Profile</h2>
        <p className="text-muted mt-2 text-sm">
          Update your contact details. Confirm your password to change email.
        </p>
        <form
          onSubmit={handleProfile}
          className="mt-5 grid gap-4 sm:grid-cols-2"
        >
          <label className={fieldClass}>
            Name
            <Input
              name="name"
              defaultValue={profile.name}
              autoComplete="name"
              required
              maxLength={120}
            />
          </label>
          <label className={fieldClass}>
            Phone
            <Input
              name="phone"
              defaultValue={profile.phone}
              type="tel"
              autoComplete="tel"
              required
            />
          </label>
          <label className={fieldClass}>
            Email
            <Input
              name="email"
              defaultValue={profile.email}
              type="email"
              autoComplete="email"
              required
            />
          </label>
          <label className={fieldClass}>
            Current password{" "}
            <span className="text-muted font-normal">
              Required only to change email
            </span>
            <Input
              name="currentPassword"
              type="password"
              autoComplete="current-password"
            />
          </label>
          <Button
            type="submit"
            className="sm:col-span-2 sm:w-fit"
            disabled={busy}
          >
            Save profile
          </Button>
        </form>
      </section>

      <section id="orders" className={sectionClass}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-teal text-2xl">Orders</h2>
          <Link
            href="/account/orders"
            className="text-teal text-sm font-semibold hover:underline"
          >
            View all orders
          </Link>
        </div>
        {orders.length > 0 ? (
          <div className="divide-line border-line mt-5 divide-y border-y">
            {orders.map((order) => (
              <article
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div>
                  <h3 className="text-ink font-medium">{order.orderNumber}</h3>
                  <p className="text-muted mt-1 text-xs">
                    {order.createdAt
                      ? new Date(order.createdAt).toISOString().slice(0, 10)
                      : "Date unavailable"}{" "}
                    · {order.items.length} item(s)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-teal font-semibold">
                    {formatPrice(order.total)}
                  </p>
                  <p className="text-muted mt-1 text-xs capitalize">
                    {order.orderStatus.replaceAll("_", " ")}
                  </p>
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="text-teal mt-2 inline-block text-xs font-semibold hover:underline"
                  >
                    Order details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-muted mt-4 text-sm">
            Your orders will appear here.
          </p>
        )}
      </section>

      <section id="addresses" className={sectionClass}>
        <h2 className="font-display text-teal text-2xl">Addresses</h2>
        {addresses.length > 0 ? (
          <div className="divide-line border-line mt-5 divide-y border-y">
            {addresses.map((address) => (
              <details key={address.id} className="py-4">
                <summary className="text-ink flex cursor-pointer flex-wrap items-center justify-between gap-3 font-medium">
                  <span>
                    {address.label}
                    {address.isDefault ? " · Default" : ""}
                  </span>
                  <span className="text-teal text-sm">Edit</span>
                </summary>
                <form
                  onSubmit={(event) => handleEditAddress(event, address.id)}
                  className="mt-4 grid gap-3 sm:grid-cols-2"
                >
                  <label className={fieldClass}>
                    Label
                    <Input name="label" defaultValue={address.label} required />
                  </label>
                  <label className={fieldClass}>
                    Name
                    <Input
                      name="recipientName"
                      defaultValue={address.recipientName}
                      required
                    />
                  </label>
                  <label className={fieldClass}>
                    Phone
                    <Input
                      name="phone"
                      defaultValue={address.phone}
                      type="tel"
                      required
                    />
                  </label>
                  <label className={fieldClass}>
                    Address
                    <Input name="line1" defaultValue={address.line1} required />
                  </label>
                  <label className={fieldClass}>
                    Address line 2
                    <Input name="line2" defaultValue={address.line2 ?? ""} />
                  </label>
                  <label className={fieldClass}>
                    Landmark
                    <Input
                      name="landmark"
                      defaultValue={address.landmark ?? ""}
                    />
                  </label>
                  <label className={fieldClass}>
                    City
                    <Input name="city" defaultValue={address.city} required />
                  </label>
                  <label className={fieldClass}>
                    State
                    <Input name="state" defaultValue={address.state} required />
                  </label>
                  <label className={fieldClass}>
                    PIN code
                    <Input
                      name="postalCode"
                      defaultValue={address.postalCode}
                      inputMode="numeric"
                      pattern="[1-9][0-9]{5}"
                      required
                    />
                  </label>
                  <label className="text-ink flex items-center gap-2 text-sm">
                    <input
                      name="isDefault"
                      type="checkbox"
                      defaultChecked={address.isDefault}
                      className="accent-teal"
                    />
                    Set as default address
                  </label>
                  <div className="flex flex-wrap gap-3 sm:col-span-2">
                    <Button type="submit" variant="secondary" disabled={busy}>
                      Save address
                    </Button>
                    <Button
                      type="button"
                      variant="quiet"
                      disabled={busy}
                      onClick={() => void handleDeleteAddress(address.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </form>
              </details>
            ))}
          </div>
        ) : (
          <p className="text-muted mt-4 text-sm">
            Add a delivery address for future orders.
          </p>
        )}

        <details className="border-line mt-5 border-b pb-4">
          <summary className="text-teal cursor-pointer text-sm font-semibold">
            Add an address
          </summary>
          <form
            onSubmit={handleAddAddress}
            className="mt-4 grid gap-3 sm:grid-cols-2"
          >
            <label className={fieldClass}>
              Label
              <Input name="label" defaultValue="Home" required />
            </label>
            <label className={fieldClass}>
              Name
              <Input name="recipientName" autoComplete="name" required />
            </label>
            <label className={fieldClass}>
              Phone
              <Input name="phone" type="tel" autoComplete="tel" required />
            </label>
            <label className={fieldClass}>
              Address
              <Input name="line1" autoComplete="address-line1" required />
            </label>
            <label className={fieldClass}>
              Address line 2<Input name="line2" autoComplete="address-line2" />
            </label>
            <label className={fieldClass}>
              Landmark
              <Input name="landmark" />
            </label>
            <label className={fieldClass}>
              City
              <Input name="city" autoComplete="address-level2" required />
            </label>
            <label className={fieldClass}>
              State
              <Input name="state" autoComplete="address-level1" required />
            </label>
            <label className={fieldClass}>
              PIN code
              <Input
                name="postalCode"
                inputMode="numeric"
                autoComplete="postal-code"
                pattern="[1-9][0-9]{5}"
                required
              />
            </label>
            <label className="text-ink flex items-center gap-2 text-sm">
              <input name="isDefault" type="checkbox" className="accent-teal" />
              Set as default address
            </label>
            <Button
              type="submit"
              className="sm:col-span-2 sm:w-fit"
              disabled={busy}
            >
              Add address
            </Button>
          </form>
        </details>
      </section>

      <section id="settings" className="scroll-mt-8 py-8 sm:py-10">
        <h2 className="font-display text-teal text-2xl">Settings</h2>
        <p className="text-muted mt-2 text-sm">Change your account password.</p>
        <form onSubmit={handlePassword} className="mt-5 grid gap-4 sm:max-w-xl">
          <label className={fieldClass}>
            Current password
            <Input
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <label className={fieldClass}>
            New password
            <Input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              required
            />
          </label>
          <label className={fieldClass}>
            Confirm new password
            <Input
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={12}
              required
            />
          </label>
          <Button
            type="submit"
            variant="secondary"
            className="sm:w-fit"
            disabled={busy}
          >
            Change password
          </Button>
        </form>
      </section>
    </div>
  );
}
