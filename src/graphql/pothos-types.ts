/* eslint-disable */
import type { Prisma, User, BudgetCycle, CapitalEntry, Car, Cost, Payout } from "@prisma/client";
import type { PothosPrismaDatamodel } from "@pothos/plugin-prisma";
export default interface PrismaTypes {
    User: {
        Name: "User";
        Shape: User;
        Include: Prisma.UserInclude;
        Select: Prisma.UserSelect;
        OrderBy: Prisma.UserOrderByWithRelationInput;
        WhereUnique: Prisma.UserWhereUniqueInput;
        Where: Prisma.UserWhereInput;
        Create: {};
        Update: {};
        RelationName: "cyclesOpened" | "capitalEntries" | "carsBought" | "costs" | "payouts";
        ListRelations: "cyclesOpened" | "capitalEntries" | "carsBought" | "costs" | "payouts";
        Relations: {
            cyclesOpened: {
                Shape: BudgetCycle[];
                Name: "BudgetCycle";
                Nullable: false;
            };
            capitalEntries: {
                Shape: CapitalEntry[];
                Name: "CapitalEntry";
                Nullable: false;
            };
            carsBought: {
                Shape: Car[];
                Name: "Car";
                Nullable: false;
            };
            costs: {
                Shape: Cost[];
                Name: "Cost";
                Nullable: false;
            };
            payouts: {
                Shape: Payout[];
                Name: "Payout";
                Nullable: false;
            };
        };
    };
    BudgetCycle: {
        Name: "BudgetCycle";
        Shape: BudgetCycle;
        Include: Prisma.BudgetCycleInclude;
        Select: Prisma.BudgetCycleSelect;
        OrderBy: Prisma.BudgetCycleOrderByWithRelationInput;
        WhereUnique: Prisma.BudgetCycleWhereUniqueInput;
        Where: Prisma.BudgetCycleWhereInput;
        Create: {};
        Update: {};
        RelationName: "openedBy" | "capitalEntries" | "cars" | "payouts";
        ListRelations: "capitalEntries" | "cars" | "payouts";
        Relations: {
            openedBy: {
                Shape: User;
                Name: "User";
                Nullable: false;
            };
            capitalEntries: {
                Shape: CapitalEntry[];
                Name: "CapitalEntry";
                Nullable: false;
            };
            cars: {
                Shape: Car[];
                Name: "Car";
                Nullable: false;
            };
            payouts: {
                Shape: Payout[];
                Name: "Payout";
                Nullable: false;
            };
        };
    };
    CapitalEntry: {
        Name: "CapitalEntry";
        Shape: CapitalEntry;
        Include: Prisma.CapitalEntryInclude;
        Select: Prisma.CapitalEntrySelect;
        OrderBy: Prisma.CapitalEntryOrderByWithRelationInput;
        WhereUnique: Prisma.CapitalEntryWhereUniqueInput;
        Where: Prisma.CapitalEntryWhereInput;
        Create: {};
        Update: {};
        RelationName: "cycle" | "createdBy";
        ListRelations: never;
        Relations: {
            cycle: {
                Shape: BudgetCycle;
                Name: "BudgetCycle";
                Nullable: false;
            };
            createdBy: {
                Shape: User;
                Name: "User";
                Nullable: false;
            };
        };
    };
    Car: {
        Name: "Car";
        Shape: Car;
        Include: Prisma.CarInclude;
        Select: Prisma.CarSelect;
        OrderBy: Prisma.CarOrderByWithRelationInput;
        WhereUnique: Prisma.CarWhereUniqueInput;
        Where: Prisma.CarWhereInput;
        Create: {};
        Update: {};
        RelationName: "cycle" | "boughtBy" | "costs";
        ListRelations: "costs";
        Relations: {
            cycle: {
                Shape: BudgetCycle;
                Name: "BudgetCycle";
                Nullable: false;
            };
            boughtBy: {
                Shape: User;
                Name: "User";
                Nullable: false;
            };
            costs: {
                Shape: Cost[];
                Name: "Cost";
                Nullable: false;
            };
        };
    };
    Cost: {
        Name: "Cost";
        Shape: Cost;
        Include: Prisma.CostInclude;
        Select: Prisma.CostSelect;
        OrderBy: Prisma.CostOrderByWithRelationInput;
        WhereUnique: Prisma.CostWhereUniqueInput;
        Where: Prisma.CostWhereInput;
        Create: {};
        Update: {};
        RelationName: "car" | "createdBy";
        ListRelations: never;
        Relations: {
            car: {
                Shape: Car;
                Name: "Car";
                Nullable: false;
            };
            createdBy: {
                Shape: User;
                Name: "User";
                Nullable: false;
            };
        };
    };
    Payout: {
        Name: "Payout";
        Shape: Payout;
        Include: Prisma.PayoutInclude;
        Select: Prisma.PayoutSelect;
        OrderBy: Prisma.PayoutOrderByWithRelationInput;
        WhereUnique: Prisma.PayoutWhereUniqueInput;
        Where: Prisma.PayoutWhereInput;
        Create: {};
        Update: {};
        RelationName: "cycle" | "createdBy";
        ListRelations: never;
        Relations: {
            cycle: {
                Shape: BudgetCycle;
                Name: "BudgetCycle";
                Nullable: false;
            };
            createdBy: {
                Shape: User;
                Name: "User";
                Nullable: false;
            };
        };
    };
}
export function getDatamodel(): PothosPrismaDatamodel { return JSON.parse("{\"datamodel\":{\"models\":{\"User\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"name\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"email\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":true,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"passwordHash\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Role\",\"kind\":\"enum\",\"name\":\"role\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"BudgetCycle\",\"kind\":\"object\",\"name\":\"cyclesOpened\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"CycleOpenedBy\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"CapitalEntry\",\"kind\":\"object\",\"name\":\"capitalEntries\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"CapitalEntryToUser\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"Car\",\"kind\":\"object\",\"name\":\"carsBought\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"CarBoughtBy\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"Cost\",\"kind\":\"object\",\"name\":\"costs\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"CostToUser\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"Payout\",\"kind\":\"object\",\"name\":\"payouts\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"PayoutToUser\",\"relationFromFields\":[],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"BudgetCycle\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"title\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"CycleStatus\",\"kind\":\"enum\",\"name\":\"status\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Decimal\",\"kind\":\"scalar\",\"name\":\"initialAmount\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"openedAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"closedAt\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"openedById\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"User\",\"kind\":\"object\",\"name\":\"openedBy\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"CycleOpenedBy\",\"relationFromFields\":[\"openedById\"],\"isUpdatedAt\":false},{\"type\":\"CapitalEntry\",\"kind\":\"object\",\"name\":\"capitalEntries\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BudgetCycleToCapitalEntry\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"Car\",\"kind\":\"object\",\"name\":\"cars\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BudgetCycleToCar\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"Payout\",\"kind\":\"object\",\"name\":\"payouts\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BudgetCycleToPayout\",\"relationFromFields\":[],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"CapitalEntry\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"cycleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"BudgetCycle\",\"kind\":\"object\",\"name\":\"cycle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BudgetCycleToCapitalEntry\",\"relationFromFields\":[\"cycleId\"],\"isUpdatedAt\":false},{\"type\":\"CapitalKind\",\"kind\":\"enum\",\"name\":\"kind\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Decimal\",\"kind\":\"scalar\",\"name\":\"amount\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"note\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"receiptNumber\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"createdById\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"User\",\"kind\":\"object\",\"name\":\"createdBy\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"CapitalEntryToUser\",\"relationFromFields\":[\"createdById\"],\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"Car\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"cycleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"BudgetCycle\",\"kind\":\"object\",\"name\":\"cycle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BudgetCycleToCar\",\"relationFromFields\":[\"cycleId\"],\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"title\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Int\",\"kind\":\"scalar\",\"name\":\"year\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"color\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"plate\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"CarStatus\",\"kind\":\"enum\",\"name\":\"status\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Decimal\",\"kind\":\"scalar\",\"name\":\"purchasePrice\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"purchasedAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"purchaseReceiptNumber\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Decimal\",\"kind\":\"scalar\",\"name\":\"salePrice\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"soldAt\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"saleReceiptNumber\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Decimal\",\"kind\":\"scalar\",\"name\":\"totalCost\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Decimal\",\"kind\":\"scalar\",\"name\":\"profit\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Decimal\",\"kind\":\"scalar\",\"name\":\"companyShare\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Decimal\",\"kind\":\"scalar\",\"name\":\"managerShare\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"note\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"boughtById\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"User\",\"kind\":\"object\",\"name\":\"boughtBy\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"CarBoughtBy\",\"relationFromFields\":[\"boughtById\"],\"isUpdatedAt\":false},{\"type\":\"Cost\",\"kind\":\"object\",\"name\":\"costs\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"CarToCost\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"Cost\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"carId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Car\",\"kind\":\"object\",\"name\":\"car\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"CarToCost\",\"relationFromFields\":[\"carId\"],\"isUpdatedAt\":false},{\"type\":\"CostCategory\",\"kind\":\"enum\",\"name\":\"category\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Decimal\",\"kind\":\"scalar\",\"name\":\"amount\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"description\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"receiptNumber\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"spentAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"createdById\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"User\",\"kind\":\"object\",\"name\":\"createdBy\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"CostToUser\",\"relationFromFields\":[\"createdById\"],\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"Payout\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"cycleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"BudgetCycle\",\"kind\":\"object\",\"name\":\"cycle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BudgetCycleToPayout\",\"relationFromFields\":[\"cycleId\"],\"isUpdatedAt\":false},{\"type\":\"Decimal\",\"kind\":\"scalar\",\"name\":\"amount\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"note\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"receiptNumber\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"paidAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"createdById\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"User\",\"kind\":\"object\",\"name\":\"createdBy\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"PayoutToUser\",\"relationFromFields\":[\"createdById\"],\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]}}}}"); }