import * as z from "zod";

const envSchema = z.object({
  /**
   * CI実行中か
   */
  CI: z.stringbool().default(false),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
