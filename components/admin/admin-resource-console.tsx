"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Plus, Search, Upload, X } from "lucide-react";
import type { AdminResource } from "@/lib/admin/validation";

type FieldType =
  "text" | "number" | "checkbox" | "textarea" | "date" | "json" | "select";
type Field = {
  name: string;
  label: string;
  type?: FieldType;
  placeholder?: string;
  help?: string;
  options?: { label: string; value: string }[];
};
type ApiRecord = Record<string, unknown> & { _id?: string; id?: string };

const definitions: Record<
  AdminResource,
  { title: string; description: string; fields: Field[]; creatable: boolean }
> = {
  products: {
    title: "Products",
    description:
      "Manage product details, inventory, variants, discoverability and SEO.",
    creatable: true,
    fields: [
      { name: "name", label: "Product name" },
      { name: "sku", label: "SKU" },
      {
        name: "slug",
        label: "URL slug",
        help: "Leave blank to generate from the product name.",
      },
      { name: "category", label: "Category ID" },
      { name: "subcategory", label: "Subcategory ID (optional)" },
      {
        name: "shortDescription",
        label: "Short description",
        type: "textarea",
      },
      { name: "description", label: "Description", type: "textarea" },
      { name: "price", label: "Price (INR)", type: "number" },
      { name: "mrp", label: "MRP (INR)", type: "number" },
      { name: "gst", label: "GST (%)", type: "number" },
      { name: "stock", label: "Stock", type: "number" },
      {
        name: "lowStockThreshold",
        label: "Low-stock threshold",
        type: "number",
      },
      { name: "thumbnail", label: "Primary image URL" },
      {
        name: "images",
        label: "Images (JSON array)",
        type: "json",
        help: 'Example: [{"url":"/api/uploads/file.jpg","alt":"Product"}]',
      },
      {
        name: "ingredients",
        label: "Ingredients (one per line)",
        type: "textarea",
      },
      { name: "benefits", label: "Benefits (one per line)", type: "textarea" },
      { name: "howToUse", label: "How to use", type: "textarea" },
      {
        name: "storageInstructions",
        label: "Storage instructions",
        type: "textarea",
      },
      {
        name: "safetyInformation",
        label: "Safety information",
        type: "textarea",
      },
      {
        name: "regulatoryClassification",
        label: "Regulatory classification",
      },
      {
        name: "productDetailsVerified",
        label: "Product details verified",
        type: "checkbox",
      },
      {
        name: "priceApproved",
        label: "Product price approved",
        type: "checkbox",
      },
      {
        name: "publicationStatus",
        label: "Publication status",
        type: "select",
        options: [
          { label: "Draft", value: "draft" },
          {
            label: "Pending product verification",
            value: "pending_product_verification",
          },
          {
            label: "Pending pricing approval",
            value: "pending_pricing_approval",
          },
          {
            label: "Pending regulatory review",
            value: "pending_regulatory_review",
          },
          { label: "Ready to publish", value: "ready_to_publish" },
          { label: "Published", value: "published" },
        ],
      },
      {
        name: "specifications",
        label: "Specifications (JSON object)",
        type: "json",
      },
      { name: "tags", label: "Tags (one per line)", type: "textarea" },
      {
        name: "productType",
        label: "Product format/type",
        help: "For example: balm, powder, kit, liquid.",
      },
      { name: "useCases", label: "Use cases (one per line)", type: "textarea" },
      {
        name: "preferences",
        label: "Preferences (one per line)",
        type: "textarea",
        help: "Only factual attributes that have been verified for the product.",
      },
      {
        name: "variants",
        label: "Variants (JSON array)",
        type: "json",
        help: "Each variant requires name, SKU, price, MRP, stock, packQuantity, packUnit and priceApproved. Approval is required before publishing.",
      },
      { name: "featured", label: "Featured product", type: "checkbox" },
      { name: "newArrival", label: "New arrival", type: "checkbox" },
      { name: "active", label: "Visible in store", type: "checkbox" },
      { name: "seoTitle", label: "SEO title" },
      { name: "seoDescription", label: "SEO description", type: "textarea" },
      {
        name: "seoKeywords",
        label: "SEO keywords (one per line)",
        type: "textarea",
      },
    ],
  },
  categories: {
    title: "Categories",
    description:
      "Create nested categories, adjust their order, imagery and search appearance.",
    creatable: true,
    fields: [
      { name: "name", label: "Name" },
      { name: "slug", label: "URL slug" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "image", label: "Image URL" },
      {
        name: "parentCategory",
        label: "Parent category ID (blank for top level)",
      },
      { name: "displayOrder", label: "Display order", type: "number" },
      { name: "active", label: "Active", type: "checkbox" },
      { name: "seoTitle", label: "SEO title" },
      { name: "seoDescription", label: "SEO description", type: "textarea" },
    ],
  },
  orders: {
    title: "Orders",
    description:
      "Review customer, shipping and payment details; update fulfilment and tracking.",
    creatable: false,
    fields: [
      {
        name: "orderStatus",
        label: "Order status",
        type: "select",
        options: [
          "pending",
          "confirmed",
          "processing",
          "packed",
          "shipped",
          "out_for_delivery",
          "delivered",
          "cancelled",
          "returned",
          "refunded",
        ].map((value) => ({ label: value.replaceAll("_", " "), value })),
      },
      { name: "trackingNumber", label: "Tracking number" },
      { name: "notes", label: "Internal order notes", type: "textarea" },
    ],
  },
  customers: {
    title: "Customers",
    description:
      "Search customer accounts and review their order history and account status.",
    creatable: false,
    fields: [{ name: "active", label: "Account active", type: "checkbox" }],
  },
  reviews: {
    title: "Reviews",
    description:
      "Moderate customer feedback before it appears on the storefront.",
    creatable: false,
    fields: [
      { name: "approved", label: "Approved for publication", type: "checkbox" },
    ],
  },
  coupons: {
    title: "Coupons",
    description: "Set discount rules, eligibility and usage limits.",
    creatable: true,
    fields: [
      { name: "code", label: "Coupon code" },
      {
        name: "discountType",
        label: "Discount type",
        type: "select",
        options: [
          { label: "Percentage", value: "percentage" },
          { label: "Fixed amount", value: "fixed" },
        ],
      },
      { name: "discountValue", label: "Discount value", type: "number" },
      {
        name: "minimumCartValue",
        label: "Minimum cart value (INR)",
        type: "number",
      },
      {
        name: "maximumDiscount",
        label: "Maximum discount (INR)",
        type: "number",
      },
      { name: "startDate", label: "Starts at", type: "date" },
      { name: "expiryDate", label: "Expires at", type: "date" },
      { name: "usageLimit", label: "Total usage limit", type: "number" },
      {
        name: "perUserLimit",
        label: "Per-customer usage limit",
        type: "number",
      },
      {
        name: "applicableProducts",
        label: "Product IDs (JSON array)",
        type: "json",
      },
      {
        name: "applicableCategories",
        label: "Category IDs (JSON array)",
        type: "json",
      },
      { name: "active", label: "Active", type: "checkbox" },
    ],
  },
  testimonials: {
    title: "Testimonials",
    description: "Publish and order approved customer testimonials.",
    creatable: true,
    fields: [
      { name: "authorName", label: "Customer name" },
      { name: "quote", label: "Testimonial", type: "textarea" },
      { name: "attribution", label: "Attribution" },
      { name: "avatar", label: "Avatar image URL" },
      { name: "displayOrder", label: "Display order", type: "number" },
      { name: "approved", label: "Enabled on storefront", type: "checkbox" },
    ],
  },
  social: {
    title: "Social links",
    description: "Manage the store's social media and messaging links.",
    creatable: false,
    fields: [
      { name: "instagram", label: "Instagram URL" },
      { name: "facebook", label: "Facebook URL" },
      { name: "whatsapp", label: "WhatsApp URL" },
      { name: "youtube", label: "YouTube URL" },
      { name: "other", label: "Other link 1 URL" },
      { name: "other2", label: "Other link 2 URL" },
      { name: "other3", label: "Other link 3 URL" },
    ],
  },
  settings: {
    title: "Store settings",
    description:
      "Configure brand identity, customer support, GST, shipping and tax.",
    creatable: false,
    fields: [
      { name: "logo", label: "Logo image URL" },
      { name: "storeName", label: "Brand name" },
      { name: "tagline", label: "Tagline" },
      { name: "contactInformation.phone", label: "Contact phone" },
      { name: "contactInformation.email", label: "Contact email" },
      {
        name: "contactInformation.address",
        label: "Business address",
        type: "textarea",
      },
      { name: "gstInformation.gstin", label: "GSTIN" },
      { name: "gstInformation.legalName", label: "GST legal name" },
      {
        name: "shippingSettings.flatRate",
        label: "Flat shipping rate (INR)",
        type: "number",
      },
      {
        name: "shippingSettings.freeShippingThreshold",
        label: "Free shipping threshold (INR)",
        type: "number",
      },
      {
        name: "shippingSettings.estimatedDays",
        label: "Estimated delivery days",
        type: "number",
      },
      {
        name: "taxSettings.defaultGst",
        label: "Default GST (%)",
        type: "number",
      },
      {
        name: "taxSettings.pricesIncludeGst",
        label: "Prices include GST",
        type: "checkbox",
      },
    ],
  },
};

