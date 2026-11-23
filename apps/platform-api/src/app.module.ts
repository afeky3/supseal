import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { AnalyticsModule } from "./analytics/analytics.module";
import { AuditLogModule } from "./audit-log/audit-log.module";
import { AuthModule } from "./auth/auth.module";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";
import { RolesGuard } from "./auth/guards/roles.guard";
import { BrandsModule } from "./brands/brands.module";
import { CouponsModule } from "./coupons/coupons.module";
import { FraudModule } from "./fraud/fraud.module";
import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ProductsModule } from "./products/products.module";
import { StickerBatchesModule } from "./sticker-batches/sticker-batches.module";
import { SubscriptionsModule } from "./subscriptions/subscriptions.module";
import { SupportTicketsModule } from "./support-tickets/support-tickets.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    HealthModule,
    BrandsModule,
    ProductsModule,
    StickerBatchesModule,
    AnalyticsModule,
    AuditLogModule,
    FraudModule,
    CouponsModule,
    SupportTicketsModule,
    SubscriptionsModule,
    UsersModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
