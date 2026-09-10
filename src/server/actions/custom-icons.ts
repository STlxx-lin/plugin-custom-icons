export const createCustomIconsResource = (app: any, resourceName = 'custom_icons') => ({
  name: resourceName,
  actions: {
    async list(ctx: any, next: any) {
      const repo = app.db.getRepository('custom_icons');
      const params = { ...ctx.request.query, ...ctx.action.params };
      const { category, search } = params;
      const filter: any = {};
      if (category && category !== 'all') {
        filter.category = category;
      }
      if (search) {
        filter.$or = [
          { name: { $includes: search } },
          { title: { $includes: search } },
        ];
      }
      const items = await repo.find({
        filter,
        order: [['sort', 'ASC'], ['id', 'DESC']],
      });
      ctx.body = items;
      await next();
    },

    async create(ctx: any, next: any) {
      const repo = app.db.getRepository('custom_icons');
      const values = ctx.action.params?.values || ctx.request.body || {};
      if (!values.name || !values.svg) {
        ctx.throw(400, '图标标识(name)和SVG内容(svg)不能为空');
      }
      values.name = values.name.trim().toLowerCase();
      values.category = values.category?.trim() || 'custom';
      values.title = values.title?.trim() || values.name;

      const existing = await repo.findOne({ filter: { name: values.name } });
      if (existing) {
        await repo.update({
          filterByTk: existing.id,
          values,
        });
        ctx.body = await repo.findOne({ filterByTk: existing.id });
      } else {
        ctx.body = await repo.create({ values });
      }
      await next();
    },

    async batchCreate(ctx: any, next: any) {
      const repo = app.db.getRepository('custom_icons');
      const body = ctx.action.params?.values || ctx.request.body || {};
      const items = Array.isArray(body) ? body : body.items;
      if (!Array.isArray(items) || items.length === 0) {
        ctx.throw(400, 'items 必须为非空数组');
      }
      const results: any[] = [];
      for (const item of items) {
        if (!item.name || !item.svg) continue;
        const name = item.name.trim().toLowerCase();
        const values = {
          name,
          title: item.title?.trim() || name,
          category: item.category?.trim() || 'custom',
          svg: item.svg,
          source: item.source || 'upload',
          sort: Number(item.sort) || 0,
        };
        const existing = await repo.findOne({ filter: { name } });
        if (existing) {
          await repo.update({ filterByTk: existing.id, values });
          results.push({ ...(existing.toJSON ? existing.toJSON() : existing), ...values });
        } else {
          const created = await repo.create({ values });
          results.push(created);
        }
      }
      ctx.body = { count: results.length, items: results };
      await next();
    },

    async update(ctx: any, next: any) {
      const repo = app.db.getRepository('custom_icons');
      const filterByTk =
        ctx.action.params?.filterByTk ||
        ctx.request.query?.filterByTk ||
        ctx.request.body?.id ||
        ctx.request.body?.filterByTk;
      const values = ctx.action.params?.values || ctx.request.body || {};

      if (values.svg) {
        values.svg = values.svg.trim();
      }
      if (values.title) {
        values.title = values.title.trim();
      }
      if (values.category) {
        values.category = values.category.trim();
      }

      let updatedRecord: any = null;
      if (filterByTk) {
        await repo.update({ filterByTk, values });
        updatedRecord = await repo.findOne({ filterByTk });
      } else if (values.name) {
        const name = String(values.name).trim().toLowerCase();
        await repo.update({ filter: { name }, values });
        updatedRecord = await repo.findOne({ filter: { name } });
      } else {
        ctx.throw(400, '请提供要更新的图标 ID 或 name');
      }

      ctx.body = updatedRecord;
      await next();
    },

    async destroy(ctx: any, next: any) {
      const repo = app.db.getRepository('custom_icons');
      const filterByTk =
        ctx.action.params?.filterByTk ||
        ctx.request.query?.filterByTk ||
        ctx.request.body?.filterByTk;
      const name =
        ctx.action.params?.name ||
        ctx.request.query?.name ||
        ctx.request.body?.name;

      if (filterByTk) {
        if (Array.isArray(filterByTk) && filterByTk.length > 200) {
          const CHUNK = 200;
          for (let i = 0; i < filterByTk.length; i += CHUNK) {
            await repo.destroy({ filterByTk: filterByTk.slice(i, i + CHUNK) });
          }
        } else {
          await repo.destroy({ filterByTk });
        }
      } else if (name) {
        await repo.destroy({ filter: { name: String(name).trim().toLowerCase() } });
      } else {
        ctx.throw(400, '请指定要删除的图标 ID 或 name');
      }
      ctx.body = { success: true };
      await next();
    },

    async getCategories(ctx: any, next: any) {
      const repo = app.db.getRepository('custom_icons');
      const items = await repo.find({
        fields: ['category'],
      });
      const set = new Set<string>();
      set.add('custom');
      items.forEach((item: any) => {
        if (item.category) set.add(item.category);
      });
      ctx.body = Array.from(set);
      await next();
    },
  },
});
