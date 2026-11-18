import { registerAs } from '@nestjs/config';
import { z } from 'zod';

export const kafkaConfigSchema = z.object({
  brokers: z.array(z.string().min(1)).min(1),
});

export type KafkaConfig = z.infer<typeof kafkaConfigSchema>;

export const kafkaEnvSchema = z.object({
  KAFKA_BROKERS: z
    .string()
    .min(1)
    .transform((value) =>
      value
        .split(',')
        .map((broker) => broker.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.string().min(1)).min(1)),
});

export const kafkaConfig = registerAs('kafka', (): KafkaConfig => {
  const brokers = (process.env.KAFKA_BROKERS ?? '')
    .split(',')
    .map((broker) => broker.trim())
    .filter(Boolean);

  return kafkaConfigSchema.parse({ brokers });
});
