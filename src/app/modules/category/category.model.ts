/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Model, Schema, Types } from "mongoose";
import { ICategory } from "./category.interface";
import { computeTreeFields, normalizeSlug } from "./category.tree";

/** স্ট্যাটিক মেথড ইন্টারফেস */
export interface ICategoryModel extends Model<ICategory> {
  getNextSortOrder(parentId?: Types.ObjectId | null): Promise<number>;
}

/* ───────────────── Schema ───────────────── */
const CategorySchema = new Schema<ICategory, ICategoryModel>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, index: true, unique: true },

    icon: { type: String, default: null },
    parentId: { type: Schema.Types.ObjectId, ref: "Category", default: null },

    path: { type: String, required: true, index: true },   // ← index এখানে রাখা হয়েছে
    level: { type: Number, required: true, default: 0 },
    ancestors: [{ type: Schema.Types.ObjectId, ref: "Category", index: true }],

    sortOrder: { type: Number, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

/* Indexes (ডুপ্লিকেট এড়াতে path-এ অতিরিক্ত index() কল দিচ্ছি না) */
CategorySchema.index({ parentId: 1, sortOrder: 1 });
// CategorySchema.index({ path: 1 }); // ❌ আর দরকার নেই, উপরে field-level index দেওয়া আছে
CategorySchema.index({ ancestors: 1 });

/* ────────── Statics ────────── */
CategorySchema.statics.getNextSortOrder = async function (
  this: ICategoryModel,
  parentId?: Types.ObjectId | null
) {
  const filter = parentId ? { parentId } : { parentId: null };
  const top = await this.find(filter)
    .sort({ sortOrder: -1 })
    .limit(1)
    .select("sortOrder")
    .lean();
  const current = top[0]?.sortOrder ?? 0;
  return current + 1;
};

/* ────────── Hooks ────────── */
/* ────────── Hooks ────────── */

// validation-এর আগেই slug + path/level/ancestors সেট করি
CategorySchema.pre("validate", async function (next) {
  try {
    const Category = this.constructor as unknown as ICategoryModel;

    if (!this.slug) this.slug = normalizeSlug(this.name);
    else this.slug = normalizeSlug(this.slug);

    await computeTreeFields(this as ICategory, Category);
    next();
  } catch (err) {
    next(err as any);
  }
});

// save-এর আগে sortOrder না থাকলে অটো assign
CategorySchema.pre("save", async function (next) {
  try {
    const Category = this.constructor as unknown as ICategoryModel;

    if (this.isNew && (this.sortOrder === undefined || this.sortOrder === null)) {
      this.sortOrder = await Category.getNextSortOrder(this.parentId as any);
    }
    next();
  } catch (err) {
    next(err as any);
  }
});

CategorySchema.post("findOneAndUpdate", async function (doc: ICategory | null, next) {
  try {
    if (!doc) return next();

    const Category = this.model as unknown as ICategoryModel;

    if (doc.slug) doc.slug = normalizeSlug(doc.slug);
    await computeTreeFields(doc, Category);

    // একই ট্রান্স্যাকশন ধরে রাখতে query options থেকে session নিই
    const opts = (this as any).getOptions?.() || {};
    const session = opts.session;

    await Category.updateOne(
      { _id: doc._id },
      {
        $set: {
          slug: doc.slug,
          level: doc.level,
          path: doc.path,
          ancestors: doc.ancestors,
        },
      },
      session ? { session } : undefined
    ).exec();

    next();
  } catch (err) {
    next(err as any);
  }
});


/* ────────── Model ────────── */
const Category = mongoose.model<ICategory, ICategoryModel>("Category", CategorySchema);
export default Category;
