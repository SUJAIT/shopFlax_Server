/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/modules/category/category.tree.ts
import { Model, Types } from "mongoose";
import { ICategory } from "./category.interface";

/** slug normalize (title -> kebab-case) */
export function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type CategoryModelType = Model<ICategory>;

/**
 * parentId থেকে level / ancestors / path বের করে doc-এ বসায়
 * slug আগে থেকেই থাকা চাই (pre('save') এ নিশ্চিত করা হবে)
 */
export async function computeTreeFields(
  doc: ICategory,
  Category: CategoryModelType
) {
  const ancestors: Types.ObjectId[] = [];
  let level = 0;
  let path = `/${doc.slug}`;

  if (doc.parentId) {
    const parent = await Category
      .findById(doc.parentId)
      .select("_id path level ancestors slug")
      .lean();

    if (parent) {
      level = (parent as any).level + 1;
      ancestors.push(...(parent as any).ancestors, (parent as any)._id);
      path = `${(parent as any).path}/${doc.slug}`;
    }
  }

  doc.level = level;
  doc.ancestors = ancestors;
  // ডাবল স্ল্যাশ ক্লিনআপ
  doc.path = path.replace(/\/+/g, "/");
}
