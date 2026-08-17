import type { IOrm, ISchemas } from '@shared/types/db';
import { eq } from 'drizzle-orm';

const migrate = async (orm: IOrm, schemas: ISchemas): Promise<void> => {
  // tbl_setting insert association
  await orm.delete(schemas.setting).where(eq(schemas.setting.key, 'association'));
  await orm.insert(schemas.setting).values({
    key: 'association',
    value: { data: 'douban' },
  });

  // tbl_setting update disclaimer
  await orm
    .update(schemas.setting)
    .set({ value: { data: false } })
    .where(eq(schemas.setting.key, 'disclaimer'));
};

export default migrate;
