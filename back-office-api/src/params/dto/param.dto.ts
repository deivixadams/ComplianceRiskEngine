import { z } from 'zod';

export const ParamUpdateSchema = z.object({
    configurableValue: z.number().min(0, "Value must be positive"),
    changeReason: z.string().min(1, "Reason is required"),
});

export type ParamUpdateDto = z.infer<typeof ParamUpdateSchema>;

export const CreateProfileSchema = z.object({
    profileName: z.string().min(3, "Profile name too short"),
    jurisdictionId: z.string().uuid().optional(),
    parameterValues: z.array(z.object({
        paramId: z.string().uuid(),
        value: z.number(),
    })).min(1, "At least one parameter value is required"),
});

export type CreateProfileDto = z.infer<typeof CreateProfileSchema>;