function idOf(row: ApiRecord): string {
  return String(row._id ?? row.id ?? "");
}

function getNested(source: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => {
    if (!value || typeof value !== "object") return undefined;
    return (value as Record<string, unknown>)[key];
  }, source);
}

function setNested(
  source: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  const result = structuredClone(source);
  const parts = path.split(".");
  let current = result;
  for (const part of parts.slice(0, -1)) {
    const next = current[part];
    if (!next || typeof next !== "object" || Array.isArray(next)) {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }
  current[parts.at(-1) ?? path] = value;
  return result;
}

function defaultValues(resource: AdminResource): Record<string, unknown> {
  if (resource === "products") {
    return {
      name: "",
      sku: "",
      slug: "",
      category: "",
      subcategory: null,
      shortDescription: "",
      description: "",
      price: 0,
      mrp: 0,
      gst: 0,
      stock: 0,
      lowStockThreshold: 5,
      thumbnail: "",
      images: [],
      ingredients: [],
      benefits: [],
      howToUse: "",
      storageInstructions: "",
      safetyInformation: "",
      regulatoryClassification: "",
      productDetailsVerified: false,
      priceApproved: false,
      publicationStatus: "draft",
      specifications: {},
      tags: [],
      productType: "general",
      useCases: [],
      preferences: [],
      variants: [],
      featured: false,
      newArrival: false,
      active: true,
    };
  }
  if (resource === "categories") {
    return {
      name: "",
      slug: "",
      description: "",
      image: "",
      parentCategory: null,
      displayOrder: 0,
      active: true,
    };
  }
  if (resource === "coupons") {
    return {
      code: "",
      discountType: "percentage",
      discountValue: 10,
      minimumCartValue: 0,
      startDate: new Date().toISOString().slice(0, 10),
      expiryDate: "",
      perUserLimit: 1,
      applicableProducts: [],
      applicableCategories: [],
      active: true,
    };
  }
  if (resource === "testimonials") {
    return {
      authorName: "",
      quote: "",
      attribution: "",
      avatar: "",
      displayOrder: 0,
      approved: false,
    };
  }
  if (resource === "social") return {};
  if (resource === "settings") {
    return {
      logo: "",
      storeName: "Dr. Golechas",
      tagline: "",
      contactInformation: { phone: "", email: "", address: "" },
      gstInformation: { gstin: "", legalName: "" },
      shippingSettings: {
        flatRate: 0,
        freeShippingThreshold: 0,
        estimatedDays: 0,
      },
      taxSettings: { defaultGst: 0, pricesIncludeGst: false },
    };
  }
  return {};
}

function readableStatus(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replaceAll("_", " ");
}

function displayRow(resource: AdminResource, row: ApiRecord) {
  const user = row.user as Record<string, unknown> | undefined;
  const product = row.product as Record<string, unknown> | undefined;
  if (resource === "products")
    return {
      title: String(row.name ?? "Product"),
      subtitle: `${String(row.sku ?? "")} · ${String(row.price ?? "")} INR · stock ${String(row.stock ?? 0)} · ${readableStatus(row.publicationStatus ?? "published")}`,
      status:
        row.active === false
          ? "Inactive"
          : readableStatus(row.publicationStatus ?? "published"),
    };
  if (resource === "categories")
    return {
      title: String(row.name ?? "Category"),
      subtitle: `/${String(row.slug ?? "")} · ID ${idOf(row)} · order ${String(row.displayOrder ?? 0)}`,
      status: row.active === false ? "Inactive" : "Active",
    };
  if (resource === "orders")
    return {
      title: String(row.orderNumber ?? "Order"),
      subtitle: `${String(user?.name ?? (row.shippingAddress as Record<string, unknown> | undefined)?.name ?? "Customer")} · ${String(row.total ?? "")} INR · ${readableStatus(row.paymentStatus)}`,
      status: readableStatus(row.orderStatus),
    };
  if (resource === "customers") {
    const person =
      row.customer && typeof row.customer === "object"
        ? (row.customer as Record<string, unknown>)
        : row;
    return {
      title: String(person.name ?? "Customer"),
      subtitle: `${String(person.email ?? "")} · ${String(person.phone ?? "")}`,
      status: person.active === false ? "Disabled" : "Active",
    };
  }
  if (resource === "reviews")
    return {
      title: `${String(row.title ?? "Review")} · ${String(row.rating ?? "")}/5`,
      subtitle: `${String(user?.name ?? "Customer")} · ${String(product?.name ?? "Product")} · ${String(row.comment ?? "").slice(0, 180)}`,
      status: String(
        row.moderationStatus ?? (row.approved ? "approved" : "pending"),
      ),
    };
  if (resource === "coupons")
    return {
      title: String(row.code ?? "Coupon"),
      subtitle: `${String(row.discountValue ?? "")}${row.discountType === "percentage" ? "%" : " INR"} off · used ${String(row.usageCount ?? 0)}${row.usageLimit ? ` / ${String(row.usageLimit)}` : ""}`,
      status: row.active === false ? "Inactive" : "Active",
    };
  if (resource === "testimonials")
    return {
      title: String(row.authorName ?? "Testimonial"),
      subtitle: String(row.quote ?? "").slice(0, 180),
      status: row.approved ? "Enabled" : "Disabled",
    };
  return { title: "", subtitle: "", status: "" };
}

export function AdminResourceConsole({
  resource,
  recordId,
  createMode = false,
  canWrite,
}: {
  resource: AdminResource;
  recordId?: string;
  createMode?: boolean;
  canWrite: boolean;
}) {
  const definition = definitions[resource];
  const [items, setItems] = useState<ApiRecord[]>([]);
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [editor, setEditor] = useState<ApiRecord | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>(
    defaultValues(resource),
  );

  const endpoint = `/api/admin/${resource}`;
  const load = useCallback(async () => {
    if (createMode) return;
    setLoading(true);
    setError("");
    try {
      if (resource === "settings" || resource === "social") {
        const response = await fetch(endpoint, { cache: "no-store" });
        const payload = (await response.json()) as {
          data?: Record<string, unknown>;
          error?: string;
        };
        if (!response.ok || !payload.data)
          throw new Error(payload.error ?? "Unable to load settings.");
        setSettings(payload.data);
        setValues(payload.data);
      } else if (recordId) {
        const response = await fetch(
          `${endpoint}/${encodeURIComponent(recordId)}`,
          { cache: "no-store" },
        );
        const payload = (await response.json()) as {
          data?: ApiRecord;
          error?: string;
        };
        if (!response.ok || !payload.data)
          throw new Error(payload.error ?? "Unable to load this record.");
        setSettings(payload.data);
        const record =
          payload.data.customer && typeof payload.data.customer === "object"
            ? (payload.data.customer as ApiRecord)
            : payload.data;
        setEditor(record);
        setValues({ ...defaultValues(resource), ...record });
      } else {
        const params = new URLSearchParams();
        if (search.trim()) params.set("q", search.trim());
        if (activeFilter) params.set("active", activeFilter);
        if (statusFilter) params.set("status", statusFilter);
        if (categoryFilter.trim())
          params.set("category", categoryFilter.trim());
        if (sort) params.set("sort", sort);
        params.set("page", String(page));
        const response = await fetch(`${endpoint}?${params.toString()}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          data?: unknown;
          error?: string;
        };
        if (!response.ok || payload.data === undefined)
          throw new Error(payload.error ?? "Unable to load records.");
        const result = payload.data;
        const rows = Array.isArray(result)
          ? result
          : result && typeof result === "object" && "items" in result
            ? (result as { items: ApiRecord[] }).items
            : [];
        setTotalItems(
          result && typeof result === "object" && "total" in result
            ? Number((result as { total: unknown }).total)
            : rows.length,
        );
        setItems(rows);
        setSettings(
          result && typeof result === "object"
            ? (result as Record<string, unknown>)
            : {},
        );
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to load this page.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    activeFilter,
    categoryFilter,
    createMode,
    endpoint,
    page,
    recordId,
    resource,
    search,
    sort,
    statusFilter,
  ]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  const visibleItems = useMemo(() => items, [items]);

  function beginCreate() {
    setEditor(null);
    setValues(defaultValues(resource));
    setError("");
    setNotice("");
  }

  async function editRecord(row: ApiRecord) {
    const id = idOf(row);
    if (!id) {
      setError("This row does not include a valid record ID.");
      return;
    }
    try {
      const response = await fetch(`${endpoint}/${encodeURIComponent(id)}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as {
        data?: ApiRecord;
        error?: string;
      };
      if (!response.ok || !payload.data)
        throw new Error(payload.error ?? "Unable to open this record.");
      setSettings(payload.data);
      const record =
        payload.data.customer && typeof payload.data.customer === "object"
          ? (payload.data.customer as ApiRecord)
          : payload.data;
      setEditor(record);
      setValues({ ...defaultValues(resource), ...record });
      setNotice("");
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to open this record.",
      );
    }
  }

  function changeField(
    field: Field,
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    if (field.type === "checkbox") {
      setValues((current) =>
        setNested(
          current,
          field.name,
          (event.target as HTMLInputElement).checked,
        ),
      );
    } else {
      setValues((current) =>
        setNested(current, field.name, event.target.value),
      );
    }
  }

  async function uploadImage(file: File, fieldName: string) {
    setError("");
    const formData = new FormData();
    formData.set("image", file);
    formData.set(
      "purpose",
      resource === "categories"
        ? "categories"
        : resource === "settings"
          ? "settings"
          : "products",
    );
    try {
      const response = await fetch("/api/admin/uploads", {
        method: "POST",
        headers: {
          "X-Admin-Upload-Purpose": String(formData.get("purpose")),
        },
        body: formData,
      });
      const payload = (await response.json()) as {
        data?: { url: string };
        error?: string;
      };
      if (!response.ok || !payload.data)
        throw new Error(payload.error ?? "Image upload failed.");
      setValues((current) => setNested(current, fieldName, payload.data?.url));
      setNotice("Image uploaded successfully.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Image upload failed.");
    }
  }

  function submissionValues(): Record<string, unknown> {
    if (resource === "social") {
      return Object.fromEntries(
        definition.fields
          .map((field) => [field.name, getNested(values, field.name)])
          .filter(([, value]) => typeof value === "string" && value.trim()),
      );
    }
    let submission: Record<string, unknown> = {};
    for (const field of definition.fields) {
      const value = getNested(values, field.name);
      if (value !== undefined) {
        submission = setNested(submission, field.name, structuredClone(value));
      }
    }
    for (const field of definition.fields) {
      const value = getNested(submission, field.name);
      if (field.type === "json" && typeof value === "string") {
        try {
          submission = setNested(
            submission,
            field.name,
            JSON.parse(value) as unknown,
          );
        } catch {
          throw new Error(`${field.label} must contain valid JSON.`);
        }
      }
      if (
        resource === "products" &&
        (field.name === "ingredients" ||
          field.name === "benefits" ||
          field.name === "tags" ||
          field.name === "useCases" ||
          field.name === "preferences" ||
          field.name === "seoKeywords") &&
        typeof value === "string"
      ) {
        submission = setNested(
          submission,
          field.name,
          value
            .split(/\r?\n/)
            .map((part) => part.trim())
            .filter(Boolean),
        );
      }
      if (
        resource === "categories" &&
        field.name === "parentCategory" &&
        value === ""
      ) {
        submission = setNested(submission, field.name, null);
      }
      if (
        resource === "products" &&
        field.name === "subcategory" &&
        value === ""
      ) {
        submission = setNested(submission, field.name, null);
      }
      if (
        typeof value === "string" &&
        value === "" &&
        [
          "slug",
          "seoTitle",
          "seoDescription",
          "seoKeywords",
          "maximumDiscount",
          "usageLimit",
          "attribution",
          "avatar",
        ].includes(field.name)
      ) {
        submission = setNested(submission, field.name, undefined);
      }
      if (
        field.type === "number" &&
        typeof value === "string" &&
        value !== ""
      ) {
        submission = setNested(submission, field.name, Number(value));
      }
      if (field.type === "number" && value === "") {
        submission = setNested(submission, field.name, undefined);
      }
    }
    return submission;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const data = submissionValues();
      const url =
        resource === "social" || resource === "settings"
          ? endpoint
          : editor
            ? `${endpoint}/${encodeURIComponent(idOf(editor))}`
            : endpoint;
      const method =
        resource === "social" || resource === "settings" || editor
          ? "PATCH"
          : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const payload = (await response.json()) as {
        error?: string;
        data?: ApiRecord;
      };
      if (!response.ok) throw new Error(payload.error ?? "Save failed.");
      setNotice("Changes saved.");
      if (resource === "settings" || resource === "social") {
        await load();
      } else if (recordId && payload.data) {
        setEditor(payload.data);
        setValues({ ...defaultValues(resource), ...payload.data });
      } else {
        setEditor(null);
        setValues(defaultValues(resource));
        await load();
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(id: string, data: Record<string, unknown>) {
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${endpoint}/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Update failed.");
      setNotice("Record updated.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Update failed.");
    }
  }

  async function deleteRecord(row: ApiRecord) {
    if (
      !window.confirm(
        "Delete or deactivate this record? This action cannot be undone for deleted reviews/testimonials.",
      )
    )
      return;
    setError("");
    try {
      const response = await fetch(
        `${endpoint}/${encodeURIComponent(idOf(row))}`,
        { method: "DELETE" },
      );
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Action failed.");
      setNotice("Record removed or deactivated.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Action failed.");
    }
  }

  function fieldValue(field: Field): unknown {
    const value = getNested(values, field.name);
    if (
      Array.isArray(value) &&
      [
        "ingredients",
        "benefits",
        "tags",
        "useCases",
        "preferences",
        "seoKeywords",
      ].includes(field.name)
    ) {
      return value.join("\n");
    }
    if (field.type === "json") {
      if (typeof value === "string") return value;
      return JSON.stringify(
        value ?? (field.name.endsWith("specifications") ? {} : []),
        null,
        2,
      );
    }
    if (field.type === "date" && value) {
      const date = new Date(String(value));
      return Number.isNaN(date.getTime())
        ? String(value)
        : date.toISOString().slice(0, 10);
    }
    return value ?? (field.type === "checkbox" ? false : "");
  }

  const isList =
    !recordId &&
    !createMode &&
    resource !== "settings" &&
    resource !== "social";

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.15em] text-[#8c6a2d] uppercase">
            Store management
          </p>
          <h1 className="font-display mt-2 text-3xl text-[#083847] sm:text-4xl">
            {definition.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68787a]">
            {definition.description}
          </p>
        </div>
        {isList && canWrite && definition.creatable && !editor ? (
          resource === "products" ? (
            <Link
              href="/admin/products/new"
              className="inline-flex min-h-11 items-center gap-2 rounded bg-[#083847] px-4 text-sm font-semibold text-white hover:bg-[#0c4b5b]"
            >
              <Plus size={16} /> New product
            </Link>
          ) : (
            <button
              onClick={beginCreate}
              className="inline-flex min-h-11 items-center gap-2 rounded bg-[#083847] px-4 text-sm font-semibold text-white hover:bg-[#0c4b5b]"
            >
              <Plus size={16} /> New{" "}
              {resource === "testimonials"
                ? "testimonial"
                : resource.slice(0, -1)}
            </button>
          )
        ) : null}
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-5 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </p>
      ) : null}
      {notice ? (
        <p
          role="status"
          className="mt-5 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"
        >
          {notice}
        </p>
      ) : null}

      {isList && !editor ? (
        <>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void load();
            }}
            className="mt-6 flex flex-wrap gap-3"
          >
            <label className="relative min-w-[min(100%,18rem)] flex-1">
              <Search
                size={16}
                className="absolute top-1/2 left-3 -translate-y-1/2 text-[#87938f]"
              />
              <input
                value={search}
                onChange={(event) => {
                  setPage(1);
                  setSearch(event.target.value);
                }}
                placeholder={`Search ${definition.title.toLowerCase()}`}
                className="min-h-11 w-full rounded border border-[#dfe6e3] bg-white pr-3 pl-9 text-sm outline-none focus:border-[#0d5968]"
              />
            </label>
            {[
              "products",
              "categories",
              "customers",
              "testimonials",
              "coupons",
            ].includes(resource) ? (
              <select
                aria-label="Filter by active state"
                value={activeFilter}
                onChange={(event) => {
                  setPage(1);
                  setActiveFilter(event.target.value);
                }}
                className="min-h-11 rounded border border-[#dfe6e3] bg-white px-3 text-sm"
              >
                <option value="">All states</option>
                <option value="true">
                  {resource === "reviews" || resource === "testimonials"
                    ? "Approved / enabled"
                    : "Active"}
                </option>
                <option value="false">
                  {resource === "reviews" || resource === "testimonials"
                    ? "Pending / disabled"
                    : "Inactive"}
                </option>
              </select>
            ) : null}
            {resource === "products" ? (
              <>
                <input
                  aria-label="Filter products by category ID"
                  value={categoryFilter}
                  onChange={(event) => {
                    setPage(1);
                    setCategoryFilter(event.target.value);
                  }}
                  placeholder="Category ID"
                  className="min-h-11 w-44 rounded border border-[#dfe6e3] bg-white px-3 text-sm"
                />
                <select
                  aria-label="Sort products"
                  value={sort}
                  onChange={(event) => {
                    setPage(1);
                    setSort(event.target.value);
                  }}
                  className="min-h-11 rounded border border-[#dfe6e3] bg-white px-3 text-sm"
                >
                  <option value="newest">Recently updated</option>
                  <option value="name">Name</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                  <option value="stock-asc">Lowest stock</option>
                </select>
              </>
            ) : null}
            {resource === "orders" ? (
              <select
                aria-label="Filter orders by status"
                value={statusFilter}
                onChange={(event) => {
                  setPage(1);
                  setStatusFilter(event.target.value);
                }}
                className="min-h-11 rounded border border-[#dfe6e3] bg-white px-3 text-sm capitalize"
              >
                <option value="">All order statuses</option>
                {[
                  "pending",
                  "confirmed",
                  "processing",
                  "packed",
                  "shipped",
                  "out_for_delivery",
                  "delivered",
                  "cancelled",
                  "returned",
                  "refunded",
                ].map((status) => (
                  <option key={status} value={status} className="capitalize">
                    {status.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            ) : null}
            {resource === "reviews" ? (
              <select
                aria-label="Filter reviews by moderation status"
                value={statusFilter}
                onChange={(event) => {
                  setPage(1);
                  setStatusFilter(event.target.value);
                }}
                className="min-h-11 rounded border border-[#dfe6e3] bg-white px-3 text-sm capitalize"
              >
                <option value="">All moderation states</option>
                {["pending", "approved", "rejected"].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            ) : null}
            <button
              className="grid min-h-11 min-w-12 place-items-center rounded border border-[#dfe6e3] bg-white text-[#083847]"
              aria-label="Search"
            >
              <Search size={16} />
            </button>
          </form>
          {loading ? (
            <div className="mt-6 animate-pulse space-y-3">
              <div className="h-16 rounded bg-[#e9eeeb]" />
              <div className="h-16 rounded bg-[#e9eeeb]" />
              <div className="h-16 rounded bg-[#e9eeeb]" />
            </div>
          ) : visibleItems.length ? (
            <div className="mt-5 space-y-3">
              {visibleItems.map((row) => {
                const presentation = displayRow(resource, row);
                const rowId = idOf(row);
                return (
                  <article
                    key={rowId}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#e0e6e3] bg-white p-4 shadow-[0_2px_8px_rgba(10,45,50,.03)] sm:px-5"
                  >
                    <button
                      onClick={() => void editRecord(row)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="block truncate font-semibold text-[#18343a]">
                        {presentation.title}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-[#68787a]">
                        {presentation.subtitle}
                      </span>
                    </button>
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${presentation.status.toLowerCase().includes("active") || presentation.status.toLowerCase().includes("approved") || presentation.status === "Enabled" || presentation.status === "delivered" ? "bg-emerald-50 text-emerald-800" : "bg-[#f4f0e5] text-[#765c26]"}`}
                      >
                        {presentation.status}
                      </span>
                      {canWrite && resource === "reviews" ? (
                        <>
                          {row.moderationStatus !== "approved" &&
                          !row.approved ? (
                            <button
                              onClick={() =>
                                void changeStatus(rowId, { approved: true })
                              }
                              className="text-xs font-semibold text-emerald-800 hover:underline"
                            >
                              Approve
                            </button>
                          ) : null}
                          {row.moderationStatus !== "rejected" ? (
                            <button
                              onClick={() =>
                                void changeStatus(rowId, { approved: false })
                              }
                              className="text-xs font-semibold text-[#765c26] hover:underline"
                            >
                              Reject
                            </button>
                          ) : null}
                        </>
                      ) : null}
                      {canWrite &&
                      [
                        "products",
                        "categories",
                        "coupons",
                        "testimonials",
                        "reviews",
                      ].includes(resource) ? (
                        <button
                          aria-label="Delete or deactivate"
                          onClick={() => void deleteRecord(row)}
                          className="rounded px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                        >
                          {resource === "reviews" || resource === "testimonials"
                            ? "Delete"
                            : "Deactivate"}
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-lg border border-dashed border-[#d7dfdc] bg-white p-10 text-center">
              <p className="font-medium text-[#18343a]">
                No {definition.title.toLowerCase()} found
              </p>
              <p className="mt-1 text-sm text-[#68787a]">
                {search
                  ? "Try changing your search."
                  : "New records will appear here."}
              </p>
            </div>
          )}
          {!loading && totalItems > 50 ? (
            <div className="mt-5 flex items-center justify-between gap-3 text-sm text-[#68787a]">
              <span>
                {(page - 1) * 50 + 1}–{Math.min(page * 50, totalItems)} of{" "}
                {totalItems}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                  className="min-h-10 rounded border border-[#dfe6e3] px-3 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page * 50 >= totalItems}
                  onClick={() => setPage((current) => current + 1)}
                  className="min-h-10 rounded border border-[#dfe6e3] px-3 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {editor || createMode || !isList ? (
        <form
          onSubmit={submit}
          className="mt-6 rounded-lg border border-[#e0e6e3] bg-white p-4 shadow-[0_2px_8px_rgba(10,45,50,.03)] sm:p-6"
        >
          <div className="mb-5 flex items-center justify-between gap-3 border-b border-[#e8ece9] pb-4">
            <div>
              <h2 className="font-display text-2xl text-[#083847]">
                {editor
                  ? `Edit ${definition.title.slice(0, -1)}`
                  : definition.creatable
                    ? `New ${resource === "products" ? "product" : resource === "testimonials" ? "testimonial" : resource.slice(0, -1)}`
                    : "Configuration"}
              </h2>
              {editor && resource === "orders" ? (
                <p className="mt-1 text-xs text-[#68787a]">
                  {String(editor.orderNumber ?? "")} · payment{" "}
                  {readableStatus(editor.paymentStatus)}
                </p>
              ) : null}
            </div>
            {isList ? (
              <button
                type="button"
                aria-label="Close editor"
                onClick={() => {
                  setEditor(null);
                  setNotice("");
                }}
                className="grid size-9 place-items-center rounded hover:bg-[#f1f4f2]"
              >
                <X size={17} />
              </button>
            ) : null}
          </div>

          {resource === "orders" && editor ? (
            <div className="mb-5 grid gap-3 rounded bg-[#f7f8f6] p-4 text-sm sm:grid-cols-2">
              <p>
                <span className="font-semibold">Customer:</span>{" "}
                {String(
                  (editor.user as Record<string, unknown> | undefined)?.name ??
                    "—",
                )}{" "}
                ·{" "}
                {String(
                  (editor.user as Record<string, unknown> | undefined)?.email ??
                    "",
                )}
              </p>
              <p>
                <span className="font-semibold">Total:</span> ₹
                {String(editor.total ?? 0)} ·{" "}
                <span className="font-semibold">Payment:</span>{" "}
                {readableStatus(editor.paymentStatus)}
              </p>
              <p className="sm:col-span-2">
                <span className="font-semibold">Ship to:</span>{" "}
                {JSON.stringify(editor.shippingAddress ?? {})}
              </p>
              <p className="sm:col-span-2">
                <span className="font-semibold">Products:</span>{" "}
                {JSON.stringify(editor.items ?? [])}
              </p>
            </div>
          ) : null}

          {resource === "customers" && editor ? (
            <div className="mb-5 grid gap-2 rounded bg-[#f7f8f6] p-4 text-sm">
              <p>
                <strong>{String(editor.name ?? "")}</strong> ·{" "}
                {String(editor.email ?? "")} · {String(editor.phone ?? "")}
              </p>
              <p>
                Created{" "}
                {editor.createdAt
                  ? new Date(String(editor.createdAt)).toLocaleDateString(
                      "en-IN",
                    )
                  : "—"}
              </p>
            </div>
          ) : null}

          {resource === "reviews" && editor ? (
            <div className="mb-5 rounded bg-[#f7f8f6] p-4 text-sm leading-6">
              <p className="font-semibold">
                {String(editor.title ?? "")} · {String(editor.rating ?? "")}/5
              </p>
              <p className="mt-2">{String(editor.comment ?? "")}</p>
              <p className="mt-2 text-xs text-[#68787a]">
                {String(
                  (editor.user as Record<string, unknown> | undefined)?.name ??
                    "",
                )}{" "}
                ·{" "}
                {String(
                  (editor.product as Record<string, unknown> | undefined)
                    ?.name ?? "",
                )}
              </p>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            {definition.fields.map((field) => {
              const value = fieldValue(field);
              return (
                <label
                  key={field.name}
                  className={`block text-xs font-semibold text-[#18343a] ${field.type === "textarea" || field.type === "json" ? "sm:col-span-2" : ""}`}
                >
                  {field.type === "checkbox" ? (
                    <span className="flex min-h-11 items-center gap-3 rounded border border-[#e3e8e5] px-3 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(value)}
                        disabled={!canWrite}
                        onChange={(event) => changeField(field, event)}
                        className="size-4 accent-[#083847]"
                      />
                      {field.label}
                    </span>
                  ) : field.type === "select" ? (
                    <>
                      {field.label}
                      <select
                        value={String(value)}
                        disabled={!canWrite}
                        onChange={(event) =>
                          setValues((current) =>
                            setNested(current, field.name, event.target.value),
                          )
                        }
                        className="mt-1.5 min-h-11 w-full rounded border border-[#dfe6e3] bg-white px-3 font-normal capitalize outline-none focus:border-[#0d5968]"
                      >
                        {(field.options ?? []).map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                            className="capitalize"
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : field.type === "textarea" || field.type === "json" ? (
                    <>
                      {field.label}
                      <textarea
                        value={String(value)}
                        readOnly={!canWrite}
                        onChange={(event) => changeField(field, event)}
                        rows={field.type === "json" ? 5 : 3}
                        className="mt-1.5 w-full rounded border border-[#dfe6e3] bg-white p-3 font-normal outline-none read-only:bg-[#f7f8f6] focus:border-[#0d5968]"
                        placeholder={field.placeholder}
                      />
                    </>
                  ) : (
                    <>
                      {field.label}
                      <input
                        type={field.type ?? "text"}
                        value={String(value)}
                        readOnly={!canWrite}
                        onChange={(event) => changeField(field, event)}
                        step={field.type === "number" ? "any" : undefined}
                        className="mt-1.5 min-h-11 w-full rounded border border-[#dfe6e3] bg-white px-3 font-normal outline-none read-only:bg-[#f7f8f6] focus:border-[#0d5968]"
                        placeholder={field.placeholder}
                      />
                    </>
                  )}
                  {field.help ? (
                    <span className="mt-1 block leading-5 font-normal text-[#68787a]">
                      {field.help}
                    </span>
                  ) : null}
                  {canWrite &&
                  ((resource === "products" && field.name === "thumbnail") ||
                    (resource === "categories" && field.name === "image") ||
                    (resource === "settings" && field.name === "logo")) ? (
                    <span className="mt-2 flex flex-wrap items-center gap-3">
                      <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded border border-[#dfe6e3] px-3 text-xs font-semibold hover:bg-[#f7f8f6]">
                        <Upload size={14} /> Upload image
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="sr-only"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) void uploadImage(file, field.name);
                            event.target.value = "";
                          }}
                        />
                      </label>
                      <span className="font-normal text-[#68787a]">
                        JPEG, PNG or WebP · max 5 MB
                      </span>
                    </span>
                  ) : null}
                </label>
              );
            })}
          </div>
          {resource === "products" ? (
            <p className="mt-4 rounded bg-[#f8f5eb] p-3 text-xs leading-5 text-[#715a26]">
              Use the uploaded image URL in the Images JSON array.
              Product/category IDs are available from their respective admin
              lists. All prices, variants and inventory are validated again by
              the server.
            </p>
          ) : null}
          {resource === "social" ? (
            <p className="mt-4 text-xs text-[#68787a]">
              Leave a link blank to remove it. Only valid http(s) URLs are
              accepted.
            </p>
          ) : null}
          {resource === "customers" && editor ? (
            <div className="mt-4 rounded border border-[#e3e8e5] p-4">
              <p className="text-sm font-semibold">Recent order history</p>
              {Array.isArray(settings.orders) ? (
                (settings.orders as ApiRecord[]).map((order) => (
                  <p key={idOf(order)} className="mt-2 text-xs">
                    {String(order.orderNumber)} ·{" "}
                    {readableStatus(order.orderStatus)} · ₹{String(order.total)}
                  </p>
                ))
              ) : (
                <p className="mt-2 text-xs text-[#68787a]">
                  No order history loaded.
                </p>
              )}
            </div>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3 border-t border-[#e8ece9] pt-5">
            {canWrite ? (
              <button
                disabled={saving}
                className="min-h-11 rounded bg-[#083847] px-5 text-sm font-semibold text-white hover:bg-[#0c4b5b] disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            ) : null}
            {resource === "products" && editor ? (
              <Link
                href={`/admin/products/${idOf(editor)}`}
                className="min-h-11 rounded border border-[#dfe6e3] px-4 py-3 text-sm font-semibold text-[#083847] hover:bg-[#f7f8f6]"
              >
                Open full editor
              </Link>
            ) : null}
          </div>
        </form>
      ) : null}
    </div>
  );
}
