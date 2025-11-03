// src/app/builder/QueryBuilder.ts
import { FilterQuery, Query } from 'mongoose';

class QueryBuilder<T> {
  public modelQuery: Query<T[], T>;
  public query: Record<string, unknown>;

  constructor(modelQuery: Query<T[], T>, query: Record<string, unknown>) {
    this.modelQuery = modelQuery;
    this.query = query;
  }

  /**
   * Text search across multiple fields using case-insensitive regex.
   * If "phone" is included in searchableFields, we also add a digits-only regex
   * so inputs like "+880-17 12-34(567)" still match stored normalized values.
   */
  search(searchableFields: string[]) {
    const raw = this?.query?.searchTerm as string | undefined;

    if (raw && searchableFields.length) {
      const searchTerm = String(raw);
      const phoneDigits = searchTerm.replace(/\D+/g, '');

      const orConds: FilterQuery<T>[] = searchableFields.map(
        (field) =>
          ({
            [field]: { $regex: searchTerm, $options: 'i' },
          }) as FilterQuery<T>
      );

      // Extra: for phone fields, also match by digits-only variant
      if (
        searchableFields.includes('phone') &&
        phoneDigits &&
        phoneDigits !== searchTerm
      ) {
        orConds.push(
          { ['phone' as keyof T]: { $regex: phoneDigits, $options: 'i' } } as unknown as FilterQuery<T>
        );
      }

      this.modelQuery = this.modelQuery.find({ $or: orConds });
    }

    return this;
  }

  /**
   * Generic filtering from query params.
   * Excludes reserved keys then applies the rest directly to find().
   */
  filter() {
    const queryObj: Record<string, unknown> = { ...this.query };

    // Reserved keys that shouldn't participate in filtering
    const excludeFields = ['searchTerm', 'sort', 'limit', 'page', 'fields', 'minPrice', 'maxPrice'];

    excludeFields.forEach((key) => delete queryObj[key]);

    this.modelQuery = this.modelQuery.find(queryObj as FilterQuery<T>);

    return this;
  }

  /**
   * Sort by comma-separated list: "name,-createdAt" -> "name -createdAt"
   * Defaults to newest first.
   */
  sort() {
    const sort =
      (this?.query?.sort as string)?.split(',')?.join(' ') || '-createdAt';

    this.modelQuery = this.modelQuery.sort(sort as string);
    return this;
  }

  /**
   * Pagination using page & limit. Defaults: page=1, limit=10.
   */
  paginate() {
    const page = Number(this?.query?.page) || 1;
    const limit = Number(this?.query?.limit) || 10;
    const skip = (page - 1) * limit;

    this.modelQuery = this.modelQuery.skip(skip).limit(limit);
    return this;
  }

  /**
   * Field selection by comma list. Defaults to excluding __v.
   */
  fields() {
    const fields =
      (this?.query?.fields as string)?.split(',')?.join(' ') || '-__v';

    this.modelQuery = this.modelQuery.select(fields);
    return this;
  }

  /**
   * Count with the currently built filters.
   */
  async countTotal() {
    const totalQueries = this.modelQuery.getFilter();
    const total = await this.modelQuery.model.countDocuments(totalQueries);
    const page = Number(this?.query?.page) || 1;
    const limit = Number(this?.query?.limit) || 10;
    const totalPage = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPage,
    };
  }

  /**
   * Price range filter.
   * You can pass minPrice/maxPrice directly OR rely on req.query.minPrice/maxPrice.
   */
  priceRange(minPrice?: number, maxPrice?: number) {
    // Prefer explicit args; fallback to query params if not provided
    const qMin =
      minPrice !== undefined
        ? minPrice
        : this.query?.minPrice !== undefined
        ? Number(this.query.minPrice)
        : undefined;

    const qMax =
      maxPrice !== undefined
        ? maxPrice
        : this.query?.maxPrice !== undefined
        ? Number(this.query.maxPrice)
        : undefined;

    const priceFilter: Record<string, unknown> = {};
    if (qMin !== undefined) priceFilter.$gte = qMin;
    if (qMax !== undefined) priceFilter.$lte = qMax;

    if (qMin !== undefined || qMax !== undefined) {
      this.modelQuery = this.modelQuery.find({
        price: priceFilter,
      } as FilterQuery<T>);
    }

    return this;
  }
}

export default QueryBuilder;
