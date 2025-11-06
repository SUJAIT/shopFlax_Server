/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Types } from "mongoose";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/appError";
import Category, { ICategoryModel } from "./category.model";
import { ICategory } from "./category.interface";

/* ------------ DTOs (service-level) ------------ */
export type CreateCategoryDTO = {
  name: string;
  slug?: string;
  icon?: string | null;
  parentId?: string | null;     // string id from client
  sortOrder?: number | null;    // optional; auto-assigned if missing
  isActive?: boolean;           // default true
};

export type UpdateCategoryDTO = {
  name?: string;
  slug?: string;
  icon?: string | null;
  parentId?: string | null;     // move to new parent
  sortOrder?: number | null;    // manual reorder
  isActive?: boolean;
};

/* ------------ Helpers ------------ */
const toObjectId = (id?: string | null) => (id ? new Types.ObjectId(id) : null);

async function ensureParentOK(
  model: ICategoryModel,
  parentId: Types.ObjectId | null,
  selfId?: Types.ObjectId
) {
  if (!parentId) return;

  const parent = await model.findById(parentId).select("_id ancestors");
  if (!parent) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Parent category not found");
  }
  if (selfId) {
    if (parent._id.equals(selfId)) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Category cannot be its own parent");
    }
    if (parent.ancestors?.some(a => a.equals(selfId))) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Cannot move under its own subtree");
    }
  }
}

/* shift siblings sortOrder >= newOrder by +1 (simple, stable) */
async function makeRoomForSortOrder(
  model: ICategoryModel,
  parentId: Types.ObjectId | null,
  newOrder: number,
  excludeId?: Types.ObjectId,
  session?: mongoose.ClientSession
) {
  const filter: any = { parentId };
  if (excludeId) filter._id = { $ne: excludeId };

  await model.updateMany(
    { ...filter, sortOrder: { $gte: newOrder } },
    { $inc: { sortOrder: 1 } },
    { session }
  );
}

/* ------------ Services ------------ */

/** Create */
export async function createCategory(payload: CreateCategoryDTO): Promise<ICategory> {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const parentId = toObjectId(payload.parentId ?? null);

    await ensureParentOK(Category, parentId);

    // optional: if client sends sortOrder, make room
    if (payload.sortOrder != null) {
      await makeRoomForSortOrder(Category, parentId, payload.sortOrder, undefined, session);
    }

    const [created] = await Category.create(
      [
        {
          name: payload.name,
          slug: payload.slug,             // pre('save') normalize করবে
          icon: payload.icon ?? null,
          parentId,
          sortOrder: payload.sortOrder ?? null, // মিস করলে hook auto-assign
          isActive: payload.isActive ?? true,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    return created.toObject();
  } catch (e) {
    // ✅ guard: commit হয়ে গেলে abort কল হবে না
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw e;
  } finally {
    session.endSession();
  }
}

/** Update (rename/move/reorder/toggle) */
export async function updateCategory(
  id: string,
  payload: UpdateCategoryDTO
): Promise<ICategory> {
  const _id = new Types.ObjectId(id);
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const exists = await Category.findById(_id).session(session);
    if (!exists) throw new AppError(StatusCodes.NOT_FOUND, "Category not found");

    const parentId =
      payload.parentId !== undefined
        ? toObjectId(payload.parentId)
        : (exists.parentId as Types.ObjectId | null);

    await ensureParentOK(Category, parentId, _id);

    const update: Partial<ICategory> = {};
    if (payload.name !== undefined) update.name = payload.name;
    if (payload.slug !== undefined) update.slug = payload.slug!;
    if (payload.icon !== undefined) update.icon = payload.icon ?? null;
    if (payload.isActive !== undefined) update.isActive = payload.isActive;
    if (payload.parentId !== undefined) update.parentId = parentId;

    // Reorder within the (new) parent:
    if (payload.sortOrder != null) {
      await makeRoomForSortOrder(Category, parentId, payload.sortOrder, _id, session);
      update.sortOrder = payload.sortOrder;
    }

    // findOneAndUpdate ব্যবহার করলে আমাদের post('findOneAndUpdate') hook fire হবে
    const updated = await Category.findOneAndUpdate(
      { _id },
      { $set: update },
      { new: true, session }
    );

    await session.commitTransaction();
    return updated!.toObject();
  } catch (e) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw e;
  } finally {
    session.endSession();
  }
}

