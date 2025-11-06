// src/app/modules/category/category.helpers.ts


import { Request } from "express";

// ===== Types for list query =====
export type SortKey = "name" | "sortOrder" | "-name" | "-sortOrder";

export interface ICategoryListQuery {
  parentId?: string | null;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sort?: SortKey;
}

// ===== Parse helpers =====
export const parseBoolean = (v: unknown): boolean | undefined => {
  if (v === undefined || v === null || v === "") return undefined;
  const s = String(v).toLowerCase();
  if (s === "true" || s === "1" || s === "yes") return true;
  if (s === "false" || s === "0" || s === "no") return false;
  return undefined;
};

export const parseNumber = (v: unknown): number | undefined => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

export const parseSort = (v: unknown): SortKey | undefined => {
  if (typeof v !== "string") return undefined;
  const allowed: ReadonlyArray<SortKey> = [
    "name",
    "sortOrder",
    "-name",
    "-sortOrder",
  ];
  return (allowed as readonly string[]).includes(v) ? (v as SortKey) : undefined;
};

// Build query object from req.query (type-safe)
export const buildListQuery = (qs: Request["query"]): ICategoryListQuery => {
  const { parentId, q, isActive, page, limit, sort } = qs ?? {};
  return {
    parentId: (parentId as string) ?? undefined,
    search: (q as string) ?? undefined,
    isActive: parseBoolean(isActive),
    page: parseNumber(page),
    limit: parseNumber(limit),
    sort: parseSort(sort),
  };
};
