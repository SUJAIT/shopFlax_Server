// src/app/modules/category/category.interface.ts
/* eslint-disable no-unused-vars */

// Keep it consistent with your existing pattern (mongoose + DTOs + Model statics)
import { Document, Model, Types } from "mongoose";

/**
 * Category document (n-level ready; use 2-level now).
 * Materialized-path strategy to keep queries simple & fast.
 */
export interface ICategory extends Document {
  _id: Types.ObjectId;

  // Core
  name: string;                // UI label (unique per parent)
  slug: string;                // URL-safe key (unique per parent)
  parentId: Types.ObjectId | null; // null => root
  level: number;               // 0=root, 1=sub, ... (derived)

  // Tree helpers
  path: string;                // materialized path, e.g. "/electronics/toasters"
  ancestors: Types.ObjectId[]; // [rootId, ..., parentId] (for breadcrumb/queries)

  // Display & status
  sortOrder: number;           // ordering among siblings (hybrid: auto + manual)
  isActive: boolean;           // hide/show without delete

  // Optional visuals / SEO
  icon?: string;               // icon key or URL
  image?: string;              // banner/thumbnail URL
  metaTitle?: string;
  metaDescription?: string;

  // Audit
  createdBy?: Types.ObjectId | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/** Create payload (admin) */
export type CreateCategoryDTO = {
  name: string;
  parentId?: string | null;    // pass as string; model will cast to ObjectId
  icon?: string;
  image?: string;
  sortOrder?: number;          // optional; if missing -> auto assign (max+10)
  isActive?: boolean;
  metaTitle?: string;
  metaDescription?: string;
};

/** Update payload (admin) — partial allowed */
export type UpdateCategoryDTO = Partial<{
  name: string;
  parentId: string | null;     // moving node to new parent
  icon: string;
  image: string;
  sortOrder: number;           // manual reordering
  isActive: boolean;
  metaTitle: string;
  metaDescription: string;
}>;

/**
 * Model statics (implement in category.model.ts)
 * Keep signatures simple and focused on your workflow.
 */
export interface CategoryModel extends Model<ICategory> {
  /** Case-insensitive unique check among siblings (same parentId) */
  isNameTaken(
    name: string,
    parentId: Types.ObjectId | null,
    excludeId?: Types.ObjectId
  ): Promise<boolean>;

  /** Hybrid ordering: find next sortOrder = (max among siblings) + 10 */
  getNextSortOrder(parentId: Types.ObjectId | null): Promise<number>;

  /** Fast child existence check for safe delete rules */
  hasChildren(id: Types.ObjectId): Promise<boolean>;

  /** Helper to fetch children list with proper sorting */
  listChildren(
    parentId: Types.ObjectId | null,
    onlyActive?: boolean
  ): Promise<ICategory[]>;
}