/** Get by id */
export async function getCategoryById(id: string): Promise<ICategory> {
  const doc = await Category.findById(id);
  if (!doc) throw new AppError(StatusCodes.NOT_FOUND, "Category not found");
  return doc.toObject();
}

/** Get by slug */
export async function getCategoryBySlug(slug: string): Promise<ICategory> {
  const doc = await Category.findOne({ slug });
  if (!doc) throw new AppError(StatusCodes.NOT_FOUND, "Category not found");
  return doc.toObject();
}

/** List / browse (flat) */
export async function listCategories(opts: {
  parentId?: string | null;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sort?: "name" | "sortOrder" | "-name" | "-sortOrder";
}) {
  const {
    parentId = null,
    search,
    isActive,
    page = 1,
    limit = 20,
    sort = "sortOrder",
  } = opts || {};

  const filter: any = {};
  filter.parentId = parentId ? new Types.ObjectId(parentId) : null;
  if (isActive !== undefined) filter.isActive = isActive;
  if (search) filter.name = { $regex: search, $options: "i" };

  const [items, total] = await Promise.all([
    Category.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    Category.countDocuments(filter),
  ]);

  return { page, limit, total, items };
}

/** Get full tree (active=true by default) */
export async function getCategoryTree(onlyActive = true) {
  const match: any = {};
  if (onlyActive) match.isActive = true;

  const docs = await Category.find(match).sort({ level: 1, sortOrder: 1 }).lean();

  // Build tree in-memory
  const byId = new Map<string, any>();
  const roots: any[] = [];

  docs.forEach((d) => {
    (d as any).children = [];
    byId.set(String(d._id), d);
  });

  docs.forEach((d) => {
    if (d.parentId) {
      const p = byId.get(String(d.parentId));
      if (p) p.children.push(d);
      else roots.push(d); // fallback
    } else {
      roots.push(d);
    }
  });

  return roots;
}

/** Soft delete (default). Hard delete optional with guard */
export async function deleteCategory(id: string, hard = false) {
  const _id = new Types.ObjectId(id);

  if (!hard) {
    const doc = await Category.findByIdAndUpdate(
      _id,
      { $set: { isActive: false } },
      { new: true }
    ).lean();
    if (!doc) throw new AppError(StatusCodes.NOT_FOUND, "Category not found");
    return { deleted: true, hard: false, doc };
  }

  // ensure no children on hard delete
  const child = await Category.findOne({ parentId: _id }).select("_id").lean();
  if (child) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Cannot hard-delete: category has children"
    );
  }

  const res = await Category.deleteOne({ _id });
  return { deleted: res.deletedCount === 1, hard: true };
}

/** Move category to a new parent (sugar over updateCategory) */
export async function moveCategory(id: string, newParentId: string | null) {
  return updateCategory(id, { parentId: newParentId });
}

/** Put category to a target sort order (sugar over updateCategory) */
export async function reorderCategory(id: string, sortOrder: number) {
  const cat = await Category.findById(id).select("parentId");
  if (!cat) throw new AppError(StatusCodes.NOT_FOUND, "Category not found");
  return updateCategory(
    id,
    { sortOrder, parentId: cat.parentId ? String(cat.parentId) : null }
  );
}

export async function removeCategory(id: string, hard = false) {
  return deleteCategory(id, hard);
}

export const CategoryService = {
  createCategory,
  updateCategory,
  getCategoryById,
  getCategoryBySlug,
  listCategories,
  getCategoryTree,
  deleteCategory,
  moveCategory,
  reorderCategory,
  removeCategory,
};
