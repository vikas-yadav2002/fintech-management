import { z } from 'zod';

// Forward declaration of the schemas
let UserSchema: z.ZodObject<any>;
let AccountSchema: z.ZodObject<any>;
let TransactionSchema: z.ZodObject<any>;

// Define TransactionSchema first since it doesn't have circular dependencies
TransactionSchema = z.object({
    id: z.number().int().optional(),
    amount: z.number(),
    type: z.enum(['DEPOSIT', 'WITHDRAWAL', 'TRANSFER']),
    fromAccountId: z.number().int(),
    toAccountId: z.number().int(),
    status: z.string().nullable().optional(), // Optional nullable field
    description: z.string().nullable().optional(), // Optional nullable field
    time: z.date().optional(),
    fromAccount: z.lazy(() => AccountSchema).optional(), // Reference to AccountSchema
    toAccount: z.lazy(() => AccountSchema).optional(),   // Reference to AccountSchema
});

// Now define AccountSchema, using the forward-declared UserSchema
AccountSchema = z.object({
    id: z.number().int().optional(),
    user_id: z.number().int(),
    type: z.string(),
    balance: z.number(),
    // user: z.lazy(() => UserSchema), // Reference to UserSchema
    transactionsFrom: z.array(z.lazy(() => TransactionSchema)).optional(), // Optional because relations can be absent in some cases
    transactionsTo: z.array(z.lazy(() => TransactionSchema)).optional(),   // Optional because relations can be absent in some cases
    createdAt: z.date().optional(),
});

//  UserSchema, now referring to AccountSchema
UserSchema = z.object({
    id: z.number().int().optional(),
    username: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    password: z.string(),
    accounts: z.array(z.lazy(() => AccountSchema)), // Reference to AccountSchema
});

// Export the schemas
export { UserSchema, AccountSchema, TransactionSchema };

// Infer the TypeScript types from the schemas
export type User = z.infer<typeof UserSchema>;
export type Account = z.infer<typeof AccountSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
